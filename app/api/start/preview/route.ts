/**
 * Aperçu du tunnel /start : rend le site du prospect sur un template donné.
 * Auth = le token lui-même (lien secret), comme /r/<token>. noindex + no-store.
 */
import { loadStartState } from "@/lib/start-tunnel";
import { regenerateForSite } from "@/lib/onboarding";
import { buildSiteHtml } from "@/lib/site-server";
import { metaForTemplate } from "@/lib/site-content";
import { isTemplateId, type TemplateId } from "@/lib/templates";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const templateParam = searchParams.get("template") ?? "";

  const state = token ? await loadStartState(token) : null;
  if (!state) return new Response("Lien invalide ou expiré.", { status: 404 });

  const templateOverride: TemplateId | undefined = isTemplateId(templateParam)
    ? templateParam
    : undefined;

  const built = await regenerateForSite(origin, state.siteId, templateOverride);
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
      "x-robots-tag": "noindex",
    },
  });
}
