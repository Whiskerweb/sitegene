/**
 * lib/twenty/mapping.ts — Traduction Akyra → Twenty (fonctions PURES, sans I/O).
 *
 * Extrait pour être testable et pour matérialiser LE contrat de propriété des
 * champs : la synchro n'écrit QUE des champs « Akyra-owned » (faits produit),
 * jamais le travail manuel fait dans Twenty (qualification, notes/tâches,
 * déplacements de pipeline). On construit donc chaque patch clé par clé depuis
 * une allowlist — JAMAIS de spread d'objet — pour qu'aucun champ Twenty-owned
 * ne puisse fuiter dans une requête. La seule exception (passer l'opportunité
 * en « gagné » à la conversion) vit dans lib/twenty/sync.ts (chemin dédié).
 */

/** Sous-ensemble des colonnes `prospects` nécessaires à la synchro. */
export type ProspectRow = {
  id: string;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  city: string | null;
  category: string | null;
  lead_score: number | null;
  source: string | null;
};

/**
 * Contact unifié = un humain (clé email), agrégeant le côté lead (prospect) et le
 * côté compte (profile/user). Sert de source au patch Person v2.
 */
export type ContactRow = {
  prospectId: string | null;
  userId: string | null;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  city: string | null;
  category: string | null;
  leadScore: number | null;
  source: string | null;
  /** profiles.created_at (date d'inscription). */
  signupDate: string | null;
  /** auth.users.last_sign_in_at (dernière connexion). */
  lastConnectionAt: string | null;
};

/** Statut de conversion dérivé côté Akyra (faits, jamais saisi à la main). */
export type ClientContext = {
  /** A payé l'initial 50 € OU a un abonnement actif. */
  isClient: boolean;
  /** Essai en cours (carte enregistrée, pas encore débité). */
  isTrialing: boolean;
  /** Un compte Akyra existe pour cet email (inscrit, pas forcément payant). */
  hasAccount: boolean;
  plan: string | null;
  mrrCents: number | null;
  /** Date de conversion (ISO) si client payant. */
  conversionDate: string | null;
};

// Valeurs en MAJUSCULES_SNAKE : contrainte des champs SELECT de Twenty.
export type InscriptionStatus = "PAS_INSCRIT" | "INSCRIT" | "CLIENT_PAYANT";

/** Catégories connues (miroir du SELECT créé dans Twenty), en minuscules Akyra. */
const KNOWN_CATEGORIES = new Set(["photographe", "musicien", "artisan", "portfolio", "saas"]);

/**
 * Formate une date pour les champs DATE_TIME de Twenty : 'YYYY-MM-DDTHH:mm:ssZ'
 * (Twenty refuse les microsecondes / l'offset +00:00 renvoyés par Postgres).
 */
export function twentyDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/\.\d+Z$/, "Z");
}

/**
 * Clés Twenty que la synchro est AUTORISÉE à écrire. Toute clé hors de cette
 * liste (ex. `stage`, `noteTargets`, champs de qualification manuels) ne doit
 * JAMAIS apparaître dans un patch de synchro courant.
 */
export const AKYRA_OWNED_PERSON_FIELDS = [
  "name",
  "emails",
  "phones",
  "city",
  "instagram",
  "category",
  "leadScore",
  "inscriptionStatus",
  "akyraPlan",
  "mrrCents",
  "conversionDate",
  "akyraProspectId",
  "akyraUserId",
  "akyraSource",
  "signupDate",
  "lastConnectionAt",
] as const;

export const AKYRA_OWNED_OPP_FIELDS = [
  "name",
  "amount",
  "akyraProspectId",
] as const;

/** Statut d'inscription dérivé (priorité : payant > inscrit > pas inscrit). */
export function inscriptionStatusFor(ctx: ClientContext): InscriptionStatus {
  if (ctx.isClient) return "CLIENT_PAYANT";
  if (ctx.isTrialing || ctx.hasAccount) return "INSCRIT";
  return "PAS_INSCRIT";
}

/** Nom affiché dans Twenty (fallback si le prospect n'a pas de prénom). */
export function displayName(p: ProspectRow): string {
  return (p.first_name && p.first_name.trim()) || p.email || `Prospect ${p.id.slice(0, 8)}`;
}

/**
 * Patch Person (composites Twenty inclus). Construit clé par clé depuis
 * l'allowlist : une clé absente = champ laissé intact côté Twenty (PATCH partiel).
 */
