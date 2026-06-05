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
import { ensureTemplateRow, generateSite } from "@/lib/generate";
import { buildContent, getPath } from "@/lib/content-overlay";
import { contentForTemplate, type AnyContent } from "@/lib/site-content";
import { fetchDefaultContent, fetchTemplateManifest } from "@/lib/site-server";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import { detectCategory } from "@/lib/category-detect";
import { mineIntake, mergeMined } from "@/lib/intake-mine";
import { isSpaTemplate, isTemplateId, type TemplateId } from "@/lib/templates";
import { dropSectionsForIntake, eventLabel, type Intake } from "@/lib/onboarding-config";
import {
  flagsForIntake,
  dropSectionsForFlags,
  dropItemPathsForContent,
  truncateSpaServices,
} from "@/lib/section-flags";
import {
  buildPhotoMap,
  intakeToOverrides,
  photoSlotUrls,
  PHOTO_PLACEHOLDER_URL,
  type TemplateManifest,
} from "@/lib/intake-map";
import { briefToOverrides } from "@/lib/mistral";

export type OnboardingState = {
  siteId: string;
  token: string | null;
  categoryId: string;
  templateId: TemplateId;
  chosenTemplateId: string | null;
  candidateTemplateIds: TemplateId[];
  step: number;
  intake: Intake & { categoryId?: string };
  skippedQuestions: string[];
};

type Admin = ReturnType<typeof createAdminClient>;

/** Le client a déjà un site en ligne : l'onboarding n'a plus lieu d'être. */
export class AlreadyLiveError extends Error {
  constructor() {
    super("Votre site est déjà en ligne.");
    this.name = "AlreadyLiveError";
  }
}

/** Déduit un nom de marque du brief (« Camille, photographe… » → « Camille »), ou null. */
function brandFromBrief(brief: string): string | null {
  const firstLine = brief.split(/[\n.]/)[0]?.trim() ?? "";
  const head = firstLine.split(/[,–—-]/)[0]?.trim() ?? "";
  const name = head.replace(/^(je m'appelle|moi c'est|c'est)\s+/i, "").trim();
  // Une « marque » de plus de 5 mots est une phrase, pas un nom.
  if (!name || name.split(/\s+/).length > 5) return null;
  return name.slice(0, 40);
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
    skipped_questions?: string[] | null;
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
    skippedQuestions: row.skipped_questions ?? [],
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
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id, skipped_questions")
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
  /** Catégorie explicite (choix utilisateur). Sinon, détectée depuis le brief. */
  categoryId?: string;
}): Promise<OnboardingState> {
  const existing = await loadOnboarding(input.userId);
  if (existing) return existing;

  const admin = createAdminClient();

  // Client déjà en ligne (payé/essai) : on ne crée PAS un second site — un
  // brouillon plus récent masquerait son site débloqué dans le dashboard et
  // l'éditeur (il retombait sur le paywall d'essai après avoir payé).
  const { data: liveSite } = await admin
    .from("sites")
    .select("id")
    .eq("owner_user_id", input.userId)
    .eq("status", "live")
    .limit(1)
    .maybeSingle();
  if (liveSite?.id) throw new AlreadyLiveError();
  // [2.1] Le métier est DÉTECTÉ depuis le texte libre, jamais supposé. Une
  // détection sûre route directement ; ambiguë ou absente → la conversation
  // ouvrira sur la confirmation du métier ([2.2], categoryConfirmed=false).
  const explicit = getCategory(input.categoryId ?? "");
  const detected = detectCategory(input.brief);
  const category =
    explicit ??
    (detected.categoryId ? getCategory(detected.categoryId) : undefined) ??
    DEFAULT_CATEGORY;
  const categoryConfirmed = Boolean(explicit) || detected.confidence === "high";
  const templateId = category.defaultTemplateId;
  const brand = brandFromBrief(input.brief) ?? "Votre Studio";

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

  // [3.1] Le brief est miné dès le départ : chaque champ qu'il couvre (ville,
  // tarifs, spécialités, contact…) ne sera pas redemandé en conversation.
  const intake: Intake = mergeMined(
    {
      brief: input.brief,
      brand: brandFromBrief(input.brief) ?? undefined,
      categoryId: category.id,
      categoryConfirmed,
      contactEmail: input.email ?? undefined,
    },
    mineIntake(input.brief),
  );

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
    skippedQuestions: [],
  };
}

