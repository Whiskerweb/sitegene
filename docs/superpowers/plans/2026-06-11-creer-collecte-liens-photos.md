# Collecte de liens & photos pendant l'assemblage (`/creer`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le temps mort de l'assemblage `/creer` par un écran de collecte (liens par métier + photos), puis injecter de façon déterministe ce que le client a fourni dans son site — sans bouton externe vide.

**Architecture:** Génération Mistral lancée en tâche de fond pendant que l'utilisateur remplit un écran de collecte (un seul écran scrollable). À la validation, un endpoint fusionne liens+photos dans la recette sauvegardée (`content_json.__recipe`) via une fonction pure, sans nouvel appel Mistral. Catalogue de liens indexé sur `detectTrade` existant. Upload photos via l'endpoint `POST /api/site/photo` existant, plafonné à 20.

**Tech Stack:** Next.js (version custom du repo — lire `node_modules/next/dist/docs/` avant tout code App Router), React client components, Supabase (Storage `site-photos` + table `site_content`), Vitest (glob `lib/**/*.test.ts`), Mistral (déjà câblé, non touché ici).

---

## Décisions tranchées (points ouverts de la spec)

- **Storage** : réutiliser le bucket `site-photos/{siteId}/` et l'endpoint `POST /api/site/photo` existants. Pas de nouveau bucket ni de nouvelle route d'upload.
- **Compression** : downscale léger côté navigateur (canvas) avant upload, pour rester sous les 8 Mo de l'endpoint. Pas de traitement serveur.
- **Transition** : on garde l'animation « booster » (phase `pack`) ; elle est jouée **après** la collecte, pendant le court appel d'injection, avant le `reveal`. Les `cards` sont déjà récupérées en tâche de fond.
- **Label du CTA** : on conserve le texte rédigé par Mistral. On ne modifie que `ctaHref`.

## File Structure

