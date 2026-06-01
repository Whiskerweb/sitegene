/**
 * Schéma de contenu v2 d'un site Akyra : un site = des pages typées + une nav.
 * Les anciens contenus (v1, objet plat mono-page) sont normalisés en v2 au
 * rendu : ils deviennent une unique page `home` portant l'objet v1 intact.
 */
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
