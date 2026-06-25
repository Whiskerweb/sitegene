// lib/foundry/section-nav.ts
// Navigation MONO-PAGE : sur un site assemblé d'une seule page, les liens de la
// navbar doivent défiler vers les sections de la page (ancres #id), pas pointer
// vers des sous-pages. Mistral écrit des libellés inventés (« Concerts »,
// « Galerie »…) sans cible → tous les liens tombaient sur « # ». Ici on DÉRIVE
// les liens des sections réellement présentes (rôle/composant → {ancre, libellé})
// et on garantit que chaque section porte cette ancre (posée par l'Assembler).
// Pur (client-safe).
import type { Recipe } from "./types";
import { getManifest } from "./manifests";

type Anchor = { id: string; label: string; nav: boolean };

// Ancre par COMPOSANT (prime sur le rôle) — libellés métier fins (musicien :
// release-grid = « Musique », tour-dates = « Concerts »), pour distinguer deux
// sections de même rôle (release-grid et une galerie sont tous deux « gallery »).
const COMPONENT_ANCHOR: Record<string, Anchor> = {
  "release-grid": { id: "musique", label: "Musique", nav: true },
  "tour-dates": { id: "concerts", label: "Concerts", nav: true },
};

// Ancre par RÔLE (repli). `nav:false` = section ancrable mais PAS un lien du menu
// (la CTA est le bouton « pilule » de la navbar, pas un lien central).
const ROLE_ANCHOR: Record<string, Anchor> = {
  about: { id: "apropos", label: "À propos", nav: true },
  statement: { id: "apropos", label: "À propos", nav: true },
  services: { id: "services", label: "Services", nav: true },
  highlights: { id: "actualites", label: "Actualités", nav: true },
  gallery: { id: "galerie", label: "Galerie", nav: true },
  media: { id: "galerie", label: "Galerie", nav: true },
  reviews: { id: "avis", label: "Avis", nav: true },
  pricing: { id: "tarifs", label: "Tarifs", nav: true },
  faq: { id: "faq", label: "Questions", nav: true },
  contact: { id: "contact", label: "Contact", nav: true },
  team: { id: "equipe", label: "Équipe", nav: true },
  stats: { id: "chiffres", label: "Chiffres", nav: true },
  process: { id: "methode", label: "Méthode", nav: true },
  story: { id: "histoire", label: "Histoire", nav: true },
  cta: { id: "reserver", label: "", nav: false },
};

function anchorOf(component: string): Anchor | null {
  if (COMPONENT_ANCHOR[component]) return COMPONENT_ANCHOR[component];
  const role = getManifest(component)?.role;
  return role ? ROLE_ANCHOR[role] ?? null : null;
}

/** Id d'ancre à poser sur la section (null = navbar/hero/footer/decor… non ancrés). */
export function sectionAnchorId(component: string): string | null {
  return anchorOf(component)?.id ?? null;
}

/**
 * Liens de menu dérivés des sections présentes, dans l'ordre du document, sans
 * doublon d'ancre, plafonnés. Renvoie des {label, href:"#id"} prêts à rendre.
 */
export function buildSectionNav(recipe: Recipe, max = 5): { label: string; href: string }[] {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const s of recipe.sections) {
    const a = anchorOf(s.component);
    if (!a || !a.nav || !a.label || seen.has(a.id)) continue;
    seen.add(a.id);
    out.push({ label: a.label, href: `#${a.id}` });
    if (out.length >= max) break;
  }
  return out;
}

/** Cible de la pilule CTA de la navbar (réservation/contact) → ancre, si présente. */
export function navbarCtaHref(recipe: Recipe): string | null {
  const ids = new Set(recipe.sections.map((s) => sectionAnchorId(s.component)).filter(Boolean));
  if (ids.has("reserver")) return "#reserver";
  if (ids.has("contact")) return "#contact";
  return null;
}
