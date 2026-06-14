// lib/foundry/link-catalog.ts
// Registre des plateformes de liens + normalisation + construction d'href.
// Pur, testé, sans réseau. Partagé par CollectStep, SocialIcon et l'injection.

import type { TradeId } from "./da-personas";

export type LinkKind = "social" | "contact" | "booking" | "link";

export type Collected = {
  socials: Array<{ platform: string; href: string; label?: string }>;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string; mapsUrl?: string };
  booking?: { label: string; href: string };
  photos: string[];
  /** Logo de marque (URL staging) — adopté puis posé dans recipe.brand.logo. */
  brandLogo?: string;
  /** Fiche technique (musiciens) : PDF envoyé au collect, branché sur le CTA du site. */
  techRider?: { href: string; name?: string };
  /**
   * Avis clients importés (fichier ou texte → structurés par Mistral). Injectés
   * dans la section avis du site ; vide/absent → la section reste en exemple.
   */
  reviews?: ReviewItem[];
  /**
   * L'utilisateur a-t-il des avis clients ?
   *  - true  : en a / en aura → on garde une section avis.
   *  - false : n'en a pas → AUCUNE section avis générée.
   *  - undefined : non renseigné (comportement par défaut).
   */
  hasReviews?: boolean;
};

/** Un avis client (forme commune import + injection). */
export type ReviewItem = {
  text: string;
  name: string;
  role?: string;
  rating?: number;
};

export interface PlatformDef {
  label: string;
  kind: LinkKind;
  /** Base URL pour transformer un pseudo en URL complète (réseaux). */
  base?: string;
  placeholder: string;
}

export const PLATFORMS: Record<string, PlatformDef> = {
  instagram:    { label: "Instagram",           kind: "social",   base: "https://instagram.com/",  placeholder: "votre pseudo ou lien" },
  facebook:     { label: "Facebook",            kind: "social",   base: "https://facebook.com/",   placeholder: "votre page" },
  x:            { label: "X (Twitter)",         kind: "social",   base: "https://x.com/",          placeholder: "votre pseudo" },
  linkedin:     { label: "LinkedIn",            kind: "social",   base: "https://linkedin.com/in/",placeholder: "votre profil" },
  youtube:      { label: "YouTube",             kind: "social",   base: "https://youtube.com/@",   placeholder: "votre chaîne" },
  tiktok:       { label: "TikTok",              kind: "social",   base: "https://tiktok.com/@",    placeholder: "votre pseudo" },
  spotify:      { label: "Spotify",             kind: "social",                                    placeholder: "lien de votre profil" },
  "apple-music":{ label: "Apple Music",         kind: "social",                                    placeholder: "lien de votre profil" },
  deezer:       { label: "Deezer",              kind: "social",                                    placeholder: "lien de votre profil" },
  soundcloud:   { label: "SoundCloud",          kind: "social",   base: "https://soundcloud.com/", placeholder: "votre pseudo" },
  bandcamp:     { label: "Bandcamp",            kind: "social",                                    placeholder: "lien de votre page" },
  pinterest:    { label: "Pinterest",           kind: "social",   base: "https://pinterest.com/",  placeholder: "votre profil" },
  behance:      { label: "Behance",             kind: "social",   base: "https://behance.net/",    placeholder: "votre profil" },
  whatsapp:     { label: "WhatsApp",            kind: "contact",                                   placeholder: "votre numéro" },
  phone:        { label: "Téléphone",           kind: "contact",                                   placeholder: "votre numéro" },
  email:        { label: "E-mail",              kind: "contact",                                   placeholder: "votre adresse e-mail" },
  maps:         { label: "Google Maps",         kind: "contact",                                   placeholder: "lien de votre fiche" },
  booking:      { label: "Prise de rendez-vous",kind: "booking",                                   placeholder: "lien Calendly, Planity…" },
  ticketing:    { label: "Billetterie",         kind: "booking",                                   placeholder: "lien de la billetterie" },
  menu:         { label: "Menu",                kind: "link",                                      placeholder: "lien ou PDF du menu" },
  website:      { label: "Site web",            kind: "link",     base: "https://",                placeholder: "votre site" },
  link:         { label: "Autre lien",          kind: "link",                                      placeholder: "nom + URL" },
};

