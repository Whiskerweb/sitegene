import type { SiteContentV2 } from "./PageContext";
/** Garantit la forme v2 (les anciens contenus injectés v1 → 1 page home). */
export function normalizeDefault(raw: any): SiteContentV2 {
  if (raw && raw.version === 2 && Array.isArray(raw.pages)) return raw;
  return {
    version: 2,
    site: { brand: raw?.hero?.brand, nav: [], footer: raw?.footer ?? {} },
    pages: [{ slug: "/", type: "home", content: raw ?? {} }],
  };
}
