/**
 * Construit le HTML d'un site client : shell du bundle template prébuildé
 * (public/_templates/<id>/index.html) + injection runtime du contenu (v2) et
 * des meta de la page courante AVANT l'exécution du bundle. Aucun rebuild.
 */
import type { SiteContentV2 } from "./site-content";

/** JSON sûr inline (`<` échappé → pas de break-out </script>). */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface HeadMeta {
  title: string;
  description?: string;
  ogImage?: string;
}

/** Bloc à injecter en fin de <head> : contenu + meta + CSS perso éventuel. */
export function buildHeadInjection(content: SiteContentV2, meta: HeadMeta): string {
  const css =
    content && typeof content === "object" && typeof content.__css === "string"
      ? content.__css
      : "";
  const cssTag = css ? `<style id="sg-custom">${css}</style>` : "";
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`;
  const descTag = meta.description
    ? `<meta name="description" content="${escapeHtml(meta.description)}">`
    : "";
  const ogTags =
    `<meta property="og:title" content="${escapeHtml(meta.title)}">` +
    (meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : "");
  return (
    `<script>window.__SITE_CONTENT__=${safeJson(content)};</script>\n` +
    titleTag + descTag + ogTags + cssTag
  );
}

export async function buildSiteHtml(
  origin: string,
  templateId: string,
  content: SiteContentV2,
  meta: HeadMeta,
): Promise<string | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/index.html`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  let html = await res.text();
  const inject = buildHeadInjection(content, meta);
  // retire un <title> existant du shell (sera remplacé par celui de la page)
  html = html.replace(/<title>.*?<\/title>/i, "");
  if (html.includes("</head>")) {
    html = html.replace("</head>", () => `${inject}</head>`);
  } else {
    html = inject + html;
  }
  return html;
}

export async function fetchDefaultContent(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/default-content.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}

export async function fetchTemplateManifest(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/manifest.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}
