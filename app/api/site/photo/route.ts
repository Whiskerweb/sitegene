import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Upload GRATUIT d'une photo pour l'éditeur. Stocke dans site-photos/<siteId>/.
 * Renvoie l'URL publique ; le client l'applique au slot via l'autosave brouillon.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const form = await request.formData();
  const siteId = String(form.get("siteId") ?? "");
  const file = form.get("file");

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
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

  const objectPath = `${siteId}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("site-photos")
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: pub } = admin.storage.from("site-photos").getPublicUrl(objectPath);
  return NextResponse.json({ url: pub.publicUrl, path: objectPath });
}
