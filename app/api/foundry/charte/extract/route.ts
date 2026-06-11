import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";
import { repairCharte, vibeToSpec, CHARTE_FONTS } from "@/lib/foundry/charte";

export const maxDuration = 60;

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const IMAGE_TYPES: Record<string, true> = { "image/jpeg": true, "image/png": true, "image/webp": true };

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
      max_tokens: 900,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

function extractionPrompt(): string {
  const headings = CHARTE_FONTS.filter((f) => f.roles.includes("heading")).map((f) => f.family).join(", ");
  const bodies = CHARTE_FONTS.filter((f) => f.roles.includes("body")).map((f) => f.family).join(", ");
  return `Tu es directeur artistique. Ce document est la charte graphique (brand sheet) d'un client : extrais-en une charte de site web.

RÈGLES :
- Les couleurs en hexadécimal 6 caractères, lues dans le document (logo, pastilles, fonds). accent = LA couleur de marque dominante.
- mode : "dark" si l'identité est manifestement sombre, sinon "light".
- headingFont : la fonte de la liste qui RESSEMBLE LE PLUS aux titres du document, parmi : ${headings}.
- bodyFont : idem pour le texte courant, parmi : ${bodies}.
- corners : "sharp", "soft" ou "round" selon la personnalité (anguleux, équilibré, organique).
- name : le nom de la marque si lisible, sinon un nom de charte évocateur. mood : 3 adjectifs français.
- reason : 1 phrase française qui décrit ce que tu as reconnu dans le document.

SORTIE : JSON STRICT, rien d'autre :
{"name":"…","mood":["…","…","…"],"mode":"light","ink":"#xxxxxx","surface":"#xxxxxx","card":"#xxxxxx","accent":"#xxxxxx","accent2":"#xxxxxx","muted":"#xxxxxx","headingFont":"…","bodyFont":"…","corners":"soft","reason":"…"}`;
}

/**
 * Extraction d'une charte graphique depuis un fichier client (image ou PDF) :
 * Mistral vision lit le document, la sortie est réparée par repairCharte
 * (contrastes WCAG, fonts liste blanche) — même garanties que les chartes IA.
 * Public (étape DA, avant compte) : rate-limité IP serré, le coût vision est réel.
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`extract:${requestIp(request)}`, { windowMs: 60_000, max: 4 })) {
    return NextResponse.json({ error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  const isImage = !!IMAGE_TYPES[file.type];
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) {
    return NextResponse.json({ error: "Format non supporté (image JPG/PNG/WebP ou PDF)." }, { status: 400 });
  }
  if (file.size > (isPdf ? 10 : 8) * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop lourd." }, { status: 400 });
  }

  try {
    const parts: VisionPart[] = [{ type: "text", text: extractionPrompt() }];
    if (isImage) {
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      parts.push({ type: "image_url", image_url: `data:${file.type};base64,${b64}` });
    } else {
      // PDF : Mistral lit par URL — dépôt éphémère dans le staging public.
      const admin = createAdminClient();
      const path = `staging/extract/${randomUUID()}.pdf`;
      const { error } = await admin.storage
        .from("site-photos")
        .upload(path, await file.arrayBuffer(), { contentType: "application/pdf", upsert: false });
      if (error) throw new Error(error.message);
      const url = admin.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
      parts.push({ type: "document_url", document_url: url });
    }

    const model = isImage
      ? process.env.MISTRAL_VISION_MODEL || "pixtral-large-latest"
      : process.env.MISTRAL_MODEL || "mistral-large-latest";
    const raw = await visionChat(model, parts);

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("réponse illisible");
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;

    const vibe = repairCharte(parsed);
    const spec = { ...vibeToSpec(vibe) };
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim().slice(0, 180)
        : "Extraite de votre charte graphique.";

    return NextResponse.json({ ok: true, charte: { vibe, spec, reason } });
  } catch (e) {
    console.error("[foundry/charte/extract]", e instanceof Error ? e.message : e);
    return NextResponse.json({
      ok: false,
      error: "Lecture impossible — essayez une image nette de votre charte (capture ou photo).",
    });
  }
}
