// lib/foundry/inject.ts
// Fusion déterministe des liens & photos collectés dans une recette.
// Pure : ne crée/supprime jamais de section, ne mute pas l'entrée.
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

/** Injecte liens & photos dans les clés de contenu existantes. */
export function injectContacts(input: Recipe, collected: Collected): Recipe {
  const recipe = clone(input);

  // 1. Socials → tous les footers.
  if (collected.socials.length > 0) {
    for (const s of recipe.sections) {
      if (roleOf(s) === "footer") s.content.socials = collected.socials;
    }
  }

  // 2. Contact (phone/email/address) → sections role "contact" + navbar topbarPhone.
  const { phone, email, address } = collected.contact;
  for (const s of recipe.sections) {
    const role = roleOf(s);
    if (role === "contact") {
      if (phone && "phone" in s.content) s.content.phone = phone;
      if (email && "email" in s.content) s.content.email = email;
      if (address && "address" in s.content) s.content.address = address;
    }
    if (role === "navbar" && phone && "topbarPhone" in s.content) s.content.topbarPhone = phone;
  }

  // 3. Réservation → ctaHref du hero et de la section cta.
  if (collected.booking?.href) {
    for (const s of recipe.sections) {
      const role = roleOf(s);
      if ((role === "hero" || role === "cta") && "ctaHref" in s.content) {
        s.content.ctaHref = collected.booking.href;
      }
    }
  }

  // 4. Photos → remplissent les slots image, par priorité de rôle, dans l'ordre.
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
