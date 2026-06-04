import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSiteHtml,
  fetchDefaultContent,
  fetchTemplateManifest,
} from "@/lib/site-server";
import { contentForTemplate, metaForTemplate } from "@/lib/site-content";
import { injectEditChrome, type EditableFieldSpec } from "@/lib/edit-runtime";

/**
 * Aperçu authentifié du site du propriétaire (brouillon inclus). Avec ?edit=1,
 * injecte le runtime d'édition WYSIWYG. Servi en iframe same-origin depuis /editor.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId") ?? "";
  const edit = url.searchParams.get("edit") === "1";
  const origin = url.origin;

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return new Response("Site non autorisé.", { status: 403 });
  }
  if (!site.template_id) return new Response("Template inconnu.", { status: 400 });

  // Plus haute version (publiée OU non) → on voit le brouillon en cours.
  const { data: sc } = await admin
    .from("site_content")
    .select("content_json, version")
    .eq("site_id", site.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const raw = sc?.content_json ?? (await fetchDefaultContent(origin, site.template_id));
  // ?path= permet à l'éditeur de prévisualiser une page précise (multi-pages).
  const pagePath = url.searchParams.get("path") || "/";
  // Contenu par lignée : v2 (SPA) ou PLAT (HTML clone-site).
  const content = contentForTemplate(raw, site.template_id);
  let html = await buildSiteHtml(
    origin,
    site.template_id,
    content,
    metaForTemplate(content, site.template_id, pagePath),
    { pagePath }, // pas de basePath : liens inter-pages inertes dans l'éditeur
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  if (edit) {
    const manifest = (await fetchTemplateManifest(origin, site.template_id)) as
      | { fields?: { editable?: EditableFieldSpec[] } }
      | null;
    const editableFields = (manifest?.fields?.editable ?? []).map((f) => ({
      path: f.path,
      type: f.type,
      maxLen: f.maxLen,
    }));
    html = injectEditChrome(html, { editableFields });
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
