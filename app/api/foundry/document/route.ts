import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";

export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Upload d'un document du tunnel /creer (fiche technique musicien, PDF) AVANT
 * création de compte — même mécanique de staging par draftId que les photos.
 * Le fichier est adopté dans le dossier du site par /api/foundry/links.
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`doc:${requestIp(request)}`, { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ error: "Trop d'envois — réessayez dans une minute." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const draftId = String(form.get("draftId") ?? "");
  const file = form.get("file");
  if (!UUID_RE.test(draftId)) {
    return NextResponse.json({ error: "Brouillon invalide." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Document trop lourd (max 10 Mo)." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Format non supporté (PDF uniquement)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const objectPath = `staging/${draftId.toLowerCase()}/rider-${randomUUID()}.pdf`;
  const { error } = await admin.storage
    .from("site-photos")
    .upload(objectPath, await file.arrayBuffer(), { contentType: "application/pdf", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: pub } = admin.storage.from("site-photos").getPublicUrl(objectPath);
  return NextResponse.json({ url: pub.publicUrl, path: objectPath, name: file.name });
}
