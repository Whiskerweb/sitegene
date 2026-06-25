// lib/foundry/server.ts
// Persistance des sites ASSEMBLÉS (fonderie) — SERVEUR/admin uniquement.
// Un site assemblé = peau `foundry` du modèle « 1 site / N peaux » (0020) :
// la recette vit dans site_content.content_json.__recipe, le circuit
// snapshots/publication/facturation existant reste inchangé.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Recipe } from "./types";
import { getManifest } from "./manifests";
import { normalizeSectionContent } from "./agenceur";
import { roleLabel } from "./roles";
import {
  loadEditableSnapshot,
  saveDraftSnapshot,
  type ContentRow,
} from "@/lib/site-content-store";

export const FOUNDRY_TEMPLATE_ID = "foundry";

/** Ligne templates 'foundry' (FK sites.template_id) — idempotent. */
export async function ensureFoundryTemplateRow(admin: SupabaseClient): Promise<void> {
  await admin.from("templates").upsert(
    { id: FOUNDRY_TEMPLATE_ID, name: "Site assemblé (fonderie)", version: "1" },
    { onConflict: "id", ignoreDuplicates: true },
  );
}

/**
 * Sous-page d'un site assemblé. Elle ne contient QUE ses sections de contenu :
 * la navbar et le footer de l'accueil sont réutilisés au rendu (cohérence DA,
 * mêmes boutons). La vibe/charte est celle de l'accueil (partagée).
 */
export interface FoundryPage {
  id: string;
  slug: string;
  title: string;
  purpose: string;
  sections: Recipe["sections"];
}

export interface FoundryContent {
  __recipe: Recipe;
  __brief?: string;
  __businessName?: string;
  /**
   * Composants déjà ACQUIS pour ce site (livrés à la génération OU achetés) :
   * gratuits à vie, même après les avoir retirés puis remis. Accumulé à chaque
   * sauvegarde — un composant n'entre dans la recette que s'il est légitime
   * (inclus, livré ou payé), donc cette liste ne contient que des acquis.
   */
  __acquired?: string[];
  /** Sous-pages du site (l'accueil = __recipe). */
  __pages?: FoundryPage[];
}

/** Composants acquis (gratuits à vie) enregistrés dans un snapshot. */
export function acquiredFromSnapshot(row: ContentRow | null): string[] {
  const a = (row?.content_json as Partial<FoundryContent> | null)?.__acquired;
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
}

/** Sous-pages enregistrées dans un snapshot. */
export function pagesFromSnapshot(row: ContentRow | null): FoundryPage[] {
  const p = (row?.content_json as Partial<FoundryContent> | null)?.__pages;
  if (!Array.isArray(p)) return [];
  return p.filter(
    (x): x is FoundryPage =>
      !!x && typeof x.id === "string" && typeof x.slug === "string" && Array.isArray(x.sections),
  );
}

/** Slug d'URL à partir d'un titre (sans accents, kebab-case). */
export function slugify(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "page";
}

const RESERVED_SLUGS = new Set(["", "accueil", "home", "index"]);

/** Slug unique parmi les pages existantes (suffixe -2, -3… si besoin). */
export function uniquePageSlug(title: string, pages: FoundryPage[]): string {
  const taken = new Set([...pages.map((p) => p.slug), ...RESERVED_SLUGS]);
  let slug = slugify(title);
  if (taken.has(slug)) {
    let n = 2;
    while (taken.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  return slug;
}

/** Section de la navbar de l'accueil (ou null). */
function navbarOf(recipe: Recipe): Recipe["sections"][number] | null {
  return recipe.sections.find((s) => getManifest(s.component)?.role === "navbar") ?? null;
}
/** Section du footer de l'accueil (ou null). */
function footerOf(recipe: Recipe): Recipe["sections"][number] | null {
  return recipe.sections.find((s) => getManifest(s.component)?.role === "footer") ?? null;
}

/**
 * Recette RENDABLE d'une sous-page : navbar de l'accueil + sections de la page +
 * footer de l'accueil, sur la charte de l'accueil. Garantit la cohérence
 * header/footer/DA entre toutes les pages du site.
 */
export function composePageRecipe(home: Recipe, page: FoundryPage): Recipe {
  const nav = navbarOf(home);
  const foot = footerOf(home);
  const middle = page.sections.filter((s) => {
    const role = getManifest(s.component)?.role;
    return role !== "navbar" && role !== "footer";
  });
  return {
    vibe: home.vibe,
    customVibe: home.customVibe,
    brand: home.brand,
    sections: [...(nav ? [nav] : []), ...middle, ...(foot ? [foot] : [])],
  };
}

/** Extrait la recette d'un snapshot (null si le snapshot n'est pas une recette). */
export function recipeFromSnapshot(row: ContentRow | null): Recipe | null {
  const recipe = (row?.content_json as Partial<FoundryContent> | null)?.__recipe;
  if (!recipe || typeof recipe !== "object" || !Array.isArray(recipe.sections)) return null;
  return recipe as Recipe;
}

/** Sauvegarde la recette comme brouillon de la peau foundry. */
export async function saveRecipeDraft(
  admin: SupabaseClient,
  siteId: string,
  recipe: Recipe,
  meta: { brief?: string; businessName?: string } = {},
): Promise<number> {
  const existing = await loadEditableSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID);
  const prev = (existing?.content_json ?? {}) as Partial<FoundryContent>;
  // Tout composant présent dans la recette est légitime (inclus/livré/payé) :
  // on l'enregistre comme acquis à vie (gratuit même après l'avoir retiré).
  const acquired = Array.from(new Set([...(prev.__acquired ?? []), ...recipe.sections.map((s) => s.component)]));
  const content: FoundryContent = {
    __recipe: recipe,
    __brief: meta.brief ?? prev.__brief,
    __businessName: meta.businessName ?? prev.__businessName,
    __acquired: acquired,
    __pages: prev.__pages, // préserve les sous-pages (édition de l'accueil)
  };
  return saveDraftSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID, content as unknown as Record<string, unknown>, "ai");
}

