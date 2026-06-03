/**
 * Upload des photos du client vers Storage (bucket site-photos/{siteId}/) puis
 * append des URLs publiques à l'intake. Le mapping slot→photo (ordre) est fait
 * à la (re)construction du contenu. Garde-fou d'ownership.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getUser } from "@/lib/auth";
import { appendPhotoUrls, userOwnsSite } from "@/lib/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

const BUCKET = "site-photos";
const MAX_PHOTOS = 24;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(form.get("siteId") ?? "");
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const admin = createAdminClient();
  const urls: string[] = [];
  let count = 0;
  for (const [key, value] of form.entries()) {
    if (key !== "photo") continue;
    if (!(value instanceof File) || value.size === 0) continue;
    if (value.size > MAX_PHOTO_BYTES) continue;
    if (count >= MAX_PHOTOS) break;
    count++;

    const ext = (value.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const path = `${siteId}/${randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, await value.arrayBuffer(), {
        contentType: value.type || "image/jpeg",
        upsert: true,
      });
    if (upErr) {
      console.error("[onboarding/photos] upload:", upErr.message);
      continue;
    }
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  const photoUrls = await appendPhotoUrls(siteId, urls);
  return NextResponse.json({ added: urls.length, photoUrls });
}
