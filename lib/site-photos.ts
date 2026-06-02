/**
 * Inventaire des photos d'un site (bibliothèque). La source de vérité est le
 * bucket Storage `site-photos/{siteId}/`, pas la table `photos` (non maintenue).
 * Sert la page /dashboard/bibliotheque (server) et la route GET /api/site/photos
 * (picker de l'éditeur). SERVEUR uniquement (utilise le client admin service_role).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedPhotoUrl } from "@/lib/editable";

type Admin = ReturnType<typeof createAdminClient>;

export type SitePhoto = {
  path: string; // "{siteId}/{file}" — identifiant Storage, requis pour la suppression
  url: string; // URL publique
  name: string; // nom de fichier
  bytes: number | null;
  createdAt: string | null;
};

/** Liste les photos du bucket pour un site, les plus récentes d'abord. */
export async function listSitePhotos(admin: Admin, siteId: string): Promise<SitePhoto[]> {
  const { data, error } = await admin.storage.from("site-photos").list(siteId, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !data) return [];

  return data
    .filter((o) => o.id !== null) // exclut les entrées « dossier » placeholder
    .map((o) => {
      const path = `${siteId}/${o.name}`;
      const { data: pub } = admin.storage.from("site-photos").getPublicUrl(path);
      return {
        path,
        url: pub.publicUrl,
        name: o.name,
        bytes: (o.metadata?.size as number | undefined) ?? null,
        createdAt: o.created_at ?? null,
      };
    });
}

/**
 * Collecte toutes les URLs Storage du bucket de CE site présentes dans le
 * content (parcours récursif — couvre pages[].content, site.footer, etc.).
 * Sert à signaler/avertir avant suppression d'une photo utilisée.
 */
export function collectUsedPhotoUrls(content: unknown, siteId: string): Set<string> {
  const found = new Set<string>();
  const walk = (n: unknown) => {
    if (typeof n === "string") {
      if (isAllowedPhotoUrl(n, siteId)) found.add(n);
    } else if (Array.isArray(n)) {
      n.forEach(walk);
    } else if (n && typeof n === "object") {
      Object.values(n).forEach(walk);
    }
  };
  walk(content);
  return found;
}