/**
 * Enregistre les sous-pages du site (préserve recette/charte/acquis), et
 * accumule les composants des sous-pages comme acquis à vie.
 */
export async function saveSitePages(
  admin: SupabaseClient,
  siteId: string,
  pages: FoundryPage[],
): Promise<void> {
  const existing = await loadEditableSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID);
  const prev = (existing?.content_json ?? {}) as Partial<FoundryContent>;
  if (!prev.__recipe) throw new Error("saveSitePages: pas de recette d'accueil");
  const acquired = Array.from(
    new Set([...(prev.__acquired ?? []), ...pages.flatMap((p) => p.sections.map((s) => s.component))]),
  );
  const content: FoundryContent = { ...(prev as FoundryContent), __pages: pages, __acquired: acquired };
  await saveDraftSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID, content as unknown as Record<string, unknown>, "ai");
}

/** Recette éditable (brouillon) d'un site foundry. */
export async function loadRecipeDraft(
  admin: SupabaseClient,
  siteId: string,
): Promise<{ recipe: Recipe; row: ContentRow } | null> {
  const row = await loadEditableSnapshot(admin, siteId, FOUNDRY_TEMPLATE_ID);
  const recipe = recipeFromSnapshot(row);
  return recipe && row ? { recipe, row } : null;
}

export interface SectionCard {
  component: string;
  role: string;
  roleLabel: string;
  rarity: "common" | "rare" | "epic";
}

/** Cartes (rôle + rareté) d'une recette — alimente l'ouverture de booster + l'éditeur. */
export function recipeCards(recipe: Recipe): SectionCard[] {
  return recipe.sections.flatMap((s) => {
    const m = getManifest(s.component);
    return m ? [{ component: m.id, role: m.role, roleLabel: roleLabel(m.role), rarity: m.rarity }] : [];
  });
}

/** Lien de navbar : libellé + cible ("home", slug de page, ou URL). */
export interface NavLink {
  label: string;
  target?: string;
}

/** Normalise un lien de navbar (string héritée OU objet) en {label,target}. */
export function normalizeNavLink(l: unknown): NavLink {
  if (typeof l === "string") return { label: l };
  if (l && typeof l === "object") {
    const o = l as Record<string, unknown>;
    return { label: typeof o.label === "string" ? o.label : "", target: typeof o.target === "string" ? o.target : undefined };
  }
  return { label: "" };
}

/** Navbar par défaut d'un site multi-pages (sobre, pilotée par la charte). */
export const DEFAULT_NAVBAR_ID = "plumber-emergency-navbar";

/**
 * Garantit une navbar en tête de l'accueil : sans elle, les liens de pages
 * n'ont nulle part où vivre (la plupart des recettes générées n'en ont pas).
 * Renvoie la recette telle quelle si une navbar existe déjà.
 */
export function ensureNavbar(recipe: Recipe, businessName: string): { recipe: Recipe; added: boolean } {
  const has = recipe.sections.some((s) => getManifest(s.component)?.role === "navbar");
  if (has) return { recipe, added: false };
  const content = normalizeSectionContent(DEFAULT_NAVBAR_ID, {
    brand: businessName.trim().slice(0, 60) || undefined,
    links: [{ label: "Accueil", target: "home" }],
    cta: "Nous contacter",
  });
  return {
    recipe: { ...recipe, sections: [{ component: DEFAULT_NAVBAR_ID, content }, ...recipe.sections] },
    added: true,
  };
}

/** Ajoute un lien vers une page dans la navbar de l'accueil (si présente, sans doublon de cible). */
export function addNavLink(recipe: Recipe, label: string, target: string): Recipe {
  const sections = recipe.sections.map((s) => {
    if (getManifest(s.component)?.role !== "navbar") return s;
    const links = (Array.isArray(s.content.links) ? s.content.links : []).map(normalizeNavLink);
    if (links.some((l) => l.target === target)) return s;
    return { ...s, content: { ...s.content, links: [...links, { label, target }] } };
  });
  return { ...recipe, sections };
}

