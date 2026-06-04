/**
 * Cœur serveur du parcours d'onboarding self-serve.
 *
 * Le site appartient au client DÈS le départ (owner_user_id), contrairement au
 * tunnel de prospection à froid où le compte est créé au paiement. L'« intake »
 * (réponses progressives) est la source de vérité ; le contenu du site est
 * (re)construit à partir de lui — mapping déterministe, aucune IA dans la boucle
 * d'aperçu live (rapide + fiable). Réutilise tout le moteur existant :
 * generateSite (création des enregistrements), buildContent (overlay),
 * dropSectionsForIntake (adaptation au métier).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSite } from "@/lib/generate";
import { buildContent, collectImageSlots, getPath } from "@/lib/content-overlay";
import { contentForTemplate, type AnyContent } from "@/lib/site-content";
import { fetchDefaultContent } from "@/lib/site-server";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import { dropSectionsForIntake, eventLabel, type Intake } from "@/lib/onboarding-config";

export type OnboardingState = {
  siteId: string;
  token: string | null;
  categoryId: string;
  templateId: TemplateId;
  chosenTemplateId: string | null;
  candidateTemplateIds: TemplateId[];
  step: number;
  intake: Intake & { categoryId?: string };
};

type Admin = ReturnType<typeof createAdminClient>;

/** Déduit un nom de marque lisible du brief (« Camille, photographe… » → « Camille »). */
function brandFromBrief(brief: string): string {
  const firstLine = brief.split(/[\n.]/)[0]?.trim() ?? "";
  const head = firstLine.split(/[,–—-]/)[0]?.trim() ?? "";
  const name = head.replace(/^(je m'appelle|moi c'est|c'est)\s+/i, "").trim();
  return (name || "Votre Studio").slice(0, 40);
}

/** Template recommandé pour une catégorie/intake (défaut catégorie pour l'instant). */
export function recommendedTemplate(categoryId: string): TemplateId {
  const cat = getCategory(categoryId) ?? DEFAULT_CATEGORY;
  return cat.defaultTemplateId;
}

/** Modèles candidats proposés au reveal multi-DA (sous-ensemble actif de la catégorie). */
export function candidateTemplates(categoryId: string): TemplateId[] {
  const cat = getCategory(categoryId) ?? DEFAULT_CATEGORY;
  return cat.templateIds.length > 0 ? cat.templateIds : [cat.defaultTemplateId];
}

async function tokenForSite(admin: Admin, siteId: string): Promise<string | null> {
  const { data } = await admin
    .from("prospect_codes")
    .select("token")
    .eq("site_id", siteId)
    .maybeSingle();
  return data?.token ?? null;
}

function toState(
  row: {
    site_id: string;
    intake: Record<string, unknown> | null;
    step: number | null;
    candidate_template_ids: string[] | null;
    chosen_template_id: string | null;
  },
  token: string | null,
): OnboardingState {
  const intake = (row.intake ?? {}) as Intake & { categoryId?: string };
  const categoryId = intake.categoryId ?? DEFAULT_CATEGORY.id;
  const chosen =
    row.chosen_template_id && isTemplateId(row.chosen_template_id)
      ? row.chosen_template_id
      : null;
  return {
    siteId: row.site_id,
    token,
    categoryId,
    templateId: chosen ?? recommendedTemplate(categoryId),
    chosenTemplateId: chosen,
    candidateTemplateIds: candidateTemplates(categoryId),
    step: row.step ?? 0,
    intake,
  };
}

/** Vrai si le site appartient au client (garde-fou des routes). */
export async function userOwnsSite(userId: string, siteId: string): Promise<boolean> {
  if (!siteId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  return Boolean(data?.id);
}

/** Onboarding en cours du client (site draft le plus récent), ou null. */
export async function loadOnboarding(userId: string): Promise<OnboardingState | null> {
  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id")
    .eq("owner_user_id", userId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!site?.id) return null;

  const { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id")
    .eq("site_id", site.id)
    .maybeSingle();
  if (!ob) return null;

  return toState(ob, await tokenForSite(admin, ob.site_id));
}

/**
 * Récupère l'onboarding en cours, ou en crée un nouveau depuis le brief de la
 * landing. Réutilise generateSite pour créer prospect + site + contenu v1 +
 * token, puis assigne le site au client et amorce l'intake.
 */
export async function ensureOnboardingSite(input: {
  origin: string;
  userId: string;
  email: string | null;
  brief: string;
  categoryId: string;
}): Promise<OnboardingState> {
  const existing = await loadOnboarding(input.userId);
  if (existing) return existing;

  const admin = createAdminClient();
  const category = getCategory(input.categoryId) ?? DEFAULT_CATEGORY;
  const templateId = category.defaultTemplateId;
  const brand = brandFromBrief(input.brief);

  const baseContent = (await fetchDefaultContent(input.origin, templateId)) as
    | Record<string, unknown>
    | null;
  if (!baseContent) throw new Error("Template indisponible.");

  // Création des enregistrements via le moteur existant (contenu démo pour l'instant).
  const { siteId, token } = await generateSite({
    templateId,
    firstName: brand,
    email: input.email,
    textOverrides: {},
    photos: [],
    baseContent,
    createdBy: input.userId,
  });

  // Le site appartient au client immédiatement (différence clé vs outreach).
  await admin.from("sites").update({ owner_user_id: input.userId }).eq("id", siteId);

  const intake: Intake & { categoryId?: string } = {
    brief: input.brief,
    brand,
    categoryId: category.id,
    contactEmail: input.email ?? undefined,
  };

  await admin.from("site_onboarding").insert({
    site_id: siteId,
    intake,
    step: 0,
    candidate_template_ids: candidateTemplates(category.id),
  });

  return {
    siteId,
    token,
    categoryId: category.id,
    templateId,
    chosenTemplateId: null,
    candidateTemplateIds: candidateTemplates(category.id),
    step: 0,
    intake,
  };
}

/** Fusionne un patch dans l'intake et renvoie l'état mis à jour. */
export async function saveIntake(
  siteId: string,
  patch: Partial<Intake>,
  step?: number,
): Promise<OnboardingState | null> {
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id")
    .eq("site_id", siteId)
    .maybeSingle();
  if (!ob) return null;

  const merged = { ...(ob.intake as Record<string, unknown>), ...patch };
  const { data: updated } = await admin
    .from("site_onboarding")
    .update({
      intake: merged,
      step: step ?? ob.step ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id")
    .single();

  return updated ? toState(updated, await tokenForSite(admin, siteId)) : null;
}

/** Ajoute des URLs de photos à l'intake (append, ordre préservé). */
export async function appendPhotoUrls(
  siteId: string,
  urls: string[],
): Promise<string[]> {
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const intake = (ob?.intake ?? {}) as Intake;
  const next = [...(intake.photoUrls ?? []), ...urls];
  await admin
    .from("site_onboarding")
    .update({ intake: { ...intake, photoUrls: next }, updated_at: new Date().toISOString() })
    .eq("site_id", siteId);
  return next;
}

// ---------------------------------------------------------------------------
// Mapping intake → contenu (déterministe, sans IA)
// ---------------------------------------------------------------------------

/** Index de la page d'accueil dans un contenu v2 ({ pages: [...] }). */
function homeBase(defaultContent: Record<string, unknown>): string {
  const pages = (defaultContent as { pages?: { slug?: string }[] }).pages;
  if (!Array.isArray(pages) || pages.length === 0) return "";
  const i = pages.findIndex((p) => p?.slug === "/" || p?.slug === "");
  return `pages[${i < 0 ? 0 : i}].content`;
}

/**
 * Traduit l'intake structuré en surcharges texte (chemins concrets). On ne pose
 * QUE des chemins qui existent déjà dans le contenu (miroir de briefToOverrides),
 * pour ne jamais salir la structure du template.
 */
export function intakeToOverrides(
  intake: Intake,
  defaultContent: Record<string, unknown>,
): Record<string, string> {
  const base = homeBase(defaultContent);
  const join = (p: string) => (base ? `${base}.${p}` : p);
  const out: Record<string, string> = {};

  const put = (path: string, value: string | undefined, max = 200) => {
    if (!value) return;
    if (getPath(defaultContent, path) === undefined) return; // champ inexistant → on s'abstient
    out[path] = value.trim().slice(0, max);
  };

  // Marque.
  if (intake.brand) {
    put(join("hero.brand"), intake.brand, 24);
    put("site.brand", intake.brand, 40);
  }
  // Accroche / histoire.
  if (intake.about) {
    put(join("hero.subtitle"), intake.about, 140);
    put(join("scrollText"), intake.about, 260);
  }
  // Contact.
  if (intake.contactEmail) {
    put(join("footer.email"), intake.contactEmail, 80);
    put("site.footer.email", intake.contactEmail, 80);
  }
  // Services = types d'événements (photographe).
  const services = (intake.services?.length
    ? intake.services
    : (intake.eventTypes ?? []).map(eventLabel)
  ).filter(Boolean);
  services.forEach((name, i) => put(join(`services[${i}].name`), name, 40));

  return out;
}

/** Construit le contenu final d'un intake (v2 SPA ou plat HTML), adapté au métier. */
export async function buildDraftContent(
  origin: string,
  state: { intake: Intake; categoryId: string; templateId: TemplateId },
): Promise<AnyContent | null> {
  const baseContent = (await fetchDefaultContent(origin, state.templateId)) as
    | Record<string, unknown>
    | null;
  if (!baseContent) return null;

  const overrides = intakeToOverrides(state.intake, baseContent);

  // Photos déposées → remplacent les slots démo dans l'ordre.
  const imageMap: Record<string, string> = {};
  const photoUrls = state.intake.photoUrls ?? [];
  if (photoUrls.length > 0) {
    const slots = collectImageSlots(baseContent, state.templateId);
    for (let i = 0; i < photoUrls.length && i < slots.length; i++) {
      imageMap[slots[i]] = photoUrls[i];
    }
  }

  const content = buildContent(baseContent, overrides, imageMap);

  // Adaptation : retire les sections qui ne collent pas au client.
  const { drop } = dropSectionsForIntake(state.categoryId, state.templateId, state.intake);
  if (drop.length > 0) pruneSections(content, drop);

  // Lignée SPA → v2 ; lignée HTML → PLAT (sinon l'hydratation ne trouve rien).
  return contentForTemplate(content, state.templateId);
}

/** Supprime des sections (clés) de chaque page d'un contenu v2. */
function pruneSections(content: Record<string, unknown>, sections: string[]) {
  const pages = (content as { pages?: { content?: Record<string, unknown> }[] }).pages;
  if (!Array.isArray(pages)) return;
  for (const page of pages) {
    if (!page?.content) continue;
    for (const key of sections) {
      if (key in page.content) delete page.content[key];
    }
  }
}

/** (Re)construit le contenu d'un site depuis son onboarding, pour un template donné. */
export async function regenerateForSite(
  origin: string,
  siteId: string,
  templateOverride?: TemplateId,
): Promise<{ content: AnyContent; templateId: TemplateId } | null> {
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake, chosen_template_id")
    .eq("site_id", siteId)
    .maybeSingle();
  if (!ob) return null;

  const intake = (ob.intake ?? {}) as Intake & { categoryId?: string };
  const categoryId = intake.categoryId ?? DEFAULT_CATEGORY.id;
  const templateId =
    templateOverride ??
    (ob.chosen_template_id && isTemplateId(ob.chosen_template_id)
      ? ob.chosen_template_id
      : recommendedTemplate(categoryId));

  const content = await buildDraftContent(origin, { intake, categoryId, templateId });
  if (!content) return null;
  return { content, templateId };
}

/**
 * Fige la DA choisie : persiste le template, écrit le contenu final dans la
 * version v1 (non publiée) et passe l'étape au paywall.
 */
export async function finalizeChoice(
  origin: string,
  siteId: string,
  templateId: TemplateId,
): Promise<boolean> {
  const admin = createAdminClient();
  const built = await regenerateForSite(origin, siteId, templateId);
  if (!built) return false;

  await admin.from("sites").update({ template_id: templateId }).eq("id", siteId);

  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) {
    await admin
      .from("site_content")
      .update({ content_json: built.content })
      .eq("id", sc.id);
  } else {
    await admin.from("site_content").insert({
      site_id: siteId,
      version: 1,
      content_json: built.content,
      is_published: false,
      created_by: "client",
    });
  }

  await admin
    .from("site_onboarding")
    .update({
      chosen_template_id: templateId,
      step: 100, // paywall
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);

  return true;
}
