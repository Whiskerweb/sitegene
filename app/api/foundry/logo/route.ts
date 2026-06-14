import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";
import { FOUNDRY_TEMPLATE_ID } from "@/lib/foundry/server";

export const maxDuration = 30;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Upload du LOGO de marque (navbar/footer) sur le bucket site-photos. Deux modes :
 *  - onboarding (avant compte) : `draftId` (UUID, sessionStorage) → staging/<draftId>/logo-…
 *    adopté plus tard dans le dossier du site par /api/foundry/links.
 *  - atelier (connecté) : `siteId` d'un site assemblé possédé → <siteId>/logo-…
 * Formats : png/jpg/webp/svg, 4 Mo max. Le PNG transparent est idéal. Renvoie l'URL publique.
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`logo:${requestIp(request)}`, { windowMs: 60_000, max: 20 })) {
    return NextResponse.json({ error: "Trop d'envois — réessayez dans une minute." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const file = form.get("file");
  const siteId = String(form.get("siteId") ?? "");
  const draftId = String(form.get("draftId") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Logo trop lourd (max 4 Mo)." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format non supporté (png, jpg, webp, svg)." }, { status: 400 });
  }

  const admin = createAdminClient();
  let folder: string;

  if (siteId) {
    // Mode atelier : propriété du site requise.
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
    const { data: site } = await admin
      .from("sites")
      .select("id, owner_user_id, template_id")
      .eq("id", siteId)
      .maybeSingle();
    if (!site || site.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
    }
    if (site.template_id !== FOUNDRY_TEMPLATE_ID) {
      return NextResponse.json({ error: "Ce site n'est pas un site assemblé." }, { status: 400 });
    }
    folder = siteId;
  } else if (UUID_RE.test(draftId)) {
    // Mode onboarding : dépôt anonyme, adopté à la création du compte.
    folder = `staging/${draftId.toLowerCase()}`;
  } else {
    return NextResponse.json({ error: "Cible invalide." }, { status: 400 });
  }

  const objectPath = `${folder}/logo-${randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("site-photos")
    .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: pub } = admin.storage.from("site-photos").getPublicUrl(objectPath);
  return NextResponse.json({ url: pub.publicUrl, path: objectPath });
}
