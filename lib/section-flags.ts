/**
 * [5.2/5.3] Masquage conditionnel des blocs : règle absolue — si le client n'a
 * PAS fourni les données d'un bloc, le bloc est MASQUÉ (preview ET site final).
 * Jamais de faux témoignages, de logos de clients inventés ou de chiffres
 * sortis de nulle part sur un site présenté comme « le sien ».
 *
 * Le système est piloté par des FLAGS calculés depuis l'intake, croisés avec
 * les clés de sections du template (manifest.sections + clés racine du
 * contenu plat). Pur et testé ; l'application se fait :
 *  - lignée HTML : `__dropSections`/`__dropItems` posés dans le contenu plat,
 *    masqués au rendu par le runtime injecté (lib/site-server.ts) ;
 *  - lignée SPA : sections retirées du contenu v2 (les composants ne les
 *    rendent plus) + tableaux de prestations tronqués.
 */
import type { Intake } from "@/lib/onboarding-config";

export type SectionFlags = {
  /** Clients/partenaires fournis ? (jamais collecté aujourd'hui → false). */
  hasClients: boolean;
  /** Avis clients réels fournis ? */
  hasTestimonials: boolean;
  hasBlog: boolean;
  hasTeam: boolean;
  hasStats: boolean;
  /** Au moins une photo déposée (sinon la galerie est masquée). */
  hasGallery: boolean;
  /** Nombre de spécialités EXPLICITEMENT choisies (0 = pas de choix). */
  specialtyCount: number;
};

/** Calcule les flags de blocs depuis les réponses du client. */
export function flagsForIntake(intake: Intake): SectionFlags {
  return {
    hasClients: false, // non collecté — toujours masqué (« FEATURED & TRUSTED BY »)
    hasTestimonials: false, // les témoignages de démo sont des FAUX avis — masqués
    hasBlog: false,
    hasTeam: false,
    hasStats: false,
    hasGallery: (intake.photoUrls?.length ?? 0) > 0,
    specialtyCount: intake.eventTypes?.length ?? intake.services?.length ?? 0,
  };
}

/** Clé de section (manifest/contenu) → flag qui l'autorise. */
const SECTION_FLAG: [needle: RegExp, flag: keyof SectionFlags][] = [
  [/^(logos?|clients?|brands?|collaborations?|partners?|press|featured)$/i, "hasClients"],
  [/^(testimonials?|reviews?|avis|temoignages?|quotes?)$/i, "hasTestimonials"],
  [/^(blog|news|journal|articles?|posts?)$/i, "hasBlog"],
  [/^(team|equipe|staff)$/i, "hasTeam"],
  [/^(stats?|numbers|chiffres|metrics|counters?)$/i, "hasStats"],
  [/^(gallery|galerie|portfolio|works|realisations?)$/i, "hasGallery"],
];

/**
 * Sections à masquer pour un jeu de clés (sections du template) et des flags.
 * Conservateur : seules les clés reconnues par SECTION_FLAG sont masquables ;
 * tout le reste (hero, services, contact…) est intouchable.
 */
export function dropSectionsForFlags(
  sectionKeys: string[],
  flags: SectionFlags,
): string[] {
  const out: string[] = [];
  for (const key of sectionKeys) {
    for (const [needle, flag] of SECTION_FLAG) {
      if (needle.test(key) && flags[flag] === false) {
        if (!out.includes(key)) out.push(key);
        break;
      }
    }
  }
  return out;
}

/**
 * [5.2] Items de prestations EN TROP : le client a coché N spécialités → on
 * n'affiche QUE N items (jamais « 01 Entreprise / 02 Mariages / 03 Famille /
 * 04 Éditorial » quand il n'a coché que 2 cases). Renvoie les chemins racine
 * des items à masquer dans un contenu PLAT (lignée HTML), ex.
 * "services.items[3]".
 */
export function dropItemPathsForContent(
  content: Record<string, unknown>,
  specialtyCount: number,
): string[] {
  if (specialtyCount <= 0) return [];
  const out: string[] = [];
  for (const [rootKey, value] of Object.entries(content)) {
    if (!/^(services|prestations|specialties)$/i.test(rootKey)) continue;
    const arr = Array.isArray(value)
      ? { path: rootKey, items: value }
      : value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)
        ? { path: `${rootKey}.items`, items: (value as { items: unknown[] }).items }
        : null;
    if (!arr) continue;
    for (let i = specialtyCount; i < arr.items.length; i++) {
      out.push(`${arr.path}[${i}]`);
    }
  }
  return out;
}

/** Tronque les tableaux de prestations d'un contenu v2 (lignée SPA), en place. */
export function truncateSpaServices(
  content: Record<string, unknown>,
  specialtyCount: number,
): void {
  if (specialtyCount <= 0) return;
  const pages = (content as { pages?: { content?: Record<string, unknown> }[] }).pages;
  if (!Array.isArray(pages)) return;
  for (const page of pages) {
    const c = page?.content;
    if (!c) continue;
    for (const key of Object.keys(c)) {
      if (!/^(services|prestations)$/i.test(key)) continue;
      const v = c[key];
      if (Array.isArray(v) && v.length > specialtyCount) {
        c[key] = v.slice(0, specialtyCount);
      } else if (
        v &&
        typeof v === "object" &&
        Array.isArray((v as { items?: unknown[] }).items)
      ) {
        const items = (v as { items: unknown[] }).items;
        if (items.length > specialtyCount) {
          (v as { items: unknown[] }).items = items.slice(0, specialtyCount);
        }
      }
    }
  }
}
