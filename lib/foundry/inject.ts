// lib/foundry/inject.ts
// Fusion déterministe des liens & photos collectés dans une recette.
// Pure : ne crée/supprime jamais de section, ne mute pas l'entrée.
// Règle d'or (demande produit) : le site ne montre QUE ce que le client a
// fourni — les socials sont toujours écrasés (même vides, pour purger les
// exemples), les coordonnées absentes sont vidées (jamais de faux e-mail).
import type { Recipe, RecipeSection } from "./types";
import type { Collected } from "./link-catalog";
import { getManifest } from "./manifests";

const IMAGE_LIST_KEYS = ["images", "gallery", "photos"];
const IMAGE_SCALAR_KEYS = ["image", "image2", "cover", "visual"];
const ROLE_IMG_PRIORITY = ["gallery", "media", "hero", "about", "services"];

function roleOf(section: RecipeSection): string {
  return getManifest(section.component)?.role ?? "";
}

function clone(recipe: Recipe): Recipe {
  return JSON.parse(JSON.stringify(recipe)) as Recipe;
}

function rank(section: RecipeSection): number {
  const i = ROLE_IMG_PRIORITY.indexOf(roleOf(section));
  return i === -1 ? Number.POSITIVE_INFINITY : i;
}

/** "mailto:a@b.fr" → "a@b.fr" (forme affichable ; les composants relinkifient). */
export function emailDisplay(v?: string): string {
  return v ? v.replace(/^mailto:/i, "").trim() : "";
}

/** "tel:+33612345678" → "06 12 34 56 78" (lisible ; +33 conservé sinon). */
export function phoneDisplay(v?: string): string {
  if (!v) return "";
  const raw = v.replace(/^tel:/i, "").trim();
  const m = raw.match(/^\+33(\d{9})$/);
  if (m) return `0${m[1]}`.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return raw;
}

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^\+?[\d][\d ().\-]{7,}$/;

/** Injecte liens & photos dans les clés de contenu existantes. */
export function injectContacts(input: Recipe, collected: Collected): Recipe {
  const recipe = clone(input);
  const { phone, email, address } = collected.contact;
  const emailText = emailDisplay(email);
  const phoneText = phoneDisplay(phone);

  for (const s of recipe.sections) {
    const role = roleOf(s);

    // 1. Socials → footers, TOUJOURS écrasés : uniquement les liens fournis
    //    (une liste vide purge les exemples Instagram/Facebook du sample).
    if (role === "footer") {
      s.content.socials = collected.socials;
      // Colonnes du footer : remplace (ou retire) les coordonnées d'exemple.
      if (Array.isArray(s.content.columns)) {
        s.content.columns = (s.content.columns as unknown[]).map((col) => {
          if (typeof col !== "object" || col === null || !Array.isArray((col as { links?: unknown }).links)) return col;
          const c = col as { links: unknown[] };
          const links = c.links
            .map((l) => {
              if (typeof l !== "string") return l;
              const v = l.trim();
              if (EMAIL_LIKE.test(v)) return emailText || null;
              if (PHONE_LIKE.test(v)) return phoneText || null;
              return l;
            })
            .filter((l) => l !== null);
          return { ...c, links };
        });
      }
    }

    // 2. Coordonnées → sections "contact" : valeurs fournies, AFFICHABLES ;
    //    les absentes sont vidées (le composant masque les lignes vides).
    if (role === "contact") {
      if ("email" in s.content) s.content.email = emailText;
      if ("phone" in s.content) s.content.phone = phoneText;
      if ("address" in s.content) s.content.address = address ?? "";
      if (collected.booking?.href && "ctaHref" in s.content) s.content.ctaHref = collected.booking.href;
    }

    // 3. Navbar : téléphone de la barre haute (vidé si non fourni).
    if (role === "navbar" && "topbarPhone" in s.content) s.content.topbarPhone = phoneText;

    // 4. Réservation → ctaHref du hero et des sections cta.
    if (collected.booking?.href && (role === "hero" || role === "cta") && "ctaHref" in s.content) {
      s.content.ctaHref = collected.booking.href;
    }
  }

  // 5. Fiche technique (musiciens) : la section CTA devient le téléchargement
  //    de la fiche — prime sur la réservation pour CE rôle uniquement.
  if (collected.techRider?.href) {
    for (const s of recipe.sections) {
      if (roleOf(s) !== "cta") continue;
      if ("title" in s.content) s.content.title = "Vous nous voulez sur votre scène ? Tout est prêt.";
      if ("cta" in s.content) s.content.cta = "Télécharger la fiche technique";
      if ("ctaHref" in s.content) s.content.ctaHref = collected.techRider.href;
    }
  }

  // 6. Photos → remplissent les slots image, par priorité de rôle, dans l'ordre.
  if (collected.photos.length > 0) {
    const queue = [...collected.photos];
    const sorted = [...recipe.sections].sort((a, b) => rank(a) - rank(b));
    for (const s of sorted) {
      if (queue.length === 0) break;
      for (const k of IMAGE_LIST_KEYS) {
        const v = s.content[k];
        if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
          s.content[k] = (v as string[]).map((orig) => queue.shift() ?? orig);
        }
      }
      for (const k of IMAGE_SCALAR_KEYS) {
        if (queue.length === 0) break;
        if (typeof s.content[k] === "string") s.content[k] = queue.shift();
      }
    }
  }

  return recipe;
}
