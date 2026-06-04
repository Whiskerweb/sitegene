import { getUser } from "@/lib/auth";
import {
  buildSiteHtml,
  fetchDefaultContent,
} from "@/lib/site-server";
import { contentForTemplate, metaForTemplate } from "@/lib/site-content";
import { isTemplateId } from "@/lib/templates";

/**
 * Démo d'un template avec son contenu par défaut — vignettes de la page
 * Formules. Contrairement au shell brut (/_templates/<id>/index.html), le
 * rendu passe par buildSiteHtml : les DEUX lignées (SPA + HTML) s'affichent
 * correctement (window.__SITE_CONTENT__ injecté).
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!isTemplateId(id)) return new Response("Template inconnu.", { status: 404 });

  const origin = url.origin;
  const raw = await fetchDefaultContent(origin, id);
  const content = contentForTemplate(raw, id);
  const html = await buildSiteHtml(origin, id, content, metaForTemplate(content, id, "/"));
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "private, max-age=600",
    },
  });
}