const ALIASES: Array<[RegExp, string]> = [
  [/insta/i,                                        "instagram"],
  [/facebook/i,                                      "facebook"],
  [/linked/i,                                       "linkedin"],
  [/(^x$)|twitter/i,                                "x"],
  [/youtube|^yt$/i,                                 "youtube"],
  [/tiktok/i,                                        "tiktok"],
  [/spotify/i,                                      "spotify"],
  [/apple.?music/i,                                  "apple-music"],
  [/deezer/i,                                       "deezer"],
  [/soundcloud/i,                                   "soundcloud"],
  [/bandcamp/i,                                     "bandcamp"],
  [/pinterest/i,                                    "pinterest"],
  [/behance/i,                                      "behance"],
  [/whats?app/i,                                    "whatsapp"],
  [/t[ée]l[ée]phone|phone|appel/i,                  "phone"],
  [/mail|email|courriel/i,                          "email"],
  [/rendez|rdv|calendly|planity|treatwell|r[ée]serv/i, "booking"],
  [/(^maps$|google.?maps)|itin[ée]raire/i,          "maps"],
  [/billet|ticket/i,                                "ticketing"],
  [/menu|carte/i,                                   "menu"],
  [/site|web/i,                                     "website"],
];

/** Normalise une saisie libre vers une clé de PLATFORMS (sinon "link"). */
export function normPlatform(input: string): string {
  const p = input.trim().toLowerCase();
  if (PLATFORMS[p]) return p;
  for (const [re, key] of ALIASES) if (re.test(p)) return key;
  return "link";
}

/** Numéro FR → format e.164 simplifié (chiffres, 0 initial → 33). */
function frPhone(raw: string): string {
  const cleaned = raw.replace(/\(0\)/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.startsWith("33")) return `+${digits}`;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return `+${digits}`;
}

/** Construit l'href final pour une plateforme + saisie utilisateur. */
export function toHref(platformKey: string, raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const key = PLATFORMS[platformKey] ? platformKey : normPlatform(platformKey);
  if (key === "phone") return `tel:${frPhone(v)}`;
  if (key === "whatsapp") return `https://wa.me/${frPhone(v).replace("+", "")}`;
  if (key === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  const def = PLATFORMS[key];
  if (def?.base) return `${def.base}${v.replace(/^@/, "")}`;
  return `https://${v}`;
}

export interface LinkField {
  platform: string;
  label: string;
  kind: LinkKind;
  placeholder: string;
}

const BY_TRADE: Record<TradeId, string[]> = {
  musicien:    ["spotify", "apple-music", "youtube", "instagram", "tiktok", "soundcloud", "deezer", "ticketing"],
  photographe: ["instagram", "pinterest", "behance", "booking", "email", "phone"],
  coach:       ["booking", "instagram", "linkedin", "whatsapp", "youtube", "email", "phone"],
  "bien-etre": ["booking", "instagram", "linkedin", "whatsapp", "youtube", "email", "phone"],
  artisan:     ["phone", "whatsapp", "email", "maps", "facebook", "instagram"],
  restaurant:  ["booking", "menu", "instagram", "maps", "phone"],
  beaute:      ["booking", "instagram", "phone", "maps"],
  conseil:     ["linkedin", "booking", "email", "website", "phone"],
  fitness:     ["instagram", "booking", "youtube", "whatsapp", "phone"],
  autre:       ["instagram", "facebook", "linkedin", "email", "phone", "website"],
};

/** Champs de liens affichés par défaut pour un métier. */
export function linkFieldsForTrade(trade: TradeId): LinkField[] {
  const keys = BY_TRADE[trade] ?? BY_TRADE.autre;
  return keys.map((platform) => {
    const def = PLATFORMS[platform];
    if (!def) throw new Error(`[link-catalog] plateforme inconnue dans BY_TRADE: ${platform}`);
    return { platform, label: def.label, kind: def.kind, placeholder: def.placeholder };
  });
}
