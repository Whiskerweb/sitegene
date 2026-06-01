import { normalizeContent, findPage, type SiteContentV2 } from "./site-content";

/** Découpe "a.b[0].c" en segments ["a","b",0,"c"]. */
function parsePath(path: string): (string | number)[] {
  const out: (string | number)[] = [];
  for (const seg of path.split(".")) {
    const m = seg.match(/^([^[]+)((\[\d+\])*)$/);
    if (!m) { out.push(seg); continue; }
    out.push(m[1]);
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) out.push(Number(idx[1]));
  }
  return out;
}

/** Index de la page correspondant à un chemin d'URL (repli sur la home). */
export function pageIndexForPath(content: SiteContentV2, urlPath: string): number {
  const page = findPage(content, urlPath);
  const i = page ? content.pages.indexOf(page) : 0;
  return i < 0 ? 0 : i;
}

/** Lit une valeur dans pages[pageIndex].content au chemin donné. */
export function getAtPath(content: SiteContentV2, pageIndex: number, path: string): unknown {
  let cur: any = content.pages[pageIndex]?.content;
  for (const k of parsePath(path)) {
    if (cur == null) return undefined;
    cur = cur[k as any];
  }
  return cur;
}

/** Renvoie une COPIE de content avec la valeur posée dans pages[pageIndex].content. */
export function setAtPath(
  content: SiteContentV2,
  pageIndex: number,
  path: string,
  value: unknown,
): SiteContentV2 {
  const next = structuredClone(content);
  const segs = parsePath(path);
  let cur: any = (next.pages[pageIndex].content ??= {});
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i];
    if (cur[k as any] == null) cur[k as any] = typeof segs[i + 1] === "number" ? [] : {};
    cur = cur[k as any];
  }
  cur[segs[segs.length - 1] as any] = value;
  return next;
}

/** Normalise un contenu brut puis renvoie {content, pageIndex} pour une URL. */
export function resolveForUrl(raw: unknown, urlPath: string): { content: SiteContentV2; pageIndex: number } {
  const content = normalizeContent(raw);
  return { content, pageIndex: pageIndexForPath(content, urlPath) };
}
