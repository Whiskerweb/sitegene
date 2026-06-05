/**
 * « Appliquer un template à mon site » (page Formules).
 *
 * Reconstruit le contenu du site sur le template cible en PRÉSERVANT les
 * données du client. Source de vérité par ordre de fraîcheur :
 *   1. l'intake d'onboarding (s'il existe) ;
 *   2. ÉCRASÉ par ce qu'on extrait du content_json ACTUEL (textes édités,
 *      photos uploadées) — couvre aussi les sites outreach sans onboarding.
 * Le mapping est le moteur de l'onboarding (buildDraftContent : manifest +
 * photos par rôle + adaptation métier), enrichi best-effort par l'IA
 * (briefToOverrides) où les faits du client gardent le dernier mot — même
 * recette que finalizeChoice.
 *
 * Clés réservées au changement de template : __effects conservés (globaux),
 * __css remis à zéro (écrit pour l'ancien markup), __components abandonnés
 * (ancrés sur des sélecteurs de l'ancien template).
 */
import { buildDraftContent } from "@/lib/onboarding";
import { buildContent, getPath } from "@/lib/content-overlay";
import { categoryForTemplate, getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import { fetchDefaultContent, fetchTemplateManifest } from "@/lib/site-server";
import { briefToOverrides } from "@/lib/mistral";
import {
  contentBases,
  expandManifestPath,
  intakeToOverrides,
  type TemplateManifest,
} from "@/lib/intake-map";
import { briefFromSourceContent } from "@/lib/source-brief";
import type { Intake } from "@/lib/onboarding-config";
import type { TemplateId } from "@/lib/templates";

const IMAGE_URL_RE = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i;

/** URLs de photos CLIENT (hors assets démo des templates) trouvées dans un contenu. */
function collectClientPhotoUrls(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") {
    if (
      /^https?:\/\//i.test(node) &&
      !node.includes("/_templates/") &&
      (IMAGE_URL_RE.test(node) || node.includes("/storage/v1/object/")) &&
      !out.includes(node)
    ) {
      out.push(node);
    }
  } else if (Array.isArray(node)) {
    for (const v of node) collectClientPhotoUrls(v, out);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) collectClientPhotoUrls(v, out);
  }
  return out;
}

