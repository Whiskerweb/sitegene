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

/** Dossiers d'assets relatifs possibles dans un shell de template (lignée HTML). */
const ASSET_DIRS = "(?:img|images|assets|css|js|fonts|media|video|photos)";

/**
 * Absolutise les références d'assets RELATIVES d'un shell HTML vers
 * /_templates/<id>/… La lignée templates-HTML écrit `src="img/hero.jpg"` ou
 * `url(img/bg.jpg)` : servies depuis /s/<slug>, /r/<token> ou un aperçu, ces
 * URLs se résolvent hors du dossier du template → images manquantes. Pas de
 * <base> (casserait les ancres #section) : on réécrit uniquement les chemins
 * d'assets. No-op pour les shells SPA (déjà en chemins absolus).
 */
export function absolutizeTemplateAssets(html: string, templateId: string): string {
  const base = `/_templates/${templateId}/`;
  return html
    .replace(
      new RegExp(`(\\s(?:src|href|poster)=["'])(${ASSET_DIRS}/)`, "gi"),
      `$1${base}$2`,
    )
    .replace(/(\bsrcset=)(["'])([^"']*)\2/gi, (_m, attr, q, val: string) => {
      const fixed = val.replace(
        new RegExp(`(^|,\\s*)(${ASSET_DIRS}/)`, "gi"),
        `$1${base}$2`,
      );
      return `${attr}${q}${fixed}${q}`;
    })
    .replace(
      new RegExp(`(url\\(\\s*['"]?)(${ASSET_DIRS}/)`, "gi"),
      `$1${base}$2`,
    );
}

const REL_IMAGE_VALUE = new RegExp(
  `^${ASSET_DIRS}/.+\\.(?:jpe?g|png|webp|avif|gif|svg)(?:\\?.*)?$`,
  "i",
);

/**
 * Absolutise les valeurs d'images relatives DANS le contenu (ex.
 * "img/blog2.jpg" injecté au runtime sur un [data-sg-img]) vers
 * /_templates/<id>/… Les URLs absolues / Storage restent intactes.
 */
export function absolutizeContentAssets<T>(node: T, templateId: string): T {
  const base = `/_templates/${templateId}/`;
  if (typeof node === "string") {
    return (REL_IMAGE_VALUE.test(node) ? `${base}${node}` : node) as T;
  }
  if (Array.isArray(node)) {
    return node.map((v) => absolutizeContentAssets(v, templateId)) as T;
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = absolutizeContentAssets(v, templateId);
    }
    return out as T;
  }
  return node;
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
  let html = absolutizeTemplateAssets(await res.text(), templateId);
  const inject = buildHeadInjection(absolutizeContentAssets(content, templateId), meta);
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
