/**
 * Sérialise le contenu éditorial d'un site en un brief texte lisible pour l'IA.
 * Module PUR (aucun import serveur) — utilisé par le remap de template pour
 * transmettre à l'IA TOUTES les infos réelles du client, afin qu'elle les
 * retranscrive fidèlement sur le template cible (et non un contenu générique).
 */

/** Clés techniques jamais reprises dans le brief (CSS injecté, effets, assets, directives). */
const TECHNICAL_KEYS = new Set([
  "__css",
  "__effects",
  "__components",
  "__dropSections",
  "__dropItems",
  "version",
  "image",
  "images",
  "icon",
  "logo",
  "avatar",
  "href",
  "url",
  "src",
  "color",
  "bg",
  "background",
]);

const URL_LIKE_RE = /^(https?:\/\/|\/|data:|#)/i;

/** Une valeur texte est-elle « significative » (vrai contenu éditorial, pas une URL/asset) ? */
export function isMeaningfulText(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length < 2) return false;
  if (URL_LIKE_RE.test(t)) return false;
  if (t.includes("/_templates/")) return false;
  if (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(t)) return false;
  return true;
}

/**
 * Brief RICHE : parcourt le contenu source et liste les textes éditoriaux
 * (titres, descriptions, services, FAQ, témoignages, à-propos…) préfixés par
 * leur chemin de section. Ignore les clés techniques, URLs et assets. Déplie
 * les pages de la lignée v2 (`pages[i].content`).
 */
export function briefFromSourceContent(source: Record<string, unknown>): string {
  const lines: string[] = [];
  const seen = new Set<string>();

  const walk = (node: unknown, path: string, depth: number) => {
    if (depth > 6 || lines.length > 200) return;
    if (isMeaningfulText(node)) {
      const t = (node as string).trim().slice(0, 280);
      const key = `${path}=${t}`;
      if (!seen.has(key)) {
        seen.add(key);
        lines.push(`${path} : ${t}`);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`, depth + 1));
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (TECHNICAL_KEYS.has(k)) continue;
        walk(v, path ? `${path}.${k}` : k, depth + 1);
      }
    }
  };

  const pages = (source as { pages?: { content?: Record<string, unknown> }[] }).pages;
  if (Array.isArray(pages) && pages.length > 0) {
    for (const p of pages) walk(p?.content ?? {}, "", 0);
  } else {
    walk(source, "", 0);
  }

  return lines.join("\n");
}
