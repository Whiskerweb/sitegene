/**
 * Schéma de contenu v2 d'un site Akyra : un site = des pages typées + une nav.
 * Les anciens contenus (v1, objet plat mono-page) sont normalisés en v2 au
 * rendu : ils deviennent une unique page `home` portant l'objet v1 intact.
 */
import { isSpaTemplate } from "./templates";

export type PageType =
  | "home"
  | "portfolio"
  | "about"
  | "service"
  | "contact"
  | "generic";

export interface NavItem {
  label: string;
  to?: string; // chemin relatif ("/portfolio") ou ancre ("#contact")
  children?: NavItem[];
}

export interface PageMeta {
  description?: string;
  ogImage?: string;
}

export interface Page {
  slug: string; // "/" pour la home ; sinon "/portfolio", "/prestations/grossesse"
  type: PageType;
  title?: string;
  meta?: PageMeta;
  content: Record<string, unknown>;
}

export interface SiteShell {
  brand?: string;
  theme?: Record<string, unknown>;
  nav?: NavItem[];
  footer?: Record<string, unknown>;
}

export interface SiteContentV2 {
  version: 2;
  site: SiteShell;
  pages: Page[];
  __css?: string;
}

function isV2(raw: unknown): raw is SiteContentV2 {
  return (
    !!raw &&
    typeof raw === "object" &&
    (raw as Record<string, unknown>).version === 2 &&
    Array.isArray((raw as Record<string, unknown>).pages)
  );
}

/** Normalise tout contenu (v1 plat ou v2) vers la forme v2. Idempotent sur v2. */
export function normalizeContent(raw: unknown): SiteContentV2 {
  if (isV2(raw)) return raw;
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const css = typeof obj.__css === "string" ? obj.__css : undefined;
  return {
    version: 2,
    site: {
      brand: (obj.hero as Record<string, unknown> | undefined)?.brand as string | undefined,
      nav: [],
      footer: (obj.footer as Record<string, unknown>) ?? {},
    },
    pages: [{ slug: "/", type: "home", content: obj }],
    ...(css ? { __css: css } : {}),
  };
}

/** Normalise un path en chemin de page : "" → "/", retire le slash final. */
function normPath(path: string): string {
  if (!path || path === "/") return "/";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/** Page correspondant au chemin ; à défaut, la home ("/"). */
export function findPage(content: SiteContentV2, path: string): Page | undefined {
  const want = normPath(path);
  return (
    content.pages.find((p) => normPath(p.slug) === want) ??
    content.pages.find((p) => normPath(p.slug) === "/")
  );
}

/** Meta SEO de la page (titre, description, ogImage), avec repli sur la marque. */
export function pageMeta(
  content: SiteContentV2,
  path: string,
): { title: string; description?: string; ogImage?: string } {
  const page = findPage(content, path);
  const brand = content.site.brand ?? "";
  return {
    title: page?.title ?? brand,
    description: page?.meta?.description,
    ogImage: page?.meta?.ogImage,
  };
}

// ---------------------------------------------------------------------------
// Multi-lignée : SPA (contenu v2) vs HTML clone-site (contenu PLAT)
// ---------------------------------------------------------------------------

/** Contenu injectable : v2 (lignée SPA) ou objet plat (lignée HTML). */
export type AnyContent = SiteContentV2 | Record<string, unknown>;

/**
 * Contenu prêt à injecter dans window.__SITE_CONTENT__ pour un template donné.
 * Lignée SPA → v2 normalisé (comportement historique). Lignée HTML → PLAT :
 * son hydratation lit `get("hero.title")` directement sur l'objet ; un wrap v2
 * rendrait toutes les valeurs introuvables (page démo anglaise figée). Déballe
 * aussi un v2 mono-page si un contenu plat a été enveloppé par erreur en base.
 */
export function contentForTemplate(raw: unknown, templateId: string): AnyContent {
  if (isSpaTemplate(templateId)) return normalizeContent(raw);
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (obj.version === 2 && Array.isArray(obj.pages)) {
    const pages = obj.pages as { slug?: string; content?: Record<string, unknown> }[];
    const home = pages.find((p) => normPath(p?.slug ?? "") === "/") ?? pages[0];
    return (home?.content ?? {}) as Record<string, unknown>;
  }
  return obj;
}

/** Meta SEO multi-lignée (v2 : meta de la page ; plat : meta.title / brand). */
export function metaForTemplate(
  content: AnyContent,
  templateId: string,
  path: string,
): { title: string; description?: string; ogImage?: string } {
  if (isSpaTemplate(templateId)) return pageMeta(content as SiteContentV2, path);
  const c = content as Record<string, unknown>;
  const meta = (c.meta && typeof c.meta === "object" ? c.meta : {}) as Record<string, unknown>;
  const title =
    (typeof meta.title === "string" && meta.title) ||
    (typeof c.brand === "string" && c.brand) ||
    "Votre site";
  return {
    title,
    ...(typeof meta.description === "string" ? { description: meta.description } : {}),
    ...(typeof meta.ogImage === "string" ? { ogImage: meta.ogImage } : {}),
  };
}
