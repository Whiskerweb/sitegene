/**
 * Plan de sections du corps + orchestration progressive.
 *
 * Chaque « section » correspond à un slot de l'intake : quand le client répond à
 * une question, la section correspondante peut être générée et stockée dans
 * `site_onboarding.intake.__sections` (clés transientes préfixées `__`, même
 * convention que `__headerHtml` / `__triedTemplates`).
 *
 * Deux entrées publiques :
 *  - `triggerSectionGeneration` : génère UNE section et la persiste (idempotent).
 *  - `buildStateForSite`        : état de construction pour le poll client.
 *
 * SERVEUR uniquement.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { Intake } from "@/lib/onboarding-config";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import { imagePlanFor } from "@/lib/image-plan";
import { generateSection } from "@/lib/design-system-gen";
import { buildGenFacts, photoUrlsForIntake } from "@/lib/onboarding";

type Admin = ReturnType<typeof createAdminClient>;

export type SectionStatus = "pending" | "streaming" | "done" | "error";
export type SectionState = { html?: string; status: SectionStatus; title: string };
export type SectionDef = { key: string; slot: string; title: string; brief: (i: Intake) => string };

/** Définition ORDONNÉE des sections du corps (l'ordre = l'ordre de la page). */
export const SECTION_DEFS: SectionDef[] = [
  {
    key: "services",
    slot: "services",
    title: "Prestations / services",
    brief: (i) => (i.services?.length ? i.services.join(" · ") : i.eventTypes?.join(" · ") || ""),
  },
  {
    key: "pricing",
    slot: "priceRange",
    title: "Tarifs",
    brief: (i) => i.priceRange || "",
  },
  {
    key: "about",
    slot: "area",
    title: "À propos / zone",
    brief: (i) =>
      [i.about, i.area || i.city, i.experienceYears, i.certifications]
        .filter(Boolean)
        .join(" — "),
  },
  {
    key: "contact",
    slot: "contact",
    title: "Contact",
    brief: (i) => [i.contactEmail, i.contactPhone].filter(Boolean).join(" · "),
  },
];

/** Section de repli quand le client ne veut PAS de page tarifs. */
const APPROACH_DEF: SectionDef = {
  key: "approach",
  slot: "priceRange",
  title: "Approche / engagements",
  brief: (i) => i.about || i.brief || "Approche et engagements du professionnel",
};

/** Plan de sections applicable à cet intake (pricing → approach si refus tarifs). */
export function sectionPlanForIntake(intake: Intake): SectionDef[] {
  return SECTION_DEFS.map((d) =>
    d.key === "pricing" && intake.wantsPricingPage === false ? APPROACH_DEF : d,
  );
}

// ──────────────────────── Orchestration I/O Supabase ────────────────────────

type IntakeX = Intake & {
  categoryId?: string;
  __headerHtml?: string;
  __sections?: Record<string, SectionState>;
  __sectionPlan?: string[];
};

async function loadIntake(
  admin: Admin,
  siteId: string,
): Promise<{ intake: IntakeX; templateId: TemplateId | null } | null> {
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake, chosen_template_id")
    .eq("site_id", siteId)
    .maybeSingle();
  if (!ob) return null;
  const intake = (ob.intake ?? {}) as IntakeX;
  const templateId =
    ob.chosen_template_id && isTemplateId(ob.chosen_template_id)
      ? ob.chosen_template_id
      : null;
  return { intake, templateId };
}

/** Contexte compact des sections déjà produites (ouvertures de balise) pour alterner les fonds. */
function priorContext(intake: IntakeX, plan: string[], upTo: string): string {
  const out: string[] = [];
  for (const key of plan) {
    if (key === upTo) break;
    const html = intake.__sections?.[key]?.html;
    if (html) out.push(html.slice(0, 200));
  }
  return out.join("\n");
}

/** Génère UNE section et la persiste dans intake.__sections (idempotent). */
export async function triggerSectionGeneration(
  origin: string,
  siteId: string,
  sectionKey: string,
): Promise<void> {
  const admin = createAdminClient();
  const loaded = await loadIntake(admin, siteId);
  if (!loaded?.templateId || !loaded.intake.__headerHtml) return;
  const { intake, templateId } = loaded;
  const plan = sectionPlanForIntake(intake);
  const def = plan.find((d) => d.key === sectionKey);
  if (!def) return;
  const existing = intake.__sections?.[sectionKey];
  if (existing && (existing.status === "done" || existing.status === "streaming")) return;

  await patchSections(admin, siteId, { [sectionKey]: { status: "streaming", title: def.title } });

  const res = await generateSection({
    origin,
    templateId,
    sectionKey,
    sectionTitle: def.title,
    sectionBrief: def.brief(intake),
    facts: buildGenFacts(intake),
    headerDoc: intake.__headerHtml!,
    priorSectionsContext: priorContext(intake, plan.map((d) => d.key), sectionKey),
    imagePlan: await imagePlanFor(origin, templateId, intake),
    photoUrls: photoUrlsForIntake(intake),
  });

  await patchSections(admin, siteId, {
    [sectionKey]: res.ok
      ? { status: "done", html: res.sectionHtml, title: def.title }
      : { status: "error", title: def.title },
  });
}

/** Merge non destructif dans intake.__sections (relit pour limiter l'écrasement concurrent). */
async function patchSections(
  admin: Admin,
  siteId: string,
  patch: Record<string, SectionState>,
): Promise<void> {
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const intake = (ob?.intake ?? {}) as IntakeX;
  const sections = { ...(intake.__sections ?? {}), ...patch };
  await admin
    .from("site_onboarding")
    .update({
      intake: { ...intake, __sections: sections },
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);
}

export type BuildState = {
  templateId: string | null;
  headerReady: boolean;
  sections: { key: string; title: string; status: SectionStatus }[];
  allDone: boolean;
};

/** État de construction pour le poll client. */
export async function buildStateForSite(siteId: string): Promise<BuildState> {
  const admin = createAdminClient();
  const loaded = await loadIntake(admin, siteId);
  if (!loaded) return { templateId: null, headerReady: false, sections: [], allDone: false };
  const { intake, templateId } = loaded;
  const plan = sectionPlanForIntake(intake);
  const sections = plan.map((d) => ({
    key: d.key,
    title: d.title,
    status: (intake.__sections?.[d.key]?.status ?? "pending") as SectionStatus,
  }));
  const headerReady = !!intake.__headerHtml;
  const allDone = headerReady && sections.every((s) => s.status === "done");
  return { templateId, headerReady, sections, allDone };
}
