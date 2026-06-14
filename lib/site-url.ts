/**
 * URL publique « jolie » d'un site client = son SOUS-DOMAINE `<slug>.<racine>`,
 * et non le chemin interne `/a/<slug>` ou `/s/<slug>`. C'est CETTE adresse qu'on
 * met en avant partout dans le dashboard/l'éditeur.
 *
 * Dérivée de NEXT_PUBLIC_APP_URL :
 *   https://akyra.io        → https://<slug>.akyra.io
 *   http://localhost:3000   → http://<slug>.localhost:3000
 */
export function publicSiteUrlFrom(appUrl: string, slug: string | null | undefined): string {
  if (!slug || !appUrl) return "";
  try {
    const u = new URL(appUrl);
    u.hostname = `${slug}.${u.hostname}`;
    return u.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/** URL publique du site (sous-domaine) à partir de l'env NEXT_PUBLIC_APP_URL. */
export function publicSiteUrl(slug: string | null | undefined): string {
  return publicSiteUrlFrom(process.env.NEXT_PUBLIC_APP_URL ?? "", slug);
}

/** Même chose, sans le protocole — pour l'affichage (ex. `arelec.akyra.io`). */
export function prettySiteHost(slug: string | null | undefined): string {
  return publicSiteUrl(slug).replace(/^https?:\/\//, "");
}