/** Fusionne un patch dans l'intake (et les questions passées) ; renvoie l'état. */
export async function saveIntake(
  siteId: string,
  patch: Partial<Intake>,
  step?: number,
  skipped?: string[],
): Promise<OnboardingState | null> {
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id, skipped_questions")
    .eq("site_id", siteId)
    .maybeSingle();
  if (!ob) return null;

  const merged = { ...(ob.intake as Record<string, unknown>), ...patch };
  const mergedSkipped = Array.from(
    new Set([...((ob.skipped_questions as string[]) ?? []), ...(skipped ?? [])]),
  );
  const { data: updated } = await admin
    .from("site_onboarding")
    .update({
      intake: merged,
      step: step ?? ob.step ?? 0,
      skipped_questions: mergedSkipped,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .select("site_id, intake, step, candidate_template_ids, chosen_template_id, skipped_questions")
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
// Construction du contenu (mapping déterministe via lib/intake-map)
// ---------------------------------------------------------------------------

/**
 * Mode de remplissage des slots photo quand le client n'a fourni aucune image :
 *  - "demo" (défaut, tunnel outreach) : les visuels de démo restent ;
 *  - "placeholder" (self-serve) : aplats neutres — jamais une photo d'inconnu
 *    sur un site présenté comme « le sien ».
 * Dès qu'il y a ≥ 1 photo client, elles sont cyclées sur TOUS les slots.
 */
export type EmptyPhotoMode = "demo" | "placeholder";

export type BuildOpts = {
  emptyPhotos?: EmptyPhotoMode;
  /**
   * [5.2/5.3] Masquage des blocs sans données client (témoignages, logos,
   * stats, blog, équipe ; galerie sans photo ; items de prestations en trop).
   * "strict" en self-serve (site « production-ready ») ; défaut : off
   * (outreach — le site de démo assume ses visuels).
   */
  mask?: "strict" | "off";
};

/** Construit le contenu final d'un intake (v2 SPA ou plat HTML), adapté au métier. */
export async function buildDraftContent(
  origin: string,
  state: { intake: Intake; categoryId: string; templateId: TemplateId },
  opts?: BuildOpts,
): Promise<AnyContent | null> {
  const baseContent = (await fetchDefaultContent(origin, state.templateId)) as
    | Record<string, unknown>
    | null;
  if (!baseContent) return null;

  const manifest = (await fetchTemplateManifest(origin, state.templateId)) as
    | TemplateManifest
    | null;

  // Mapping piloté par le manifest : nom de marque, accroche, contact,
  // prestations — sur les chemins réels du template (les 2 lignées).
  const overrides = intakeToOverrides(state.intake, baseContent, manifest);

  // Photos déposées → slots catégorisés par rôle (hero → services → galerie,
  // jamais un avatar/logo), pilotés par manifest.photos. Les photos client sont
  // CYCLÉES sur tous les slots — aucune photo de démo ne survit.
  const slots = photoSlotUrls(baseContent, state.templateId, manifest);
  const imageMap = buildPhotoMap(
    slots,
    state.intake.photoUrls ?? [],
    opts?.emptyPhotos === "placeholder" ? PHOTO_PLACEHOLDER_URL : null,
  );

  const content = buildContent(baseContent, overrides, imageMap);

  // Adaptation : retire les sections qui ne collent pas au client.
  const { drop } = dropSectionsForIntake(state.categoryId, state.templateId, state.intake);
  if (drop.length > 0) pruneSections(content, drop);

  // [5.2/5.3] Masquage strict (self-serve) : aucun bloc aux données non
  // fournies ne survit — ni en preview, ni sur le site publié.
  if (opts?.mask === "strict") {
    const flags = flagsForIntake(state.intake);
    if (isSpaTemplate(state.templateId)) {
      // Lignée SPA : sections retirées du contenu v2 + prestations tronquées.
      const spaDrop = dropSectionsForFlags(
        Object.keys(
          ((content as { pages?: { content?: Record<string, unknown> }[] }).pages ?? [])
            .flatMap((p) => Object.keys(p?.content ?? {}))
            .reduce<Record<string, true>>((acc, k) => ((acc[k] = true), acc), {}),
        ),
        flags,
      );
      if (spaDrop.length > 0) pruneSections(content, spaDrop);
      truncateSpaServices(content, flags.specialtyCount);
    }
  }

  // Lignée SPA → v2 ; lignée HTML → PLAT (sinon l'hydratation ne trouve rien).
  const final = contentForTemplate(content, state.templateId);

  // Lignée HTML (contenu PLAT) : directives lues par le runtime de masquage.
  if (opts?.mask === "strict" && !isSpaTemplate(state.templateId)) {
    const flags = flagsForIntake(state.intake);
    const flat = final as Record<string, unknown>;
    const dropSections = dropSectionsForFlags(
      Object.keys(flat).filter((k) => !k.startsWith("__")),
      flags,
    );
    const dropItems = dropItemPathsForContent(flat, flags.specialtyCount);
    if (dropSections.length > 0) flat.__dropSections = dropSections;
    if (dropItems.length > 0) flat.__dropItems = dropItems;
  }

  return final;
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
  opts?: BuildOpts,
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

  const content = await buildDraftContent(origin, { intake, categoryId, templateId }, opts);
  if (!content) return null;
  return { content, templateId };
}

/** Brief enrichi des réponses structurées, pour la réécriture IA du site final. */
function briefFromIntake(intake: Intake & { categoryId?: string }): string {
  const parts = [
    intake.brief,
    intake.brand && `Nom de la marque : ${intake.brand}`,
    intake.eventTypes?.length &&
      `Spécialités : ${intake.eventTypes.map(eventLabel).join(", ")}`,
    intake.about && `À propos : ${intake.about}`,
    intake.techRider && `Fiche technique : ${intake.techRider}`,
    // [3.3] Champs étendus par catégorie — tout ce que le client a donné nourrit l'IA.
    intake.experienceYears && `Expérience : ${intake.experienceYears}`,
    intake.priceRange && `Tarifs : ${intake.priceRange}`,
    intake.city && `Ville : ${intake.city}`,
    intake.genre && `Genre musical : ${intake.genre}`,
    intake.socialLinks && `Réseaux : ${intake.socialLinks}`,
    intake.musicLinks && `Extraits musicaux : ${intake.musicLinks}`,
    intake.upcomingDates && `Prochaines dates : ${intake.upcomingDates}`,
    intake.trade && `Métier et spécialités : ${intake.trade}`,
    intake.area && `Zone d'intervention : ${intake.area}`,
    intake.certifications && `Certifications : ${intake.certifications}`,
    intake.reviewsLink && `Avis clients : ${intake.reviewsLink}`,
    intake.jobTitle && `Titre professionnel : ${intake.jobTitle}`,
    intake.skills && `Compétences : ${intake.skills}`,
    intake.projects && `Projets : ${intake.projects}`,
    intake.availability && `Disponibilité : ${intake.availability}`,
    intake.instagram && `Instagram : ${intake.instagram}`,
    intake.contactPhone && `Téléphone : ${intake.contactPhone}`,
    intake.contactEmail && `Email de contact : ${intake.contactEmail}`,
  ];
  return parts.filter(Boolean).join("\n");
}

/**
 * Fige la DA choisie : persiste le template, écrit le contenu final
 * DÉTERMINISTE dans la dernière version (non publiée) et passe l'étape au
 * paywall — AUCUNE IA avant la persistance (un échec/timeout d'enrichissement
 * ne doit jamais laisser le site sur le template par défaut). L'enrichissement
 * IA suit, best-effort : inline ici (tunnel outreach, `enrich !== false`) ou
 * via un appel séparé à `enrichFinalContent` (self-serve : l'écran de
 * construction pilote les deux étapes).
 */
export async function finalizeChoice(
  origin: string,
  siteId: string,
  templateId: TemplateId,
  opts?: { enrich?: boolean } & BuildOpts,
): Promise<boolean> {
  const admin = createAdminClient();
  const built = await regenerateForSite(origin, siteId, templateId, opts);
  if (!built) return false;

  // FK sites.template_id → templates(id) : enregistre le template à la volée
  // (le catalogue vit dans le code), puis VÉRIFIE l'écriture — un échec
  // silencieux ici laissait le site publié sur le template par défaut.
  await ensureTemplateRow(admin, templateId);
  const { error: tplErr } = await admin
    .from("sites")
    .update({ template_id: templateId })
    .eq("id", siteId);
  if (tplErr) {
    console.error("[onboarding/finalize] template:", tplErr.message);
    return false;
  }

  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error: scErr } = sc
    ? await admin
        .from("site_content")
        .update({ content_json: built.content, template_id: templateId })
        .eq("id", sc.id)
    : await admin.from("site_content").insert({
        site_id: siteId,
        template_id: templateId,
        version: 1,
        content_json: built.content,
        is_published: false,
        created_by: "client",
      });
  if (scErr) {
    console.error("[onboarding/finalize] contenu:", scErr.message);
    return false;
  }

  await admin
    .from("site_onboarding")
    .update({
      chosen_template_id: templateId,
      step: 100, // paywall
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);

  if (opts?.enrich !== false) await enrichFinalContent(origin, siteId);
  return true;
}

/**
 * Enrichissement IA du contenu final (réécriture FR de tous les champs texte du
 * template choisi, à partir du brief + réponses). Best-effort et idempotent :
 * relit le contenu persisté, applique {IA, puis faits client par-dessus} et ne
 * touche jamais un chemin absent (sections retirées par l'adaptation métier).
 * Renvoie false si rien n'a été enrichi (IA indisponible, timeout, déjà fait…)
 * — le contenu déterministe reste, le site est utilisable tel quel.
 */
export async function enrichFinalContent(origin: string, siteId: string): Promise<boolean> {
  const admin = createAdminClient();
  try {
    const { data: ob } = await admin
      .from("site_onboarding")
      .select("intake, chosen_template_id")
      .eq("site_id", siteId)
      .maybeSingle();
    if (!ob?.chosen_template_id || !isTemplateId(ob.chosen_template_id)) return false;
    const templateId = ob.chosen_template_id;
    const intake = (ob.intake ?? {}) as Intake & { categoryId?: string };

    const brief = briefFromIntake(intake);
    if (brief.trim().length <= 10) return false;

    const { data: sc } = await admin
      .from("site_content")
      .select("id, content_json")
      .eq("site_id", siteId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const current = sc?.content_json as Record<string, unknown> | undefined;
    if (!sc || !current) return false;

    const baseContent = (await fetchDefaultContent(origin, templateId)) as
      | Record<string, unknown>
      | null;
    if (!baseContent) return false;
    const manifest = (await fetchTemplateManifest(origin, templateId)) as
      | TemplateManifest
      | null;

    const category = getCategory(intake.categoryId ?? "") ?? DEFAULT_CATEGORY;
    const enriched = await briefToOverrides({
      brief,
      manifest,
      defaultContent: baseContent,
      categoryLabel: category.label,
      timeoutMs: 35_000,
    });
    // Les réponses explicites du client écrasent l'IA (jamais l'inverse) ; et
    // on ne pose jamais un chemin absent du contenu persisté.
    const facts = intakeToOverrides(intake, baseContent, manifest);
    const merged = Object.fromEntries(
      Object.entries({ ...enriched, ...facts }).filter(
        ([p]) => getPath(current, p) !== undefined,
      ),
    );
    if (Object.keys(merged).length === 0) return false;

    const next = buildContent(current, merged, {});
    await admin.from("site_content").update({ content_json: next }).eq("id", sc.id);
    return true;
  } catch (e) {
    console.error("[onboarding/enrich]", e instanceof Error ? e.message : e);
    return false;
  }
}
