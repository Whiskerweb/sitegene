import { createPublicClient } from "@/lib/supabase/public";
import { buildSiteHtml, fetchDefaultContent } from "@/lib/site-server";
import { normalizeContent, pageMeta } from "@/lib/site-content";
import { isTemplateId } from "@/lib/templates";

/**
 * Serveur de sites clients multi-pages : /s/<slug>/<...path>.
 * Récupère le site `live` + son contenu publié, normalise en v2, sélectionne la
 * page courante d'après le path, et sert le bundle template avec le contenu +
 * les meta de cette page injectés. En dev, /s/<templateId>/... = mode démo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await params;
  const pagePath = "/" + (path ?? []).join("/");
  const origin = new URL(request.url).origin;
  const supabase = createPublicClient();

  let templateId: string | null = null;
  let rawContent: unknown = null;

  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (site && site.template_id) {
    templateId = site.template_id;
    const { data: sc } = await supabase
      .from("site_content")
      .select("content_json, version")
      .eq("site_id", site.id)
      .eq("is_published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    rawContent = sc?.content_json ?? (await fetchDefaultContent(origin, site.template_id));
  } else if (isTemplateId(slug)) {
    // Aperçu démo d'un template (sans site client) — disponible aussi en prod.
    // Réponse noindex ; ne sert que des templateId connus, contenu par défaut.
    templateId = slug;
    rawContent = await fetchDefaultContent(origin, slug);
  }

  if (!templateId) {
    return new Response("Site introuvable.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const content = normalizeContent(rawContent);
  const meta = pageMeta(content, pagePath);
  const html = await buildSiteHtml(origin, templateId, content, meta);
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex", // à lever quand on ouvrira l'indexation
    },
  });
}
