import { createPublicClient } from "@/lib/supabase/public";
import { buildSiteHtml, fetchDefaultContent } from "@/lib/site-server";
import { contentForTemplate, metaForTemplate, type AnyContent } from "@/lib/site-content";
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
  // Shell bespoke (site sur-mesure généré par l'IA), sinon null → template statique.
  let generatedHtml: string | null = null;

  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  // Site ASSEMBLÉ (fonderie) : rendu React hydraté sur /a/<slug>.
  if (site?.template_id === "foundry") {
    return Response.redirect(`${origin}/a/${slug}`, 308);
  }

  if (site && site.template_id) {
    // Le snapshot publié porte SA peau (peut différer de la peau en cours
    // d'édition si l'utilisateur a changé de template sans republier).
    const { data: sc } = await supabase
      .from("site_content")
      .select("content_json, version, template_id, generated_html")
      .eq("site_id", site.id)
      .eq("is_published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const renderTpl: string =
      sc?.template_id && isTemplateId(sc.template_id) ? sc.template_id : site.template_id;
    templateId = renderTpl;
    rawContent = sc?.content_json ?? (await fetchDefaultContent(origin, renderTpl));
    generatedHtml = (sc as { generated_html?: string | null })?.generated_html ?? null;
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

  // Shell bespoke → le contenu extrait est PLAT (data-sg) : on n'applique PAS la
  // normalisation v2/SPA. Sinon, contenu par lignée habituel.
  const content = generatedHtml
    ? (rawContent as AnyContent)
    : contentForTemplate(rawContent, templateId);
  const meta = metaForTemplate(content, templateId, pagePath);
  const html = await buildSiteHtml(origin, templateId, content, meta, {
    pagePath,
    basePath: `/s/${slug}`,
    shellHtml: generatedHtml,
  });
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex", // à lever quand on ouvrira l'indexation
    },
  });
}