**Créés :**
- `lib/foundry/link-catalog.ts` — registre des plateformes (label, type, normalisation href, clé d'icône) + listes par métier + `normPlatform`. Pur, testé.
- `lib/foundry/link-catalog.test.ts`
- `lib/foundry/inject.ts` — `injectContacts(recipe, collected)` (pure). Mappe les données collectées sur les clés de contenu existantes.
- `lib/foundry/inject.test.ts`
- `app/api/foundry/links/route.ts` — endpoint de fusion (auth + ownership + `injectContacts` + re-save).
- `components/creer/CollectStep.tsx` — l'écran de collecte (client component) : champs de liens par métier, bouton « Ajouter un lien », upload photos.

**Modifiés :**
- `components/foundry/components/SocialIcon.tsx` — icônes manquantes + `norm()` délégué au catalogue.
- `app/api/site/photo/route.ts` — garde « 20 photos max » par site.
- `app/creer/CreerClient.tsx` — nouvelle phase `collect`, génération en tâche de fond, `finishCollect()`.

**Types partagés** (définis dans `link-catalog.ts`, importés partout) :

```ts
export type LinkKind = "social" | "contact" | "booking" | "link";

export type Collected = {
  socials: Array<{ platform: string; href: string; label?: string }>;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string; mapsUrl?: string };
  booking?: { label: string; href: string };
  photos: string[]; // URLs publiques Storage, max 20
};
```

---

## Task 1: Registre des plateformes (catalogue, cœur)

**Files:**
- Create: `lib/foundry/link-catalog.ts`
- Test: `lib/foundry/link-catalog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/foundry/link-catalog.test.ts
import { describe, it, expect } from "vitest";
import { PLATFORMS, normPlatform, toHref } from "./link-catalog";

describe("normPlatform", () => {
  it("normalise les variantes saisies vers une clé connue", () => {
    expect(normPlatform("Insta")).toBe("instagram");
    expect(normPlatform("X")).toBe("x");
    expect(normPlatform("Spotify ")).toBe("spotify");
    expect(normPlatform("WhatsApp")).toBe("whatsapp");
    expect(normPlatform("Apple Music")).toBe("apple-music");
    expect(normPlatform("Google Maps")).toBe("maps");
    expect(normPlatform("un truc inconnu")).toBe("link");
  });
});

describe("PLATFORMS", () => {
  it("chaque plateforme connue a un label, un kind et une clé d'icône", () => {
    for (const key of ["instagram", "spotify", "whatsapp", "maps", "apple-music", "linkedin"]) {
      expect(PLATFORMS[key]).toBeDefined();
      expect(PLATFORMS[key].label.length).toBeGreaterThan(0);
      expect(PLATFORMS[key].kind).toBeDefined();
    }
  });
});

describe("toHref", () => {
  it("construit un href selon le kind/clé", () => {
    expect(toHref("phone", "06 12 34 56 78")).toBe("tel:+33612345678");
    expect(toHref("whatsapp", "06 12 34 56 78")).toBe("https://wa.me/33612345678");
    expect(toHref("email", "a@b.fr")).toBe("mailto:a@b.fr");
    expect(toHref("instagram", "https://instagram.com/x")).toBe("https://instagram.com/x");
    expect(toHref("instagram", "monpseudo")).toBe("https://instagram.com/monpseudo");
    expect(toHref("link", "exemple.fr")).toBe("https://exemple.fr");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sitegene && npx vitest run lib/foundry/link-catalog.test.ts`
Expected: FAIL — `Cannot find module './link-catalog'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/foundry/link-catalog.ts
// Registre des plateformes de liens + normalisation + construction d'href.
// Pur, testé, sans réseau. Partagé par CollectStep, SocialIcon et l'injection.

export type LinkKind = "social" | "contact" | "booking" | "link";

export type Collected = {
  socials: Array<{ platform: string; href: string; label?: string }>;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string; mapsUrl?: string };
  booking?: { label: string; href: string };
  photos: string[];
};

export interface PlatformDef {
  label: string;
  kind: LinkKind;
  /** Base URL pour transformer un pseudo en URL complète (réseaux). */
  base?: string;
  placeholder: string;
}

export const PLATFORMS: Record<string, PlatformDef> = {
  instagram: { label: "Instagram", kind: "social", base: "https://instagram.com/", placeholder: "votre pseudo ou lien" },
  facebook: { label: "Facebook", kind: "social", base: "https://facebook.com/", placeholder: "votre page" },
  x: { label: "X (Twitter)", kind: "social", base: "https://x.com/", placeholder: "votre pseudo" },
  linkedin: { label: "LinkedIn", kind: "social", base: "https://linkedin.com/in/", placeholder: "votre profil" },
  youtube: { label: "YouTube", kind: "social", base: "https://youtube.com/@", placeholder: "votre chaîne" },
  tiktok: { label: "TikTok", kind: "social", base: "https://tiktok.com/@", placeholder: "votre pseudo" },
  spotify: { label: "Spotify", kind: "social", placeholder: "lien de votre profil" },
  "apple-music": { label: "Apple Music", kind: "social", placeholder: "lien de votre profil" },
  deezer: { label: "Deezer", kind: "social", placeholder: "lien de votre profil" },
  soundcloud: { label: "SoundCloud", kind: "social", base: "https://soundcloud.com/", placeholder: "votre pseudo" },
  bandcamp: { label: "Bandcamp", kind: "social", placeholder: "lien de votre page" },
  pinterest: { label: "Pinterest", kind: "social", base: "https://pinterest.com/", placeholder: "votre profil" },
  behance: { label: "Behance", kind: "social", base: "https://behance.net/", placeholder: "votre profil" },
  whatsapp: { label: "WhatsApp", kind: "contact", placeholder: "votre numéro" },
  phone: { label: "Téléphone", kind: "contact", placeholder: "votre numéro" },
  email: { label: "E-mail", kind: "contact", placeholder: "votre adresse e-mail" },
  maps: { label: "Google Maps", kind: "contact", placeholder: "lien de votre fiche" },
  booking: { label: "Prise de rendez-vous", kind: "booking", placeholder: "lien Calendly, Planity…" },
  ticketing: { label: "Billetterie", kind: "booking", placeholder: "lien de la billetterie" },
  menu: { label: "Menu", kind: "link", placeholder: "lien ou PDF du menu" },
  website: { label: "Site web", kind: "link", base: "https://", placeholder: "votre site" },
  link: { label: "Autre lien", kind: "link", placeholder: "nom + URL" },
};

const ALIASES: Array<[RegExp, string]> = [
  [/insta/i, "instagram"],
  [/face/i, "facebook"],
  [/linked/i, "linkedin"],
  [/(^x$)|twitter/i, "x"],
  [/youtube|^yt$/i, "youtube"],
  [/tiktok|tik/i, "tiktok"],
  [/spotify/i, "spotify"],
  [/apple/i, "apple-music"],
  [/deezer/i, "deezer"],
  [/soundcloud/i, "soundcloud"],
  [/bandcamp/i, "bandcamp"],
  [/pinterest/i, "pinterest"],
  [/behance/i, "behance"],
  [/whats?app/i, "whatsapp"],
  [/t[ée]l[ée]phone|phone|appel/i, "phone"],
  [/mail|email|courriel/i, "email"],
  [/maps|plan|itin[ée]raire/i, "maps"],
  [/rendez|rdv|calendly|planity|treatwell|r[ée]serv/i, "booking"],
  [/billet|ticket/i, "ticketing"],
  [/menu|carte/i, "menu"],
  [/site|web/i, "website"],
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
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("33")) return `+${digits}`;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return `+${digits}`;
}

/** Construit l'href final pour une plateforme + saisie utilisateur. */
export function toHref(platformKey: string, raw: string): string {
  const v = raw.trim();
  const key = PLATFORMS[platformKey] ? platformKey : normPlatform(platformKey);
  if (key === "phone") return `tel:${frPhone(v)}`;
  if (key === "whatsapp") return `https://wa.me/${frPhone(v).replace("+", "")}`;
  if (key === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  const def = PLATFORMS[key];
  if (def?.base) return `${def.base}${v.replace(/^@/, "")}`;
  return `https://${v}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sitegene && npx vitest run lib/foundry/link-catalog.test.ts`
Expected: PASS (3 describe blocks green).

- [ ] **Step 5: Commit**

```bash
cd sitegene
git add lib/foundry/link-catalog.ts lib/foundry/link-catalog.test.ts
git commit -m "feat(foundry): registre des plateformes de liens (catalogue + href)"
```

---

## Task 2: Listes de liens par métier

**Files:**
- Modify: `lib/foundry/link-catalog.ts`
- Test: `lib/foundry/link-catalog.test.ts`

- [ ] **Step 1: Write the failing test** (ajouter au fichier de test existant)

```ts
import { linkFieldsForTrade } from "./link-catalog";
import type { TradeId } from "./da-personas";

describe("linkFieldsForTrade", () => {
  it("musicien → met en avant le streaming", () => {
    const keys = linkFieldsForTrade("musicien").map((f) => f.platform);
    expect(keys).toContain("spotify");
    expect(keys).toContain("instagram");
    expect(keys).toContain("youtube");
  });
  it("artisan → met en avant téléphone et devis", () => {
    const keys = linkFieldsForTrade("artisan").map((f) => f.platform);
    expect(keys).toContain("phone");
    expect(keys).toContain("whatsapp");
  });
  it("métier inconnu → liste générique non vide", () => {
    const keys = linkFieldsForTrade("autre" as TradeId).map((f) => f.platform);
    expect(keys).toContain("instagram");
    expect(keys.length).toBeGreaterThan(0);
  });
  it("chaque champ référence une plateforme connue", () => {
    const all: TradeId[] = ["musicien", "photographe", "coach", "bien-etre", "artisan", "restaurant", "beaute", "conseil", "fitness", "autre"];
    for (const t of all) {
      for (const f of linkFieldsForTrade(t)) {
        expect(PLATFORMS[f.platform], `${t}/${f.platform}`).toBeDefined();
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sitegene && npx vitest run lib/foundry/link-catalog.test.ts`
Expected: FAIL — `linkFieldsForTrade` n'est pas exporté.

- [ ] **Step 3: Write minimal implementation** (ajouter à `link-catalog.ts`)

```ts
import type { TradeId } from "./da-personas";

export interface LinkField {
  platform: string;       // clé PLATFORMS
  label: string;          // libellé affiché (repris de PLATFORMS)
  kind: LinkKind;
  placeholder: string;
}

const BY_TRADE: Record<TradeId, string[]> = {
  musicien: ["spotify", "apple-music", "youtube", "instagram", "tiktok", "soundcloud", "deezer", "ticketing"],
  photographe: ["instagram", "pinterest", "behance", "booking", "email", "phone"],
  coach: ["booking", "instagram", "linkedin", "whatsapp", "youtube", "email", "phone"],
  "bien-etre": ["booking", "instagram", "linkedin", "whatsapp", "youtube", "email", "phone"],
  artisan: ["phone", "whatsapp", "email", "maps", "facebook", "instagram"],
  restaurant: ["booking", "menu", "instagram", "maps", "phone"],
  beaute: ["booking", "instagram", "phone", "maps"],
  conseil: ["linkedin", "booking", "email", "website", "phone"],
  fitness: ["instagram", "booking", "youtube", "whatsapp", "phone"],
  autre: ["instagram", "facebook", "linkedin", "email", "phone", "website"],
};

/** Champs de liens affichés par défaut pour un métier. */
export function linkFieldsForTrade(trade: TradeId): LinkField[] {
  const keys = BY_TRADE[trade] ?? BY_TRADE.autre;
  return keys.map((platform) => {
    const def = PLATFORMS[platform];
    return { platform, label: def.label, kind: def.kind, placeholder: def.placeholder };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sitegene && npx vitest run lib/foundry/link-catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd sitegene
git add lib/foundry/link-catalog.ts lib/foundry/link-catalog.test.ts
git commit -m "feat(foundry): listes de liens par métier (link-catalog)"
```

---

## Task 3: Icônes manquantes dans SocialIcon

**Files:**
- Modify: `components/foundry/components/SocialIcon.tsx`

(Composant hors glob de test ; la normalisation est déjà testée dans Task 1 via `normPlatform`. On délègue `norm` au catalogue pour une seule source de vérité.)

- [ ] **Step 1: Remplacer `norm` local par le catalogue + ajouter les paths**

Remplacer le corps de `components/foundry/components/SocialIcon.tsx` :

```tsx
// components/foundry/components/SocialIcon.tsx
// Icônes de réseaux sociaux en SVG inline (currentColor → thémable par CSS vars).
// La normalisation des noms vit dans lib/foundry/link-catalog (source unique).
import type { ReactNode } from "react";
import { normPlatform } from "@/lib/foundry/link-catalog";

const PATHS: Record<string, ReactNode> = {
  linkedin: (<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>),
  x: <path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  instagram: (<><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></>),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  github: <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />,
  mail: (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
  youtube: (<><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>),
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />,
  spotify: (<><circle cx="12" cy="12" r="10" /><path d="M7 9.5c3-1 7-0.7 9.5 1" /><path d="M7.5 13c2.5-0.8 5.7-0.5 7.8 1" /><path d="M8 16c2-0.6 4.3-0.4 6 0.8" /></>),
  "apple-music": (<><path d="M9 18V5l11-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="15" r="3" /></>),
  deezer: (<><rect x="3" y="14" width="3" height="4" /><rect x="8" y="11" width="3" height="7" /><rect x="13" y="8" width="3" height="10" /><rect x="18" y="5" width="3" height="13" /></>),
  soundcloud: (<><path d="M2 14v3" /><path d="M5.5 12v5" /><path d="M9 10v7" /><path d="M12.5 9v8" /><path d="M16 8a4 4 0 0 1 0 9h-3.5" /></>),
  bandcamp: <path d="M4 16l4-8h12l-4 8z" fill="currentColor" stroke="none" />,
  pinterest: (<><circle cx="12" cy="12" r="10" /><path d="M9 21c-0.5-2 1-6 1.5-8a3 3 0 1 1 4 2c-1 1-3 1-3 1" /></>),
  behance: (<><path d="M2 7h5a2.5 2.5 0 0 1 0 5H2zM2 12h5.5a2.5 2.5 0 0 1 0 5H2z" /><path d="M15 8h6" /><path d="M14 14h8a4 4 0 0 0-8 0 4 4 0 0 0 7 2.5" /></>),
  whatsapp: (<><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1.1-5.3A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3 8.38 8.38 0 0 1 21 11.5z" /><path d="M8.5 9c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1-2z" fill="currentColor" stroke="none" /></>),
  maps: (<><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>),
  booking: (<><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  ticketing: (<><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M13 7v10" /></>),
  menu: (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>),
  website: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>),
  link: (<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
};

export default function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const key = normPlatform(platform);
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[key] ?? PATHS.link}
    </svg>
  );
}
```

Note : `normPlatform` renvoie `"email"` (pas `"mail"`) ; ajouter une entrée d'alias dans `PATHS` n'est pas nécessaire car on map ci-dessous. Pour couvrir `email` → icône `mail`, ajouter après la déclaration de `PATHS` :

```tsx
PATHS.email = PATHS.mail;
```

(placer cette ligne juste avant la fonction `SocialIcon`.)

- [ ] **Step 2: Vérifier la compilation des types**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur liée à `SocialIcon.tsx` / `link-catalog`.

- [ ] **Step 3: Commit**

```bash
cd sitegene
git add components/foundry/components/SocialIcon.tsx
git commit -m "feat(foundry): icônes Spotify/WhatsApp/Maps/Apple Music… + norm via catalogue"
```

---

## Task 4: Injection déterministe (`injectContacts`)

**Files:**
- Create: `lib/foundry/inject.ts`
- Test: `lib/foundry/inject.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/foundry/inject.test.ts
import { describe, it, expect } from "vitest";
import { injectContacts } from "./inject";
import type { Recipe } from "./types";
import type { Collected } from "./link-catalog";

function baseRecipe(): Recipe {
  return {
    vibe: "ocean-confiance",
    sections: [
      { component: "hero-split-asym", content: { title: "T", cta: "Me contacter", ctaHref: "#contact" } },
      { component: "contact-block", content: { phone: "", email: "", address: "" } },
      { component: "gallery-masonry", content: { images: ["x", "y", "z"] } },
      { component: "footer-giant-brand", content: { brand: "B", socials: [] } },
    ],
  };
}

const empty: Collected = { socials: [], contact: {}, photos: [] };

describe("injectContacts", () => {
  it("ne touche à rien si rien n'est collecté", () => {
    const out = injectContacts(baseRecipe(), empty);
    expect(out).toEqual(baseRecipe());
  });

  it("remplit les socials du footer", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      socials: [{ platform: "instagram", href: "https://instagram.com/a" }],
    });
    const footer = out.sections.find((s) => s.component === "footer-giant-brand")!;
    expect(footer.content.socials).toEqual([{ platform: "instagram", href: "https://instagram.com/a" }]);
  });

  it("remplit le contact-block (phone/email/address)", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      contact: { phone: "tel:+33611", email: "mailto:a@b.fr", address: "Lyon" },
    });
    const c = out.sections.find((s) => s.component === "contact-block")!;
    expect(c.content.phone).toBe("tel:+33611");
    expect(c.content.email).toBe("mailto:a@b.fr");
    expect(c.content.address).toBe("Lyon");
  });

  it("branche le lien de réservation sur le ctaHref du hero", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      booking: { label: "Réserver", href: "https://calendly.com/x" },
    });
    const hero = out.sections.find((s) => s.component === "hero-split-asym")!;
    expect(hero.content.ctaHref).toBe("https://calendly.com/x");
  });

  it("remplit les images d'une galerie dans l'ordre, sans dépasser les slots", () => {
    const out = injectContacts(baseRecipe(), {
      ...empty,
      photos: ["p1", "p2"],
    });
    const g = out.sections.find((s) => s.component === "gallery-masonry")!;
    expect(g.content.images).toEqual(["p1", "p2", "z"]); // 2 remplacées, la 3e conservée
  });

  it("ne mute pas la recette d'entrée", () => {
    const recipe = baseRecipe();
    const snapshot = JSON.stringify(recipe);
    injectContacts(recipe, { ...empty, socials: [{ platform: "x", href: "h" }] });
    expect(JSON.stringify(recipe)).toBe(snapshot);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sitegene && npx vitest run lib/foundry/inject.test.ts`
Expected: FAIL — `Cannot find module './inject'`.

- [ ] **Step 3: Write minimal implementation**

```ts
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
    const sorted = [...recipe.sections].sort(
      (a, b) => ROLE_IMG_PRIORITY.indexOf(roleOf(a)) - ROLE_IMG_PRIORITY.indexOf(roleOf(b)),
    );
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
```

Note de tri : `indexOf` renvoie `-1` pour les rôles hors priorité — ils passent donc **en premier**. Corriger en mappant `-1 → Infinity` :

```ts
    const rank = (s: RecipeSection) => {
      const i = ROLE_IMG_PRIORITY.indexOf(roleOf(s));
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    };
    const sorted = [...recipe.sections].sort((a, b) => rank(a) - rank(b));
```

(Remplacer le `sort` ci-dessus par cette version.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sitegene && npx vitest run lib/foundry/inject.test.ts`
Expected: PASS (6 tests verts).

- [ ] **Step 5: Commit**

```bash
cd sitegene
git add lib/foundry/inject.ts lib/foundry/inject.test.ts
git commit -m "feat(foundry): injection déterministe des liens & photos (injectContacts)"
```

---

## Task 5: Endpoint `POST /api/foundry/links`

**Files:**
- Create: `app/api/foundry/links/route.ts`

(Avant d'écrire : lire `node_modules/next/dist/docs/` pour les conventions Route Handler de cette version de Next.)

- [ ] **Step 1: Écrire le handler**

```ts
// app/api/foundry/links/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { injectContacts } from "@/lib/foundry/inject";
import { loadRecipeDraft, saveRecipeDraft } from "@/lib/foundry/server";
import type { Collected } from "@/lib/foundry/link-catalog";

export const maxDuration = 30;

/**
 * Fusionne les liens & photos collectés (tunnel /creer) dans la recette draft.
 * Déterministe (aucun appel Mistral). Idempotent.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const collected = body?.collected as Collected | undefined;
  if (!siteId || !collected) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (site.status === "live") {
    return NextResponse.json({ error: "Site déjà en ligne." }, { status: 409 });
  }

  const loaded = await loadRecipeDraft(admin, siteId);
  if (!loaded) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });

  const safe: Collected = {
    socials: Array.isArray(collected.socials) ? collected.socials.filter((s) => s?.href) : [],
    contact: collected.contact ?? {},
    booking: collected.booking?.href ? collected.booking : undefined,
    photos: Array.isArray(collected.photos) ? collected.photos.slice(0, 20) : [],
  };

  const merged = injectContacts(loaded.recipe, safe);
  await saveRecipeDraft(admin, siteId, merged, {});

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Vérifier la signature de `saveRecipeDraft`**

Run: `cd sitegene && sed -n '134,158p' lib/foundry/server.ts`
Expected: confirmer que le 4e argument (brand) accepte un objet (ex. `{ brand?, brief? }`). Si la signature diffère, adapter l'appel `saveRecipeDraft(admin, siteId, merged, {})` en conséquence (passer `undefined` ou l'objet attendu).

- [ ] **Step 3: Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur dans `app/api/foundry/links/route.ts`.

- [ ] **Step 4: Commit**

```bash
cd sitegene
git add app/api/foundry/links/route.ts
git commit -m "feat(foundry): endpoint /api/foundry/links (fusion liens & photos)"
```

---

## Task 6: Garde « 20 photos max » sur l'upload

**Files:**
- Modify: `app/api/site/photo/route.ts`

- [ ] **Step 1: Ajouter le comptage avant l'upload**

Dans `app/api/site/photo/route.ts`, après le bloc de validation d'ownership (juste après le `if (!site || site.owner_user_id !== user.id) {...}`, avant la validation du fichier), insérer :

```ts
  // Plafond : 20 photos par site (compte client).
  const { data: existing } = await admin.storage.from("site-photos").list(siteId, { limit: 100 });
  const count = (existing ?? []).filter((f) => f.id || f.name).length;
  if (count >= 20) {
    return NextResponse.json({ error: "Limite atteinte : 20 photos maximum." }, { status: 409 });
  }
```

- [ ] **Step 2: Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
cd sitegene
git add app/api/site/photo/route.ts
git commit -m "feat(foundry): plafond de 20 photos par site à l'upload"
```

---

## Task 7: Écran de collecte (`CollectStep.tsx`)

**Files:**
- Create: `components/creer/CollectStep.tsx`

Composant client présentiel : reçoit le métier détecté, l'état `collected` et des callbacks. Pas de logique réseau autre que l'upload (réutilise `POST /api/site/photo`).

- [ ] **Step 1: Écrire le composant**

```tsx
// components/creer/CollectStep.tsx
"use client";

// Écran unique de collecte (tunnel /creer), affiché PENDANT l'assemblage.
// Liens proposés par métier + bouton « Ajouter un lien » + upload photos (max 20).
import { useMemo, useRef, useState } from "react";
import {
  PLATFORMS,
  linkFieldsForTrade,
  toHref,
  type Collected,
  type LinkKind,
} from "@/lib/foundry/link-catalog";
import type { TradeId } from "@/lib/foundry/da-personas";

type Props = {
  trade: TradeId;
  siteId: string | null;          // dispo dès que la génération a renvoyé l'id
  assemblyReady: boolean;          // génération terminée ?
  collected: Collected;
  onChange: (next: Collected) => void;
  onFinish: () => void;            // « Voir mon site »
  onSkip: () => void;
};

/** Range une valeur saisie dans le bon seau de Collected selon le kind. */
function setValue(c: Collected, platform: string, kind: LinkKind, raw: string): Collected {
  const href = raw.trim() ? toHref(platform, raw) : "";
  const next: Collected = { ...c, contact: { ...c.contact }, socials: [...c.socials] };
  if (kind === "contact") {
    if (platform === "phone") next.contact.phone = href || undefined;
    else if (platform === "whatsapp") next.contact.whatsapp = href || undefined;
    else if (platform === "email") next.contact.email = href || undefined;
    else if (platform === "maps") next.contact.mapsUrl = href || undefined;
    return next;
  }
  if (kind === "booking") {
    next.booking = href ? { label: PLATFORMS[platform]?.label ?? "Réserver", href } : undefined;
    return next;
  }
  // social | link → liste socials (dédupliquée par platform)
  next.socials = next.socials.filter((s) => s.platform !== platform);
  if (href) next.socials.push({ platform, href, label: PLATFORMS[platform]?.label });
  return next;
}

/** Valeur brute courante d'un champ (pour le contrôle de l'input). */
function rawValue(c: Collected, platform: string, kind: LinkKind): string {
  if (kind === "contact") {
    const map: Record<string, string | undefined> = {
      phone: c.contact.phone, whatsapp: c.contact.whatsapp, email: c.contact.email, maps: c.contact.mapsUrl,
    };
    return map[platform] ?? "";
  }
  if (kind === "booking") return c.booking?.href ?? "";
  return c.socials.find((s) => s.platform === platform)?.href ?? "";
}

export default function CollectStep({ trade, siteId, assemblyReady, collected, onChange, onFinish, onSkip }: Props) {
  const defaults = useMemo(() => linkFieldsForTrade(trade), [trade]);
  const [extra, setExtra] = useState<string[]>([]);   // plateformes ajoutées via « + »
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const shownKeys = useMemo(() => {
    const base = defaults.map((d) => d.platform);
    return [...base, ...extra.filter((k) => !base.includes(k))];
  }, [defaults, extra]);

  const fields = shownKeys.map((platform) => {
    const def = PLATFORMS[platform] ?? PLATFORMS.link;
    return { platform, label: def.label, kind: def.kind, placeholder: def.placeholder };
  });

  async function onFiles(files: FileList | null) {
    if (!files || !siteId) return;
    setUploadError(null);
    setUploading(true);
    try {
      const remaining = 20 - collected.photos.length;
      const toSend = Array.from(files).slice(0, Math.max(0, remaining));
      const urls: string[] = [];
      for (const file of toSend) {
        const fd = new FormData();
        fd.append("siteId", siteId);
        fd.append("file", file);
        const res = await fetch("/api/site/photo", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) throw new Error(data?.error ?? "Upload impossible.");
        urls.push(data.url as string);
      }
      onChange({ ...collected, photos: [...collected.photos, ...urls].slice(0, 20) });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const allPlatformKeys = Object.keys(PLATFORMS);

  return (
    <section className="mx-auto max-w-2xl pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pendant qu'on assemble votre site…</h1>
        <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
          Ajoutez vos liens et vos photos — tout est optionnel. On ne met sur le site que ce que vous nous donnez.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3 py-1 text-[13px]">
          {assemblyReady ? (
            <span className="font-semibold text-emerald-600">✓ Votre site est prêt</span>
          ) : (
            <span className="text-[rgb(var(--m-muted))]" style={{ animation: "sg-pulse 2s ease-in-out infinite" }}>
              Assemblage en cours…
            </span>
          )}
        </div>
      </div>

      {/* Liens */}
      <div className="mt-8 space-y-3">
        {fields.map((f) => (
          <label key={f.platform} className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold">{f.label}</span>
            <input
              value={rawValue(collected, f.platform, f.kind)}
              onChange={(e) => onChange(setValue(collected, f.platform, f.kind, e.target.value))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[rgb(var(--m-accent))]"
            />
          </label>
        ))}
      </div>

      {/* Ajouter un lien */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="rounded-full border border-dashed border-[rgb(var(--m-line))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
        >
          + Ajouter un lien
        </button>
        {pickerOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-[rgb(var(--m-line))] p-3">
            {allPlatformKeys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setExtra((e) => [...e, k]); setPickerOpen(false); }}
                className="rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[12px] transition hover:border-[rgb(var(--m-accent))]"
              >
                {PLATFORMS[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Vos photos</span>
          <span className="text-[12px] text-[rgb(var(--m-faint))]">{collected.photos.length}/20</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {collected.photos.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-[rgb(var(--m-line))]">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...collected, photos: collected.photos.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 text-[11px] text-white group-hover:block"
                aria-label="Retirer"
              >
                ✕
              </button>
            </div>
          ))}
          {collected.photos.length < 20 && (
            <button
              type="button"
              disabled={!siteId || uploading}
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[rgb(var(--m-line))] text-[12px] text-[rgb(var(--m-muted))] transition hover:border-[rgb(var(--m-accent))] disabled:opacity-40"
            >
              {uploading ? "…" : "+ Ajouter"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        {uploadError ? <p className="mt-2 text-[12px] text-red-600">{uploadError}</p> : null}
        {!siteId ? <p className="mt-2 text-[12px] text-[rgb(var(--m-faint))]">Préparation du dépôt photos…</p> : null}
      </div>

      {/* Actions */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--m-line))] px-5 text-[15px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
        >
          Passer
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {assemblyReady ? "Voir mon site →" : "On termine l'assemblage…"}
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur dans `components/creer/CollectStep.tsx`.

- [ ] **Step 3: Commit**

```bash
cd sitegene
git add components/creer/CollectStep.tsx
git commit -m "feat(creer): écran de collecte liens & photos (CollectStep)"
```

---

## Task 8: Câblage dans `CreerClient` (génération en tâche de fond + phase collect)

**Files:**
- Modify: `app/creer/CreerClient.tsx`

- [ ] **Step 1: Étendre le type Phase, l'état et la restauration**

Dans `CreerClient.tsx` :

a) Ligne 22, remplacer le type Phase :

```ts
type Phase = "pitch" | "vibe" | "collect" | "pack" | "reveal";
```

b) Ajouter les imports en tête (après la ligne 19) :

```ts
import CollectStep from "@/components/creer/CollectStep";
import { detectTrade } from "@/lib/foundry/suggest";
import type { Collected } from "@/lib/foundry/link-catalog";
```

c) Ajouter l'état de collecte (près des autres `useState`, vers la ligne 83) :

```ts
  const [collected, setCollected] = useState<Collected>({ socials: [], contact: {}, photos: [] });
  const [assemblyReady, setAssemblyReady] = useState(false);
  const trade = useMemo(() => detectTrade(brief).trade, [brief]);
```

d) Inclure `collected` dans le `STATE_KEY` (lignes 117-123) — étendre l'objet sauvegardé et restauré :

```ts
  useEffect(() => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ brief, name, chartes, selectedIdx, accent, collected }));
    } catch { /* non bloquant */ }
  }, [brief, name, chartes, selectedIdx, accent, collected]);
```

Et dans la restauration (vers la ligne 91-102), ajouter dans le type et le corps :

```ts
        if (s.collected && typeof s.collected === "object") setCollected(s.collected as Collected);
```

(ajouter `collected?: Collected;` au type inline du `JSON.parse`).

- [ ] **Step 2: Découpler la génération de l'animation (lancer en tâche de fond, passer en collect)**

Remplacer la fonction `launchAssembly` (lignes 177-213) par :

```ts
  // Lance la génération EN TÂCHE DE FOND et bascule sur l'écran de collecte.
  async function launchAssembly() {
    if (launchedRef.current || !selected) return;
    launchedRef.current = true;
    setCards(null);
    setRevealed(0);
    setError(null);
    setAssemblyReady(false);
    setPhase("collect"); // l'utilisateur remplit pendant que ça génère
    setBusy(true);
    try {
      const res = await fetch("/api/foundry/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          businessName: name.trim(),
          vibeId: selected.vibe.id,
          accent: accent ?? undefined,
          charteSpec: selected.vibe.id === "custom" ? selected.spec : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.redirect) { router.push(data.redirect); return; }
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Assemblage impossible. Réessayez.");
      setSiteId(data.siteId);
      setCards(data.cards as Card[]);
      setAssemblyReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assemblage impossible. Réessayez.");
      setPhase("vibe");
    } finally {
      setBusy(false);
      launchedRef.current = false;
    }
  }
```

- [ ] **Step 3: Ajouter `finishCollect` (injection + bascule vers l'animation puis reveal)**

Ajouter après `launchAssembly` :

```ts
  // Valide la collecte : injecte les liens/photos puis joue l'anim booster → reveal.
  async function finishCollect() {
    if (siteId) {
      try {
        await fetch("/api/foundry/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, collected }),
        });
      } catch { /* injection best-effort : on révèle quand même */ }
    }
    setPhase("pack"); // joue l'animation des cartes déjà chargées, puis reveal
  }

  function skipCollect() {
    setPhase("pack");
  }
```

Note : la phase `pack` joue déjà les `cards` chargées et bascule seule en `reveal` (effets existants lignes 159-171). Aucun changement requis sur ces effets.

- [ ] **Step 4: Rendre l'écran de collecte**

Insérer, juste avant le bloc `{/* ===================== 3. PACK ... */}` (vers la ligne 499) :

```tsx
        {/* ===================== 2.5 COLLECT (liens & photos) ===================== */}
        {phase === "collect" && (
          <CollectStep
            trade={trade}
            siteId={siteId}
            assemblyReady={assemblyReady}
            collected={collected}
            onChange={setCollected}
            onFinish={finishCollect}
            onSkip={skipCollect}
          />
        )}
```

- [ ] **Step 5: Inclure `collect` dans la barre de progression**

Lignes 255-261, la barre itère sur `["pitch", "vibe", "pack"]`. La remplacer par `["pitch", "vibe", "collect", "pack"]` et adapter le tableau `order` interne :

```tsx
          {(["pitch", "vibe", "collect", "pack"] as Phase[]).map((p, i) => {
            const order: Phase[] = ["pitch", "vibe", "collect", "pack", "reveal"];
            const active = order.indexOf(phase) >= i;
            return <span key={p} className={`h-1.5 rounded-full transition-all ${active ? "w-8 bg-[rgb(var(--m-accent))]" : "w-4 bg-[rgb(var(--m-line))]"}`} />;
          })}
```

- [ ] **Step 6: Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Vérifier le build / lint du projet**

Run: `cd sitegene && npm run lint`
Expected: pas d'erreur nouvelle sur les fichiers touchés.

- [ ] **Step 8: Commit**

```bash
cd sitegene
git add app/creer/CreerClient.tsx
git commit -m "feat(creer): collecte des liens & photos pendant l'assemblage en tâche de fond"
```

---

## Task 9: Vérification end-to-end (manuelle) + suite de tests

**Files:** aucun (vérification).

- [ ] **Step 1: Lancer toute la suite de tests foundry**

Run: `cd sitegene && npx vitest run lib/foundry`
Expected: tous les tests passent, dont `link-catalog.test.ts` et `inject.test.ts`.

- [ ] **Step 2: Vérifier le typage global**

Run: `cd sitegene && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Vérification manuelle du tunnel** (skill `run` / `npm run dev`)

Parcours à valider sur `/creer` :
1. Saisir un pitch « musicien » → la phase `vibe` propose des chartes.
2. Choisir une charte → « Assembler » → l'écran **collect** s'affiche **immédiatement** (génération en tâche de fond), avec des champs Spotify/Instagram/YouTube.
3. Remplir un Instagram + un lien de réservation, uploader 1-2 photos (compteur N/20).
4. Attendre le badge « ✓ Votre site est prêt » → cliquer « Voir mon site ».
5. Sur le `reveal` : l'iframe montre les icônes sociales renseignées dans le footer, le CTA du hero pointe vers le lien de réservation, et les photos apparaissent dans la galerie. Aucun bouton vers un réseau non renseigné.
6. Refaire un parcours en cliquant « Passer » sans rien remplir → le site se révèle sans liens parasites (footer sans rangée sociale).

- [ ] **Step 4: Commit (si ajustements)**

```bash
cd sitegene
git add -A && git commit -m "fix(creer): ajustements post-vérification collecte liens & photos"
```

---

## Self-Review

**Spec coverage :**
- Étapes intermédiaires pendant le chargement → Task 8 (phase `collect` + génération en tâche de fond). ✓
- Pré-remplissage par défauts intelligents → Task 2 (`linkFieldsForTrade`) + Task 7 (affichage). ✓
- Bouton « Ajouter un lien » (toutes plateformes + Autre) → Task 1 (`PLATFORMS`) + Task 7 (picker). ✓
- Catégorisation par cible/métier → Task 2. ✓
- Photos optionnelles, upload, max 20, stockées sur le compte → Task 6 + Task 7. ✓
- Injection des liens/photos sur le site → Task 4 + Task 5. ✓
- Pas de bouton vers un lien non rempli → Task 4 (socials seulement si fournis, footers masquent déjà) + Task 7 (rien d'imposé) ; CTA internes conservés (décision actée). ✓
- Icônes manquantes → Task 3. ✓
- Lien custom placé par Mistral → explicitement **Phase 2** (hors périmètre). ✓

**Placeholder scan :** aucun « TBD/TODO » ; les deux points « à vérifier » (signature `saveRecipeDraft` en Task 5 Step 2, conventions Next App Router) sont des étapes de vérification concrètes avec commande, pas des trous.

**Type consistency :** `Collected` défini une seule fois (Task 1), importé partout. `injectContacts(recipe, collected)` cohérent entre Task 4, 5. `linkFieldsForTrade`, `toHref`, `normPlatform`, `PLATFORMS` cohérents entre tasks. `Phase` étendu de manière cohérente en Task 8.
