import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";

export const maxDuration = 30;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PHOTOS = 20;

/**
 * Upload photo du tunnel /creer AVANT création de compte : le navigateur génère
 * un draftId (UUID, sessionStorage) et dépose dans site-photos/staging/<draftId>/.
 * Les URLs publiques obtenues sont ensuite fusionnées dans la recette par
 * /api/foundry/links (inject), une fois le compte créé. Bornes : rate limit IP,
 * 20 photos par brouillon, 8 Mo, formats image stricts.
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`photo:${requestIp(request)}`, { windowMs: 60_000, max: 30 })) {
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
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (max 8 Mo)." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format non supporté (jpg, png, webp)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const folder = `staging/${draftId.toLowerCase()}`;

  const { data: existing } = await admin.storage.from("site-photos").list(folder, { limit: MAX_PHOTOS + 1 });
  if ((existing ?? []).length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Limite atteinte : ${MAX_PHOTOS} photos maximum.` }, { status: 409 });
  }

  const objectPath = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("site-photos")
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: pub } = admin.storage.from("site-photos").getPublicUrl(objectPath);
  return NextResponse.json({ url: pub.publicUrl, path: objectPath });
}
