import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectUsedPhotoUrls } from "@/lib/site-photos";

/**
 * Suppression GRATUITE d'une photo de la bibliothèque (bucket site-photos).
 * Si la photo est utilisée dans le contenu du site et que `force` n'est pas
 * fourni → 409 { error: "used" } : le client demande confirmation. On ne
 * réécrit JAMAIS le content_json (le slot pointera vers une URL morte jusqu'au
 * remplacement dans l'éditeur).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = String(body?.siteId ?? "");
  const path = String(body?.path ?? "");
  const force = Boolean(body?.force);

  // Anti path-traversal : le chemin doit appartenir au dossier du site.
  if (!siteId || !path || !path.startsWith(`${siteId}/`)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  // URL publique de l'objet → comparée aux URLs présentes dans le contenu.
  const { data: pub } = admin.storage.from("site-photos").getPublicUrl(path);

  const { data: top } = await admin
    .from("site_content")
    .select("content_json")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const used = collectUsedPhotoUrls(top?.content_json, siteId);
  const wasUsed = used.has(pub.publicUrl);

  if (wasUsed && !force) {
    return NextResponse.json(
      { error: "used", used: true, message: "Cette photo est utilisée sur votre site." },
      { status: 409 },
    );
  }

  const { error } = await admin.storage.from("site-photos").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, wasUsed });
}
