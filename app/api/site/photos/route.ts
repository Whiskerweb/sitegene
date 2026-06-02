import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listSitePhotos, collectUsedPhotoUrls } from "@/lib/site-photos";

/**
 * Liste les photos de la bibliothèque d'un site. Sert le picker « Choisir dans
 * la bibliothèque » de l'éditeur (composant client → ne peut pas requêter le
 * client admin directement). Renvoie aussi les URLs utilisées (badge « Utilisée »).
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
  if (!siteId) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  const photos = await listSitePhotos(admin, siteId);

  const { data: top } = await admin
    .from("site_content")
    .select("content_json")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const usedUrls = [...collectUsedPhotoUrls(top?.content_json, siteId)];

  return NextResponse.json({ photos, usedUrls });
}
