/**
 * Whitelist d'édition self-service (éditeur no-code).
 * Détermine, à partir du manifest d'un template, si un chemin concret
 * (ex. "services[2].name", "hero.title[0]") est éditable en TEXTE, ou si une
 * valeur image peut remplacer le chemin (swap photo). Source de vérité serveur :
 * on n'accepte JAMAIS un content_json complet du client.
 */
import { getPath } from "@/lib/content-overlay";

export type EditableField = { path: string; type: string; maxLen?: number };
export type TemplateManifest = {
  fields?: { editable?: EditableField[]; locked?: { path: string }[] };
};

/** Transforme un path de manifest ("services[].name" ou "hero.title[0]") en regex de paths concrets. */
export function pathToRegex(path: string): RegExp {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // "[]" (itératif) → n'importe quel index ; le reste est échappé littéralement (les "[0]" concrets restent fixes).
  const re = path.split("[]").map(esc).join("\\[\\d+\\]");
  return new RegExp("^" + re + "$");
}

/** Spécif d'un champ TEXTE éditable matchant ce path concret (type text/textarea), sinon null. */
export function textFieldSpec(
  manifest: TemplateManifest,
  path: string,
): { maxLen: number } | null {
  const editable = manifest.fields?.editable ?? [];
  for (const f of editable) {
    if (f.type !== "text" && f.type !== "textarea") continue; // listes exclues du self-service
    if (pathToRegex(f.path).test(path)) return { maxLen: f.maxLen ?? 2000 };
  }
  return null;
}

const IMG_RE = /(\.(jpe?g|png|webp|avif|gif)(\?|$))|\/_templates\/|\/img\/|\/storage\/v1\/object\/public\//i;

/** Une valeur courante ressemble-t-elle à une URL/chemin d'image (donc un slot photo) ? */
export function looksLikeImage(value: unknown): boolean {
  return typeof value === "string" && IMG_RE.test(value);
}

/** L'URL fournie est-elle bien une photo du bucket de CE site (anti-injection) ? */
export function isAllowedPhotoUrl(url: unknown, siteId: string): boolean {
  if (typeof url !== "string") return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/site-photos/${siteId}/`;
  return url.startsWith(prefix);
}

/**
 * Classe un changement {path → value} :
 *  - "text"   : champ texte éditable (avec maxLen)
 *  - "image"  : swap photo autorisé (path image existant + URL du bucket du site)
 *  - "reject" : tout le reste (verrouillé, liste, hors périmètre, URL non autorisée)
 */
export function classifyChange(
  manifest: TemplateManifest,
  content: unknown,
  siteId: string,
  path: string,
  value: unknown,
): { kind: "text"; maxLen: number } | { kind: "image" } | { kind: "reject" } {
  if (typeof value !== "string") return { kind: "reject" };

  const spec = textFieldSpec(manifest, path);
  if (spec) return { kind: "text", maxLen: spec.maxLen };

  // Branche image : on ne remplace l'URL que si le champ courant EST déjà une image
  // (donc un slot photo) ET que la nouvelle URL appartient au bucket du site.
  if (looksLikeImage(getPath(content, path)) && isAllowedPhotoUrl(value, siteId)) {
    return { kind: "image" };
  }
  return { kind: "reject" };
}
