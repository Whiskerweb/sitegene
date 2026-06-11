// lib/foundry/collect-import.ts
// Import « magique » de l'étape collect (/creer) : l'utilisateur colle UNE URL
// (son site, son Instagram, sa page Facebook…) et on en déduit le maximum.
// Pur, testé, sans réseau : la classification d'URL et la fusion des données
// scrapées vers `Collected` (le fetch vit dans /api/foundry/scrape).
import type { ScrapedSite } from "@/lib/scrape-site";
import type { Collected } from "./link-catalog";

/** Hôte → clé de PLATFORMS (link-catalog). */
const HOST_PLATFORM: Array<[RegExp, string]> = [
  [/(^|\.)instagram\.com$/i, "instagram"],
  [/(^|\.)facebook\.com$/i, "facebook"],
  [/(^|\.)(x|twitter)\.com$/i, "x"],
  [/(^|\.)linkedin\.com$/i, "linkedin"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "youtube"],
  [/(^|\.)tiktok\.com$/i, "tiktok"],
  [/(^|\.)pinterest\.(com|fr)$/i, "pinterest"],
  [/(^|\.)behance\.net$/i, "behance"],
  [/^music\.apple\.com$/i, "apple-music"],
  [/(^|\.)spotify\.com$/i, "spotify"],
  [/(^|\.)deezer\.com$/i, "deezer"],
  [/(^|\.)soundcloud\.com$/i, "soundcloud"],
  [/(^|\.)bandcamp\.com$/i, "bandcamp"],
  [/(^|\.)(calendly\.com|planity\.com|treatwell\.fr|cal\.com)$/i, "booking"],
];

/** Plateforme (clé PLATFORMS) d'une URL, ou null si site générique. */
export function platformFromUrl(href: string): string | null {
  try {
    const host = new URL(href.startsWith("http") ? href : `https://${href}`).hostname;
    for (const [re, key] of HOST_PLATFORM) if (re.test(host)) return key;
    return null;
  } catch {
    return null;
  }
}

export type ImportTarget =
  | { kind: "social"; platform: string; href: string }
  | { kind: "website"; url: string };

/**
 * Classe l'URL collée : un profil social/musique se range directement dans le
 * bon champ (pas de scrape — Instagram & co bloquent les robots) ; tout le
 * reste est un site à scraper.
 */
export function classifyImportUrl(raw: string): ImportTarget | null {
  const v = raw.trim();
  if (v.length < 4) return null;
  const href = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
  try {
    const u = new URL(href);
    if (!u.hostname.includes(".")) return null;
    const platform = platformFromUrl(href);
    if (platform) return { kind: "social", platform, href };
    return { kind: "website", url: href };
  } catch {
    return null;
  }
}

/** Ajoute un lien social sans écraser une saisie existante de la même plateforme. */
function addSocial(c: Collected, platform: string, href: string, label?: string): void {
  if (c.socials.some((s) => s.platform === platform)) return;
  c.socials.push({ platform, href, ...(label ? { label } : {}) });
}

export type ImportSummary = { links: number; contacts: number };

/**
 * Fusionne un résultat de scrape dans `Collected`. Ne remplace JAMAIS une
 * valeur déjà saisie par le client (le scrape complète, il n'écrase pas).
 * Retourne le Collected fusionné + le compte de ce qui a été ajouté.
 */
export function mergeScrapedIntoCollected(
  current: Collected,
  scraped: ScrapedSite,
  sourceUrl: string,
): { collected: Collected; summary: ImportSummary } {
  const next: Collected = {
    socials: [...current.socials],
    contact: { ...current.contact },
    booking: current.booking,
    photos: [...current.photos],
  };
  const before = next.socials.length;
  let contacts = 0;

  for (const href of [...scraped.socialLinks, ...scraped.musicLinks]) {
    const platform = platformFromUrl(href);
    if (platform === "booking") {
      if (!next.booking) {
        next.booking = { label: "Réserver", href };
        contacts++;
      }
    } else if (platform) {
      addSocial(next, platform, href);
    }
  }
  if (scraped.instagram && !next.socials.some((s) => s.platform === "instagram")) {
    addSocial(next, "instagram", `https://instagram.com/${scraped.instagram.replace(/^@/, "")}`);
  }
  if (scraped.email && !next.contact.email) {
    next.contact.email = `mailto:${scraped.email}`;
    contacts++;
  }
  if (scraped.phone && !next.contact.phone) {
    next.contact.phone = `tel:${scraped.phone.replace(/[^\d+]/g, "")}`;
    contacts++;
  }
  // Le site scrapé lui-même devient le lien « site web » (utile en footer).
  if (!next.socials.some((s) => s.platform === "website")) {
    addSocial(next, "website", sourceUrl, "Site web");
  }

  return { collected: next, summary: { links: next.socials.length - before, contacts } };
}
