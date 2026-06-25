// lib/foundry/auto-gallery.ts
// Galerie photo automatique : quand le client fournit beaucoup de photos
// (tunnel /creer), on garantit une vraie section galerie vers le bas du site.
// Sans ça, les photos au-delà des quelques slots image existants (hero, about…)
// seraient perdues. Pure : ne mute pas l'entrée. Idempotent.
import type { Recipe, RecipeSection } from "./types";
import { getManifest } from "./manifests";

// À partir de ce nombre de photos fournies on ajoute la galerie (« plus de
// 5-6 photos », demande produit) ; cappée pour rester digeste.
const GALLERY_THRESHOLD = 6;
const GALLERY_MAX = 12;

function roleOf(s: RecipeSection): string {
  return getManifest(s.component)?.role ?? "";
}

/**
 * Ajoute une galerie mosaïque (gallery-mosaic) juste avant le footer quand le
 * client a fourni assez de photos ET qu'aucune section galerie n'existe encore
 * (sinon les photos y sont déjà injectées par injectContacts). Valable tous
 * métiers (musicien, photographe, artisan…). Idempotent.
 */
export function ensurePhotoGallery(input: Recipe, photos: string[]): Recipe {
  const imgs = (photos ?? []).filter(Boolean); // appelant déjà filtré ; défensif
  if (imgs.length < GALLERY_THRESHOLD) return input;
  // Déjà une galerie : injectContacts l'a remplie, on n'en ajoute pas une 2e.
  if (input.sections.some((s) => roleOf(s) === "gallery")) return input;

  const gallery: RecipeSection = {
    component: "gallery-mosaic",
    content: {
      eyebrow: "Galerie",
      title: "En images",
      images: imgs.slice(0, GALLERY_MAX),
    },
  };

  const sections = [...input.sections];
  const footerIdx = sections.findIndex((s) => roleOf(s) === "footer");
  sections.splice(footerIdx >= 0 ? footerIdx : sections.length, 0, gallery);
  return { ...input, sections };
}