export function prospectToPersonPatch(
  p: ProspectRow,
  ctx: ClientContext,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  patch.name = { firstName: displayName(p), lastName: "" };
  patch.akyraProspectId = p.id;
  if (p.email) patch.emails = { primaryEmail: p.email };
  if (p.phone) patch.phones = { primaryPhoneNumber: p.phone };
  if (p.city) patch.city = p.city;
  if (p.instagram) patch.instagram = p.instagram;
  // SELECT Twenty : valeur en MAJUSCULES, et seulement si catégorie connue.
  if (p.category && KNOWN_CATEGORIES.has(p.category)) patch.category = p.category.toUpperCase();
  if (p.source) patch.akyraSource = p.source;
  patch.leadScore = p.lead_score ?? 0;
  patch.inscriptionStatus = inscriptionStatusFor(ctx);
  if (ctx.plan) patch.akyraPlan = ctx.plan;
  if (ctx.mrrCents != null) patch.mrrCents = ctx.mrrCents;
  if (ctx.conversionDate) patch.conversionDate = twentyDateTime(ctx.conversionDate);
  return patch;
}

/**
 * Patch Opportunity (hors `stage` : le stage est Twenty-owned, sauf le passage
 * en « gagné » à la conversion, traité séparément dans sync.ts). `amount` est au
 * format CURRENCY de Twenty (micros : 1 € = 1 000 000 ; donc cents × 10 000).
 */
export function opportunityPatchFor(
  p: ProspectRow,
  ctx: ClientContext,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  patch.name = `${displayName(p)} — Akyra`;
  patch.akyraProspectId = p.id;
  if (ctx.mrrCents != null) {
    patch.amount = { amountMicros: ctx.mrrCents * 10_000, currencyCode: "EUR" };
  }
  return patch;
}

/** Nom affiché d'un contact (prénom, sinon email, sinon id court). */
export function contactDisplayName(c: ContactRow): string {
  return (
    (c.firstName && c.firstName.trim()) ||
    c.email ||
    `Contact ${(c.prospectId || c.userId || "").slice(0, 8)}`
  );
}

/**
 * Patch Person pour un contact unifié (lead + compte). Construit clé par clé
 * depuis l'allowlist — jamais de champ Twenty-owned. Une clé absente = champ
 * laissé intact côté Twenty (PATCH partiel).
 */
export function contactToPersonPatch(c: ContactRow, ctx: ClientContext): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  patch.name = { firstName: contactDisplayName(c), lastName: "" };
  if (c.prospectId) patch.akyraProspectId = c.prospectId;
  if (c.userId) patch.akyraUserId = c.userId;
  if (c.email) patch.emails = { primaryEmail: c.email };
  if (c.phone) patch.phones = { primaryPhoneNumber: c.phone };
  if (c.city) patch.city = c.city;
  if (c.instagram) patch.instagram = c.instagram;
  if (c.category && KNOWN_CATEGORIES.has(c.category)) patch.category = c.category.toUpperCase();
  if (c.source) patch.akyraSource = c.source;
  patch.leadScore = c.leadScore ?? 0;
  patch.inscriptionStatus = inscriptionStatusFor(ctx);
  if (ctx.plan) patch.akyraPlan = ctx.plan;
  if (ctx.mrrCents != null) patch.mrrCents = ctx.mrrCents;
  if (ctx.conversionDate) patch.conversionDate = twentyDateTime(ctx.conversionDate);
  if (c.signupDate) patch.signupDate = twentyDateTime(c.signupDate);
  if (c.lastConnectionAt) patch.lastConnectionAt = twentyDateTime(c.lastConnectionAt);
  return patch;
}

/** Patch Opportunity pour un contact (hors `stage`, Twenty-owned sauf conversion). */
export function contactOpportunityPatch(c: ContactRow, ctx: ClientContext): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  patch.name = `${contactDisplayName(c)} — Akyra`;
  if (c.prospectId) patch.akyraProspectId = c.prospectId;
  if (ctx.mrrCents != null) {
    patch.amount = { amountMicros: ctx.mrrCents * 10_000, currencyCode: "EUR" };
  }
  return patch;
}

/** Mappe un signal Akyra (events/email_events) vers un titre de note lisible. */
const SIGNAL_LABELS: Record<string, string> = {
  reveal_opened: "👀 Reveal ouvert",
  button_click: "🖱️ Clic sur le site",
  go_live_clicked: "🚀 Intention de mise en ligne",
  purchased: "💳 Paiement effectué",
  trial_started: "🎁 Essai démarré",
  email_clicked: "✉️ Clic dans un email",
  email_opened: "✉️ Email ouvert",
};

/** Corps de note pour la timeline Twenty (titre daté). `at` = ISO optionnel. */
export function signalToNoteBody(signal: string, at?: string | null): { title: string } {
  const label = SIGNAL_LABELS[signal] ?? `Signal : ${signal}`;
  const date = at ? new Date(at).toLocaleDateString("fr-FR") : null;
  return { title: date ? `${label} — ${date}` : label };
}
