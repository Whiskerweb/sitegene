/**
 * Aperçu live : rend le HTML du site du client à partir de l'intake courant,
 * pour un template donné (recommandé par défaut, ou candidat précis au reveal).
 * Sert directement d'`src` à l'iframe. Garde-fou d'ownership (cookies same-origin).
 */
import { getUser } from "@/lib/auth";
import { regenerateForSite, userOwnsSite } from "@/lib/onboarding";
import { buildSiteHtml } from "@/lib/site-server";
import { metaForTemplate } from "@/lib/site-content";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const siteId = searchParams.get("siteId") ?? "";
  const templateParam = searchParams.get("template") ?? "";

  const user = await getUser();
  if (!user || !(await userOwnsSite(user.id, siteId))) {
    return new Response("Accès refusé.", { status: 403 });
  }

  const templateOverride: TemplateId | undefined = isTemplateId(templateParam)
    ? templateParam
    : undefined;

  const built = await regenerateForSite(origin, siteId, templateOverride);
  if (!built) return new Response("Aperçu indisponible.", { status: 404 });

  const html = await buildSiteHtml(
    origin,
    built.templateId,
    built.content,
    metaForTemplate(built.content, built.templateId, "/"),
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // Aperçu privé : ne jamais être indexé / mis en cache CDN.
      "x-robots-tag": "noindex",
    },
  });
}
