/**
 * Construction du content_json d'un site à partir du contenu par défaut d'un
 * template, en surchargeant les textes (par chemin) et en remplaçant les images
 * (URL démo → URL Storage du client).
 */

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

/** Affecte une valeur à un chemin type "hero.title[0]" ou "services[].name". */
export function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  // "services[].name" = appliquer à TOUS les éléments → géré séparément ; ici chemins concrets.
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    // @ts-expect-error indexation dynamique
    if (cur[key] == null) cur[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    // @ts-expect-error indexation dynamique
    cur = cur[key];
  }
  // @ts-expect-error indexation dynamique
  cur[parts[parts.length - 1]] = value;
}

/** Remplace récursivement toutes les chaînes égales à une clé de `map`. */
export function replaceImageUrls<T extends Json>(node: T, map: Record<string, string>): T {
  if (typeof node === "string") {
    return (map[node] ?? node) as T;
  }
  if (Array.isArray(node)) {
    return node.map((v) => replaceImageUrls(v as Json, map)) as T;
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = replaceImageUrls(v as Json, map);
    }
    return out as T;
  }
  return node;
}

/** Collecte les URLs d'images du template (slots) présentes dans le contenu. */
export function collectImageSlots(content: unknown, templateId: string): string[] {
  const found = new Set<string>();
  const prefix = `/_templates/${templateId}/img/`;
  const walk = (n: unknown) => {
    if (typeof n === "string") {
      if (n.startsWith(prefix)) found.add(n);
    } else if (Array.isArray(n)) {
      n.forEach(walk);
    } else if (n && typeof n === "object") {
      Object.values(n).forEach(walk);
    }
  };
  walk(content);
  return [...found].sort();
}

/**
 * Construit le content_json final.
 * @param base contenu par défaut du template (default-content.json)
 * @param textOverrides map { "hero.brand": "Studio X", ... }
 * @param imageMap map { "/_templates/<id>/img/p1.jpg": "https://storage.../p1.jpg", ... }
 */
export function buildContent(
  base: Record<string, unknown>,
  textOverrides: Record<string, unknown>,
  imageMap: Record<string, string>,
): Record<string, unknown> {
  let content = structuredClone(base);
  for (const [path, value] of Object.entries(textOverrides)) {
    if (value === undefined || value === "") continue;
    setPath(content, path, value);
  }
  if (Object.keys(imageMap).length > 0) {
    content = replaceImageUrls(content, imageMap);
  }
  return content;
}