/** Renomme un lien de navbar EN PLACE (renommage de page : position conservée). */
export function renameNavLink(recipe: Recipe, oldTarget: string, label: string, newTarget: string): Recipe {
  const sections = recipe.sections.map((s) => {
    if (getManifest(s.component)?.role !== "navbar") return s;
    const links = (Array.isArray(s.content.links) ? s.content.links : [])
      .map(normalizeNavLink)
      .map((l) => (l.target === oldTarget ? { label, target: newTarget } : l));
    return { ...s, content: { ...s.content, links } };
  });
  return { ...recipe, sections };
}

/** Retire les liens (navbar ET footer) pointant vers une cible (suppression de page). */
export function removeNavLinks(recipe: Recipe, target: string): Recipe {
  const sections = recipe.sections.map((s) => {
    const role = getManifest(s.component)?.role;
    if (role === "navbar") {
      const links = (Array.isArray(s.content.links) ? s.content.links : [])
        .map(normalizeNavLink)
        .filter((l) => l.target !== target);
      return { ...s, content: { ...s.content, links } };
    }
    if (role === "footer") {
      const columns = (Array.isArray(s.content.columns) ? s.content.columns : []).map((col) => {
        if (!col || typeof col !== "object") return col;
        const c = col as Record<string, unknown>;
        const links = (Array.isArray(c.links) ? c.links : []).filter((l) => normalizeNavLink(l).target !== target);
        return { ...c, links };
      });
      return { ...s, content: { ...s.content, columns } };
    }
    return s;
  });
  return { ...recipe, sections };
}

/** Résout la cible d'un lien en URL publique pour un site donné. */
export function resolveNavHref(target: string | undefined, siteSlug: string): string {
  if (!target || target === "home" || target === "/") return `/a/${siteSlug}`;
  if (/^https?:\/\//.test(target)) return target;
  return `/a/${siteSlug}/${target}`;
}

/**
 * Résout la cible d'un bouton CTA (heros) en href. Diffère de resolveNavHref :
 * une cible vide ou une ancre (#contact) reste telle quelle (section de la page
 * courante) ; "home"/page → URL du site ; http(s) → lien externe.
 */
export function resolveCtaHref(target: string | undefined, siteSlug: string): string {
  const t = (target ?? "").trim();
  if (!t || t.startsWith("#")) return t || "#contact";
  if (/^https?:\/\//.test(t)) return t;
  if (t === "home" || t === "/") return `/a/${siteSlug}`;
  return `/a/${siteSlug}/${t}`;
}

/**
 * Injecte des `href` résolus dans les liens de la navbar ET du footer (rendu
 * public) — la navigation entre pages fonctionne depuis l'en-tête et le pied.
 * Footer : un lien SANS cible reste une chaîne (texte brut, ex. une adresse) ;
 * un lien AVEC cible devient {label, href}.
 */
export function withResolvedNav(recipe: Recipe, siteSlug: string): Recipe {
  const sections = recipe.sections.map((s) => {
    const role = getManifest(s.component)?.role;
    if (role === "navbar") {
      // Lien AVEC cible (page/externe) → href résolu. Lien SANS cible (mono-page,
      // libellé brut de Mistral) → laissé tel quel : l'Assembler le remplacera par
      // une ancre dérivée des sections (#galerie, #contact…).
      const links = (Array.isArray(s.content.links) ? s.content.links : [])
        .map(normalizeNavLink)
        .filter((l) => l.label)
        .map((l) => (l.target ? { label: l.label, href: resolveNavHref(l.target, siteSlug) } : { label: l.label }));
      return { ...s, content: { ...s.content, links } };
    }
    if (role === "footer") {
      const out: Record<string, unknown> = { ...s.content };
      if (Array.isArray(s.content.columns)) {
        out.columns = s.content.columns.map((col) => {
          if (!col || typeof col !== "object") return col;
          const c = col as Record<string, unknown>;
          const links = (Array.isArray(c.links) ? c.links : [])
            .map(normalizeNavLink)
            .filter((l) => l.label)
            .map((l) => (l.target ? { label: l.label, href: resolveNavHref(l.target, siteSlug) } : l.label));
          return { ...c, links };
        });
      }
      // Footers à rangée de liens plate (footer-giant-brand, footer-cinematic).
      if (Array.isArray(s.content.links)) {
        out.links = s.content.links
          .map(normalizeNavLink)
          .filter((l) => l.label)
          .map((l) => (l.target ? { label: l.label, href: resolveNavHref(l.target, siteSlug) } : l.label));
      }
      return { ...s, content: out };
    }
    // Bouton CTA configurable (heros & sections) : cible → href public.
    if (typeof s.content.ctaHref === "string") {
      return { ...s, content: { ...s.content, ctaHref: resolveCtaHref(s.content.ctaHref, siteSlug) } };
    }
    return s;
  });
  return { ...recipe, sections };
}