/** Première valeur texte non vide parmi des chemins candidats (toutes bases). */
function firstValue(
  content: Record<string, unknown>,
  paths: string[],
): string | undefined {
  const bases = contentBases(content);
  for (const base of bases) {
    for (const p of paths) {
      const full = base ? `${base}.${p}` : p;
      const v = getPath(content, full);
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  // candidats racine (shell v2 : site.brand…)
  for (const p of paths) {
    const v = getPath(content, p);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Intake synthétique extrait du contenu ACTUEL du site (textes réellement en
 * ligne, photos du client). Les chemins viennent du manifest du template
 * actuel + des candidats statiques des deux lignées.
 */
export function synthesizeIntakeFromContent(
  content: Record<string, unknown>,
  currentManifest: TemplateManifest | null,
): Intake {
  const intake: Intake = {};

  intake.brand = firstValue(content, ["brand", "hero.brand", "site.brand"]);
  intake.about = firstValue(content, [
    "hero.subtitle",
    "hero.tagline",
    "scrollText",
    "about.text",
  ]);
  intake.contactEmail = firstValue(content, [
    "footer.email",
    "site.footer.email",
    "topbar.email",
    "contact.email",
    "contactPage.email",
  ]);
  intake.contactPhone = firstValue(content, [
    "topbar.phone",
    "contact.phone",
    "cta.phone",
    "footer.phone",
    "contactPage.phone",
  ]);

  // Prestations : chemins service du manifest actuel, valeurs actuelles.
  const servicePaths = (currentManifest?.fields?.editable ?? [])
    .map((f) => f?.path)
    .filter(
      (p): p is string =>
        typeof p === "string" &&
        /^(?:services|prestations)(?:\.items)?\[\]\.(?:name|title)$/.test(p),
    );
  const services: string[] = [];
  for (const base of contentBases(content)) {
    for (const mp of servicePaths) {
      for (const p of expandManifestPath(content, base, mp)) {
        const v = getPath(content, p);
        if (typeof v === "string" && v.trim() && !services.includes(v.trim())) {
          services.push(v.trim());
        }
      }
    }
  }
  if (services.length > 0) intake.services = services.slice(0, 8);

  const photos = collectClientPhotoUrls(content);
  if (photos.length > 0) intake.photoUrls = photos.slice(0, 24);

  return intake;
}

/** Brief texte pour l'enrichissement IA (même esprit que l'onboarding). */
function briefFrom(intake: Intake & { categoryId?: string }): string {
  return [
    intake.brand && `Nom de la marque : ${intake.brand}`,
    intake.about && `À propos : ${intake.about}`,
    intake.services?.length && `Prestations : ${intake.services.join(", ")}`,
    intake.contactEmail && `Email de contact : ${intake.contactEmail}`,
  ]
    .filter(Boolean)
    .join("\n");
}


// --- Remap + rapport (cœur réutilisable, sans accès DB) ----------------------

/** Rapport de synchronisation montré à l'utilisateur après une bascule de peau. */
export type SyncReport = {
  /** Infos du site source effectivement reprises sur la nouvelle peau. */
  transcribed: string[];
  /** Infos présentes côté source mais sans emplacement dans la nouvelle peau. */
  unmatchedFromSource: string[];
  /** Sections de la nouvelle peau sans réponse (la source n'a rien fourni). */
  emptyInTarget: string[];
};

type Category = { key: keyof Intake; label: string; supports: (m: TemplateManifest | null) => boolean };

const REPORT_CATEGORIES: Category[] = [
  { key: "brand", label: "Nom de la marque", supports: () => true },
  {
    key: "about",
    label: "Texte de présentation",
    supports: (m) => hasPath(m, /(about|tagline|subtitle|scrollText|hero)/i),
  },
  {
    key: "services",
    label: "Prestations / services",
    supports: (m) => hasPath(m, /^(?:services|prestations)/i),
  },
  { key: "photoUrls", label: "Photos", supports: (m) => (m?.photos?.length ?? 0) > 0 },
  { key: "contactEmail", label: "Email de contact", supports: (m) => hasPath(m, /email/i) },
  { key: "contactPhone", label: "Téléphone", supports: (m) => hasPath(m, /phone|tel/i) },
];

function hasPath(m: TemplateManifest | null, re: RegExp): boolean {
  return (m?.fields?.editable ?? []).some((f) => typeof f?.path === "string" && re.test(f.path));
}

function intakeHas(intake: Intake, key: keyof Intake): boolean {
  const v = intake[key];
  return Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : v != null;
}

function buildReport(intake: Intake, targetManifest: TemplateManifest | null): SyncReport {
  const transcribed: string[] = [];
  const unmatchedFromSource: string[] = [];
  const emptyInTarget: string[] = [];
  for (const c of REPORT_CATEGORIES) {
    const has = intakeHas(intake, c.key);
    const supports = c.supports(targetManifest);
    if (has && supports) transcribed.push(c.label);
    else if (has && !supports) unmatchedFromSource.push(c.label);
    else if (!has && supports) emptyInTarget.push(c.label);
  }
  return { transcribed, unmatchedFromSource, emptyInTarget };
}

/**
 * Reconstruit le contenu de la peau `targetTemplateId` à partir du contenu
 * source (peau courante), en préservant les faits du client. Retourne aussi un
 * rapport (transcrit / non placé / vide). AUCUN accès DB ici.
 */
export async function remapContentForTemplate(
  origin: string,
  sourceContent: Record<string, unknown>,
  sourceTemplateId: string | null,
  targetTemplateId: TemplateId,
  baseIntake: Intake & { categoryId?: string } = {},
): Promise<{ content: Record<string, unknown>; report: SyncReport } | null> {
  // 1) Intake = onboarding ⟵ écrasé par l'extraction du contenu actuel.
  const currentManifest = sourceTemplateId
    ? ((await fetchTemplateManifest(origin, sourceTemplateId)) as TemplateManifest | null)
    : null;
  const extracted = synthesizeIntakeFromContent(sourceContent, currentManifest);
  const intake: Intake & { categoryId?: string } = { ...baseIntake };
  for (const [k, v] of Object.entries(extracted)) {
    if (v !== undefined && (Array.isArray(v) ? v.length > 0 : true)) {
      (intake as Record<string, unknown>)[k] = v;
    }
  }

  const categoryId =
    intake.categoryId ??
    categoryForTemplate(sourceTemplateId ?? "")?.id ??
    DEFAULT_CATEGORY.id;

  // 2) Contenu sur le template cible (mapping déterministe du moteur onboarding).
  const built = await buildDraftContent(origin, { intake, categoryId, templateId: targetTemplateId });
  if (!built) return null;
  let nextContent = built as Record<string, unknown>;

  const targetManifest = (await fetchTemplateManifest(origin, targetTemplateId)) as
    | TemplateManifest
    | null;

  // 3) Enrichissement IA : on donne à l'IA TOUT le contenu réel du site source
  //    (brief riche) pour qu'elle le retranscrive fidèlement sur le template
  //    cible — pas un brief résumé qui produirait du générique. Repli sur le
  //    brief court (intake) si le source est vide.
  try {
    const richBrief = briefFromSourceContent(sourceContent);
    const brief = richBrief.trim().length > 20 ? richBrief : briefFrom(intake);
    if (brief.trim().length > 10) {
      const baseContent = (await fetchDefaultContent(origin, targetTemplateId)) as
        | Record<string, unknown>
        | null;
      if (baseContent) {
        const category = getCategory(categoryId) ?? DEFAULT_CATEGORY;
        const enriched = await briefToOverrides({
          brief,
          manifest: targetManifest,
          defaultContent: baseContent,
          categoryLabel: category.label,
          briefMaxChars: 5000,
        });
        const facts = intakeToOverrides(intake, baseContent, targetManifest);
        const merged = Object.fromEntries(
          Object.entries({ ...enriched, ...facts }).filter(
            ([p]) => getPath(nextContent, p) !== undefined,
          ),
        );
        if (Object.keys(merged).length > 0) {
          nextContent = buildContent(nextContent, merged, {}) as Record<string, unknown>;
        }
      }
    }
  } catch (e) {
    console.error("[remap] enrich:", e instanceof Error ? e.message : e);
  }

  // 4) Clés réservées : __effects suivent, __css/__components repartent à zéro.
  const effects = (sourceContent as { __effects?: unknown }).__effects;
  if (Array.isArray(effects) && effects.length > 0) {
    (nextContent as Record<string, unknown>).__effects = effects;
  }

  return { content: nextContent, report: buildReport(intake, targetManifest) };
}

