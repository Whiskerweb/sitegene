import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";
import { chat } from "@/lib/mistral";

export const maxDuration = 60;

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const IMAGE_TYPES: Record<string, true> = { "image/jpeg": true, "image/png": true, "image/webp": true };
const MAX_TEXT = 24_000; // borne le coût Mistral pour les gros tableurs / collages

type ReviewItem = { text: string; name: string; role?: string; rating?: number };

type VisionPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: string }
  | { type: "document_url"; document_url: string };

/** Appel Mistral multimodal (image en data-URI ou PDF par URL publique). */
async function visionChat(model: string, parts: VisionPart[]): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY manquant.");
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: parts }],
      max_tokens: 2200,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

function extractionPrompt(): string {
  return `Tu extrais des AVIS CLIENTS d'un document brut (tableur, texte, ou copier-coller).
N'INVENTE RIEN : si le document ne contient pas d'avis exploitable, renvoie {"reviews":[]}.

RÈGLES :
- text : le verbatim de l'avis (OBLIGATOIRE, non vide).
- name : prénom/nom de l'auteur si présent, sinon "".
- role : contexte (prestation, ville, date, type de client) si présent, sinon "".
- rating : note sur 5 (nombre) si présente, sinon omets la clé.
- Ignore les en-têtes de colonnes, lignes vides, totaux et notes de bas de page.
- Garde au plus 24 avis, les plus complets et lisibles.

SORTIE : JSON STRICT, rien d'autre :
{"reviews":[{"text":"…","name":"…","role":"…","rating":5}]}`;
}

/** Décode le contenu textuel d'un fichier tableur / texte / Word en texte brut. */
async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || /spreadsheet|ms-excel/.test(file.type)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    return wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n").slice(0, MAX_TEXT);
  }
  if (name.endsWith(".docx") || /wordprocessingml/.test(file.type)) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value.slice(0, MAX_TEXT);
  }
  // CSV / TXT / collage brut.
  return buf.toString("utf-8").slice(0, MAX_TEXT);
}

/** Normalise la sortie Mistral en liste d'avis sûre (text non vide, cappée). */
function shapeReviews(raw: string): ReviewItem[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("réponse illisible");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as { reviews?: unknown };
  const list = Array.isArray(parsed.reviews) ? parsed.reviews : [];
  return list
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => {
      const rating = typeof r.rating === "number" && Number.isFinite(r.rating)
        ? Math.max(0, Math.min(5, r.rating))
        : undefined;
      return {
        text: typeof r.text === "string" ? r.text.trim().slice(0, 600) : "",
        name: typeof r.name === "string" ? r.name.trim().slice(0, 60) : "",
        role: typeof r.role === "string" ? r.role.trim().slice(0, 80) : undefined,
        ...(rating !== undefined ? { rating } : {}),
      };
    })
    .filter((r) => r.text.length > 0)
    .slice(0, 24);
}

/**
 * Import d'avis clients depuis un fichier (Excel/CSV, PDF, image, Word) ou un
 * texte collé : Mistral lit le document et le structure en liste d'avis. Public
 * (tunnel /creer, avant compte) → rate-limité serré, le coût Mistral est réel.
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`reviews:${requestIp(request)}`, { windowMs: 60_000, max: 4 })) {
    return NextResponse.json({ ok: false, error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });

  const pasted = typeof form.get("text") === "string" ? (form.get("text") as string).trim() : "";
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && pasted.length < 12) {
    return NextResponse.json({ ok: false, error: "Collez vos avis ou déposez un fichier." }, { status: 400 });
  }

  try {
    let reviews: ReviewItem[];

    if (hasFile) {
      const f = file as File;
      const isImage = !!IMAGE_TYPES[f.type];
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      if (f.size > (isImage ? 8 : 12) * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Fichier trop lourd." }, { status: 400 });
      }

      if (isImage || isPdf) {
        // PDF / image → Mistral vision (lecture du document tel quel).
        const parts: VisionPart[] = [{ type: "text", text: extractionPrompt() }];
        if (isImage) {
          const b64 = Buffer.from(await f.arrayBuffer()).toString("base64");
          parts.push({ type: "image_url", image_url: `data:${f.type};base64,${b64}` });
        } else {
          const admin = createAdminClient();
          const path = `staging/reviews/${randomUUID()}.pdf`;
          const { error } = await admin.storage
            .from("site-photos")
            .upload(path, await f.arrayBuffer(), { contentType: "application/pdf", upsert: false });
          if (error) throw new Error(error.message);
          const url = admin.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
          parts.push({ type: "document_url", document_url: url });
        }
        const model = isImage
          ? process.env.MISTRAL_VISION_MODEL || "pixtral-large-latest"
          : process.env.MISTRAL_MODEL || "mistral-large-latest";
        reviews = shapeReviews(await visionChat(model, parts));
      } else {
        // Tableur / Word / CSV / texte → extraction texte puis structuration.
        const text = await fileToText(f);
        if (text.trim().length < 12) throw new Error("document vide");
        reviews = shapeReviews(
          await chat(
            [
              { role: "system", content: extractionPrompt() },
              { role: "user", content: `DOCUMENT :\n${text}` },
            ],
            { json: true, maxTokens: 2200, temperature: 0.1 },
          ),
        );
      }
    } else {
      // Texte collé directement par l'utilisateur.
      reviews = shapeReviews(
        await chat(
          [
            { role: "system", content: extractionPrompt() },
            { role: "user", content: `AVIS COLLÉS :\n${pasted.slice(0, MAX_TEXT)}` },
          ],
          { json: true, maxTokens: 2200, temperature: 0.1 },
        ),
      );
    }

    if (reviews.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Aucun avis lisible trouvé — vérifiez le fichier ou collez le texte des avis.",
      });
    }

    return NextResponse.json({ ok: true, reviews });
  } catch (e) {
    console.error("[foundry/reviews/extract]", e instanceof Error ? e.message : e);
    return NextResponse.json({
      ok: false,
      error: "Lecture impossible — essayez un autre format (Excel, PDF, capture) ou collez le texte.",
    });
  }
}
