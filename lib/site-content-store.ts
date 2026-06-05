/**
 * Store des instantanés de contenu — modèle « 1 site / N peaux ».
 *
 * Chaque site possède un instantané versionné PAR template (peau). La peau
 * « en cours d'édition » est `sites.template_id`. La peau « en ligne » est
 * l'unique snapshot `is_published=true` (tous les snapshots publiés d'un site
 * partagent le même template_id — garanti par la migration 0020 + publishSnapshot).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentRow = {
  id: string;
  site_id: string;
  template_id: string | null;
  version: number;
  content_json: Record<string, unknown> | null;
  is_published: boolean;
};

// --- Sélecteurs purs (testables sans DB) ------------------------------------

/** Snapshot éditable d'une peau : version max pour ce template. */
export function pickEditable(rows: ContentRow[], templateId: string): ContentRow | null {
  const ofTpl = rows.filter((r) => r.template_id === templateId);
  if (ofTpl.length === 0) return null;
  return ofTpl.reduce((a, b) => (b.version > a.version ? b : a));
}

/** Snapshot publié (en ligne) : version max parmi les publiés. */
export function pickPublished(rows: ContentRow[]): ContentRow | null {
  const pub = rows.filter((r) => r.is_published);
  if (pub.length === 0) return null;
  return pub.reduce((a, b) => (b.version > a.version ? b : a));
}

/** Templates distincts ayant au moins un snapshot. */
export function distinctTemplates(rows: ContentRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) if (r.template_id) set.add(r.template_id);
  return [...set];
}

// --- Accès DB ----------------------------------------------------------------

const COLS = "id, site_id, template_id, version, content_json, is_published";

/** Snapshot éditable (version max) de la peau `templateId` pour ce site. */
export async function loadEditableSnapshot(
  admin: SupabaseClient,
  siteId: string,
  templateId: string,
): Promise<ContentRow | null> {
  const { data } = await admin
    .from("site_content")
    .select(COLS)
    .eq("site_id", siteId)
    .eq("template_id", templateId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ContentRow | null) ?? null;
}

/** Snapshot publié (en ligne) du site, quelle que soit la peau. */
export async function loadPublishedSnapshot(
  admin: SupabaseClient,
  siteId: string,
): Promise<ContentRow | null> {
  const { data } = await admin
    .from("site_content")
    .select(COLS)
    .eq("site_id", siteId)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ContentRow | null) ?? null;
}

/** template_ids distincts ayant un snapshot pour ce site (galerie). */
export async function listSiteTemplates(
  admin: SupabaseClient,
  siteId: string,
): Promise<string[]> {
  const { data } = await admin
    .from("site_content")
    .select("template_id")
    .eq("site_id", siteId);
  return distinctTemplates((data ?? []) as ContentRow[]);
}

/**
 * Enregistre un brouillon pour (site, template). Si la version max de cette
 * peau n'est pas publiée, on l'écrase ; sinon on crée une nouvelle version.
 * Retourne la version écrite.
 */
export async function saveDraftSnapshot(
  admin: SupabaseClient,
  siteId: string,
  templateId: string,
  contentJson: Record<string, unknown>,
  createdBy: "operator" | "client" | "ai" = "client",
): Promise<number> {
  const top = await loadEditableSnapshot(admin, siteId, templateId);
  if (top && !top.is_published) {
    await admin.from("site_content").update({ content_json: contentJson }).eq("id", top.id);
    return top.version;
  }
  const version = (top?.version ?? 0) + 1;
  await admin.from("site_content").insert({
    site_id: siteId,
    template_id: templateId,
    version,
    content_json: contentJson,
    is_published: false,
    created_by: createdBy,
  });
  return version;
}

/**
 * Crée un snapshot initial pour une peau si elle n'en a pas encore.
 * Retourne true si créé, false si déjà présent.
 */
export async function ensureSnapshot(
  admin: SupabaseClient,
  siteId: string,
  templateId: string,
  contentJson: Record<string, unknown>,
): Promise<boolean> {
  const existing = await loadEditableSnapshot(admin, siteId, templateId);
  if (existing) return false;
  await admin.from("site_content").insert({
    site_id: siteId,
    template_id: templateId,
    version: 1,
    content_json: contentJson,
    is_published: false,
    created_by: "client",
  });
  return true;
}

/**
 * Charge le snapshot éditable de la peau active, en le CRÉANT depuis le contenu
 * par défaut du template s'il manque. Garantit l'invariant « la peau active a
 * toujours un contenu » même si un changement de peau antérieur a basculé
 * sites.template_id sans créer le snapshot (état legacy / incohérent) — sinon
 * l'éditeur afficherait un contenu vide et le bouton Publier resterait grisé.
 */
export async function loadOrCreateEditableSnapshot(
  admin: SupabaseClient,
  origin: string,
  siteId: string,
  templateId: string,
): Promise<ContentRow | null> {
  const existing = await loadEditableSnapshot(admin, siteId, templateId);
  if (existing) return existing;
  // Import dynamique : évite d'attacher une dépendance serveur (fetch) au
  // chargement statique du module (garde les sélecteurs purs testables).
  const { fetchDefaultContent } = await import("@/lib/site-server");
  const def = (await fetchDefaultContent(origin, templateId)) as Record<string, unknown> | null;
  await ensureSnapshot(admin, siteId, templateId, def ?? {});
  return loadEditableSnapshot(admin, siteId, templateId);
}

/**
 * Publie la peau `templateId` : la version max de cette peau devient l'unique
 * snapshot publié du site (toutes les autres lignes is_published=false).
 * Retourne la version publiée, ou null si la peau n'a aucun snapshot.
 */
export async function publishSnapshot(
  admin: SupabaseClient,
  siteId: string,
  templateId: string,
): Promise<number | null> {
  const top = await loadEditableSnapshot(admin, siteId, templateId);
  if (!top) return null;
  // 1) Tout dépublier sur ce site.
  await admin.from("site_content").update({ is_published: false }).eq("site_id", siteId);
  // 2) Publier la version cible (l'unique snapshot en ligne).
  await admin.from("site_content").update({ is_published: true }).eq("id", top.id);
  return top.version;
}
