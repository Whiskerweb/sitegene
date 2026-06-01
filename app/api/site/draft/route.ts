import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTemplateManifest } from "@/lib/site-server";
import { classifyChange, type TemplateManifest } from "@/lib/editable";
import { setPath } from "@/lib/content-overlay";
import { validateContentV2 } from "@/lib/validate-content";

/**
 * Autosave GRATUIT des modifications de l'éditeur dans un brouillon non publié.
 * N'accepte qu'une map { "<path concret>": value } validée contre le manifest
 * (texte éditable, ou swap photo vers le bucket du site). Jamais un content_json
 * complet du client. Préserve tout le contenu verrouillé.
 */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const origin = new URL(request.url).origin;
  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  const changes = body?.changes;
  if (!siteId || !changes || typeof changes !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (!site.template_id) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }

  const manifest = (await fetchTemplateManifest(origin, site.template_id)) as TemplateManifest | null;
  if (!manifest) {
    return NextResponse.json({ error: "Manifest indisponible." }, { status: 500 });
  }

  // Plus haute version courante (brouillon si non publiée, sinon dernière publiée).
  const { data: top } = await admin
    .from("site_content")
    .select("id, version, content_json, is_published")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!top) return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });

  const content = structuredClone((top.content_json as Record<string, unknown>) ?? {});
  let applied = 0;
  const rejected: string[] = [];
  for (const [path, value] of Object.entries(changes as Record<string, unknown>)) {
    const cls = classifyChange(manifest, content, siteId, path, value);
    if (cls.kind === "reject") {
      rejected.push(path);
      continue;
    }
    let v = value as string;
    if (cls.kind === "text" && v.length > cls.maxLen) v = v.slice(0, cls.maxLen);
    setPath(content, path, v);
    applied++;
  }

  if (applied === 0) {
    return NextResponse.json({ ok: true, applied: 0, rejected });
  }

  // Valide le contenu v2 avant de sauvegarder.
  if ((content as Record<string, unknown>)?.version === 2) {
    const validation = validateContentV2(content);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  let version = top.version;
  if (top.is_published) {
    // La dernière version est publiée (le site live la sert) → on crée un brouillon v(N+1).
    version = top.version + 1;
    const { error } = await admin.from("site_content").insert({
      site_id: siteId,
      version,
      content_json: content,
      is_published: false,
      created_by: "client",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    // Le brouillon existe déjà → on l'écrase.
    const { error } = await admin
      .from("site_content")
      .update({ content_json: content })
      .eq("id", top.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, applied, rejected, version });
}
