# Moteur de DA enrichi — Lot 1 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à chaque direction artistique une vraie identité (mode clair/sombre, typo 3 niveaux, densité, formes, texture, traitements) et faire que l'onboarding classe les DA par pertinence métier+sous-persona — sans aucune régression sur les ~60 composants existants.

**Architecture:** On ÉTEND le type `Vibe` avec des champs OPTIONNELS (compat ascendante : les 6 champs actuels restent la source des anciennes CSS vars). `vibeToCssVars` émet les anciennes vars (inchangées) + de nouvelles vars sémantiques dérivées. On ajoute 11 DA curées. Le matching `suggest.ts` passe d'une table statique à un scoring par `personas[].weight`. Les héros/navbars/footers consomment les nouvelles vars + un mécanisme de traitement hero piloté par attribut.

**Tech Stack:** TypeScript, Next.js 16 (Turbopack — lire `node_modules/next/dist/docs/` avant tout code Next), Vitest, React, CSS variables. Pas de WebGL (phase 2). Branche `feat/da-engine`.

**Spec source:** `docs/superpowers/specs/2026-06-11-da-engine-design.md`

---

## Structure des fichiers

- `lib/foundry/types.ts` — MODIFY : enrichir `Vibe` (champs optionnels), élargir `VibeId`.
- `lib/foundry/vibes.ts` — MODIFY : ajouter 11 DA ; enrichir `vibeToCssVars`.
- `lib/foundry/vibes.test.ts` — MODIFY/CREATE : non-régression anciennes vars + présence nouvelles vars + contraste WCAG des DA.
- `lib/foundry/suggest.ts` — MODIFY : `TradeId`+sous-personas, `detectTrade`, scoring par persona.
- `lib/foundry/suggest.test.ts` — MODIFY : tests détection musicien/fitness + scoring.
- `lib/foundry/da-personas.ts` — CREATE : table `DA_PERSONAS` (affinités DA↔métier) + `rankVibesForTrade`.
- `components/foundry/components/HeroSplitAsym.tsx` — MODIFY : lire le traitement hero via attribut.
- `components/foundry/Assembler.tsx` — MODIFY : exposer `data-da` + `--treatment-hero` sur le wrapper.
- `components/foundry/studio/panels.tsx` (`Themed`) — MODIFY : idem pour l'aperçu éditeur.
- Composants à migrer (couleurs en dur → vars sémantiques) : `PlumberProHero.tsx`, `PlumberModernHero.tsx`, `PlumberEmergencyHero.tsx`, `PlumberProNavbar.tsx`, `PlumberModernNavbar.tsx`, `PlumberEmergencyNavbar.tsx`, `PlumberProFooter.tsx`, `FooterColumns.tsx`.

**Convention de mapping (réalisation concrète des « 8 rôles » du spec sur le modèle compatible) :**
Le `palette` à 6 clés actuel EST conservé et porte 6 des 8 rôles. Les 2 rôles manquants (`accent3`, `border`) deviennent des champs OPTIONNELS dérivés si absents.
- `background (rôle)` = `palette.surface` (fond de page)
- `surface (rôle)` = `palette.card` (panneau)
- `textPrimary` = `palette.ink`
- `textSecondary` = `palette.muted`
- `primary` = `palette.accent`
- `secondary` = `palette.accent2`
- `border` = `palette.border?` sinon dérivé `mix(ink, surface, .82)`
- `accent3` = `palette.accent3?` sinon `palette.accent2`

---

## Task 1 : Enrichir le type `Vibe` (champs optionnels)

**Files:**
- Modify: `lib/foundry/types.ts:2-22`
- Test: `lib/foundry/vibes.test.ts`

- [ ] **Step 1 : Écrire le test de typage/compat (échoue à la compilation)**

Ajouter dans `lib/foundry/vibes.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { VIBES, VIBE_IDS, getVibe } from "./vibes";

describe("modèle Vibe enrichi", () => {
  it("expose les 6 vibes historiques + les 11 nouvelles", () => {
    expect(VIBE_IDS.length).toBe(17);
    for (const id of VIBE_IDS) expect(getVibe(id)).toBeDefined();
  });
  it("chaque vibe a un mode clair ou sombre", () => {
    for (const v of Object.values(VIBES)) {
      expect(v.mode === "light" || v.mode === "dark").toBe(true);
    }
  });
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run: `npx vitest run lib/foundry/vibes.test.ts`
Expected: FAIL — `VIBE_IDS.length` ≠ 17 et/ou `mode` inexistant sur le type.

- [ ] **Step 3 : Enrichir le type `Vibe`**

Dans `lib/foundry/types.ts`, remplacer le bloc `VibeId` + `Vibe` par :

```ts
export type VibeId =
  | "warm-serif"
  | "sage-nature"
  | "ocean-confiance"
  | "corail-studio"
  | "mineral-precis"
  | "encre-editoriale"
  // --- Lot 1 : 11 DA enrichies ---
  | "mindful-moments"
  | "lexicon-creators"
  | "auralis-neural"
  | "nexus-transfers"
  | "neurosync"
  | "rock-brutalist"
  | "rap-luxe"
  | "contemporain-editorial"
  | "photographe-galerie"
  | "coach-performance"
  | "restaurant-nocturne";

export type HeroTreatment = "default" | "split-editorial" | "fullscreen-photo" | "type-giant" | "centered-glow";
export type Texture = "none" | "grain" | "grid" | "glow" | "gradient-mesh";

export interface Vibe {
  id: VibeId | "custom";
  label: string;
  mood: string[];
  fontHref: string;
  palette: {
    ink: string; surface: string; card: string; accent: string; accent2: string; muted: string;
    /** Rôles supplémentaires (optionnels — dérivés si absents). */
    accent3?: string; border?: string;
  };
  fonts: { heading: string; body: string; /** face mono pour labels/métadonnées */ label?: string };
  radius: { card: string; xl: string; pill: string; /** rayon des contrôles (champs/boutons) */ control?: string };
  /** Clair (texte sombre/fond clair) ou sombre (texte clair/fond sombre). Défaut: "light". */
  mode?: "light" | "dark";
  /** Densité (dial). Défaut: medium. */
  density?: { base: string; gap: string; cardPadding: string; sectionPadding: string };
  /** Forme/relief. */
  shape?: { shadowCard?: string; buttonStyle?: "solid" | "outline" | "ghost" };
  /** Atmosphère de fond (CSS-only en Lot 1). */
  texture?: Texture;
  /** Dials taste-skill (1..10). */
  dials?: { variance: number; motion: number; density: number };
  /** Traitements de section imposés par la DA. */
  treatments?: { hero?: HeroTreatment };
}
```

- [ ] **Step 4 : Lancer le test (échoue encore, car VIBES n'a pas 17 entrées)**

Run: `npx vitest run lib/foundry/vibes.test.ts`
Expected: FAIL sur `VIBE_IDS.length` = 6. (Le `mode` compile désormais.) On le rendra vert en Task 3.

- [ ] **Step 5 : Vérifier la compilation globale**

Run: `npx tsc --noEmit`
Expected: PASS (champs ajoutés optionnels → aucun consommateur existant cassé).

- [ ] **Step 6 : Commit**

```bash
git add lib/foundry/types.ts lib/foundry/vibes.test.ts
git commit -m "feat(da): enrichit le type Vibe (mode, 8 rôles, typo label, densité, forme, dials, treatments)"
```

---

## Task 2 : `vibeToCssVars` émet les nouvelles vars (compat ascendante)

**Files:**
- Modify: `lib/foundry/vibes.ts:78-94`
- Test: `lib/foundry/vibes.test.ts`

- [ ] **Step 1 : Écrire le test**

Ajouter dans `lib/foundry/vibes.test.ts` :

```ts
import { vibeToCssVars } from "./vibes";

describe("vibeToCssVars", () => {
  const warm = getVibe("warm-serif")!;
  it("conserve les anciennes vars à l'identique (non-régression)", () => {
    const v = vibeToCssVars(warm);
    expect(v["--c-ink"]).toBe(warm.palette.ink);
    expect(v["--c-surface"]).toBe(warm.palette.surface);
    expect(v["--c-card"]).toBe(warm.palette.card);
    expect(v["--c-accent"]).toBe(warm.palette.accent);
    expect(v["--c-accent2"]).toBe(warm.palette.accent2);
    expect(v["--c-muted"]).toBe(warm.palette.muted);
    expect(v["--font-heading"]).toBe(warm.fonts.heading);
    expect(v["--font-body"]).toBe(warm.fonts.body);
  });
  it("émet les nouvelles vars sémantiques", () => {
    const v = vibeToCssVars(warm);
    expect(v["--c-primary"]).toBe(warm.palette.accent);
    expect(v["--c-bg"]).toBe(warm.palette.surface);
    expect(v["--c-text"]).toBe(warm.palette.ink);
    expect(v["--c-text-2"]).toBe(warm.palette.muted);
    expect(v["--c-border"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(v["--font-label"]).toBeTruthy();
    expect(v["--space-section"]).toBeTruthy();
    expect(v["--r-control"]).toBeTruthy();
  });
  it("brand.primary surcharge --c-accent ET --c-primary", () => {
    const v = vibeToCssVars(warm, { primary: "#123456" });
    expect(v["--c-accent"]).toBe("#123456");
    expect(v["--c-primary"]).toBe("#123456");
  });
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run: `npx vitest run lib/foundry/vibes.test.ts -t vibeToCssVars`
Expected: FAIL — `--c-primary` etc. `undefined`.

- [ ] **Step 3 : Enrichir `vibeToCssVars`**

Dans `lib/foundry/vibes.ts`, remplacer la fonction `vibeToCssVars` par :

```ts
/** Border dérivée si non fournie : encre fondue à 82 % dans la surface. */
function deriveBorder(vibe: Vibe): string {
  if (vibe.palette.border) return vibe.palette.border;
  const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] as const;
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const a = hx(vibe.palette.ink), b = hx(vibe.palette.surface), t = 0.82;
  return `#${to(a[0] + (b[0] - a[0]) * t)}${to(a[1] + (b[1] - a[1]) * t)}${to(a[2] + (b[2] - a[2]) * t)}`;
}

const DEFAULT_DENSITY = { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" };
const MONO_FALLBACK = "'JetBrains Mono', ui-monospace, monospace";

export function vibeToCssVars(vibe: Vibe, brand?: { primary?: string }): Record<string, string> {
  const brandPrimary = brand?.primary?.trim();
  const primary = brandPrimary ? brandPrimary : vibe.palette.accent;
  const d = vibe.density ?? DEFAULT_DENSITY;
  return {
    // --- Anciennes vars (INCHANGÉES) ---
    "--c-ink": vibe.palette.ink,
    "--c-surface": vibe.palette.surface,
    "--c-card": vibe.palette.card,
    "--c-accent": primary,
    "--c-accent2": vibe.palette.accent2,
    "--c-muted": vibe.palette.muted,
    "--font-heading": vibe.fonts.heading,
    "--font-body": vibe.fonts.body,
    "--r-card": vibe.radius.card,
    "--r-xl": vibe.radius.xl,
    "--r-pill": vibe.radius.pill,
    // --- Nouvelles vars sémantiques ---
    "--c-primary": primary,
    "--c-secondary": vibe.palette.accent2,
    "--c-accent3": vibe.palette.accent3 ?? vibe.palette.accent2,
    "--c-bg": vibe.palette.surface,
    "--c-text": vibe.palette.ink,
    "--c-text-2": vibe.palette.muted,
    "--c-border": deriveBorder(vibe),
    "--font-label": vibe.fonts.label ?? MONO_FALLBACK,
    "--space-base": d.base,
    "--space-gap": d.gap,
    "--space-card": d.cardPadding,
    "--space-section": d.sectionPadding,
    "--r-control": vibe.radius.control ?? vibe.radius.card,
    "--shadow-card": vibe.shape?.shadowCard ?? "0 1px 2px rgba(0,0,0,.06)",
    "--btn-radius": vibe.radius.control ?? vibe.radius.pill,
  };
}
```

- [ ] **Step 4 : Lancer les tests (passent)**

Run: `npx vitest run lib/foundry/vibes.test.ts -t vibeToCssVars`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add lib/foundry/vibes.ts lib/foundry/vibes.test.ts
git commit -m "feat(da): vibeToCssVars émet les vars sémantiques (compat ascendante des anciennes)"
```

---

## Task 3 : Ajouter les 11 DA curées

**Files:**
- Modify: `lib/foundry/vibes.ts` (objet `VIBES`)
- Test: `lib/foundry/vibes.test.ts`

Données des 11 DA (clés `palette` = 6 anciennes ; `mode`, `fonts`, `radius`, `treatments`, `texture`, `dials` selon spec). Chaque `card` est choisie pour que `ink` contraste sur `surface` ET `card` (les panneaux clairs-sur-fond-sombre = traitement Lot 2).

| id | mode | ink | surface | card | accent | accent2 | muted | display (css) | body (css) | label | radius card/control | hero treatment | texture |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mindful-moments | dark | #F4F1EA | #16261F | #22372F | #EBB552 | #F1CDBE | #9DB0A6 | Fraunces, serif | Manrope, sans-serif | mono | 16/12 | split-editorial | grain |
| lexicon-creators | dark | #FFFFFF | #0A0A0A | #191C21 | #F97316 | #EA580C | #A1A1AA | Syne, sans-serif | Manrope, sans-serif | mono | 8/8 | type-giant | none |
| auralis-neural | light | #111827 | #FFFFFF | #F2F4F7 | #4F46E5 | #06B6D4 | #4B5563 | Geist, sans-serif | Geist, sans-serif | mono | 8/8 | centered-glow | glow |
| nexus-transfers | light | #111827 | #F2EAD3 | #FFFFFF | #F68B1F | #FDB813 | #4B5563 | 'Playfair Display', serif | Manrope, sans-serif | mono | 16/8 | split-editorial | none |
| neurosync | light | #111827 | #FFFFFF | #F5F6F8 | #CC8066 | #334155 | #4B5563 | 'Bricolage Grotesque', sans-serif | Manrope, sans-serif | mono | 8/8 | split-editorial | grid |
| rock-brutalist | dark | #F4F1EA | #0B0B0B | #161616 | #E7FF1A | #F4F1EA | #9A9A8F | Anton, sans-serif | Archivo, sans-serif | mono | 0/0 | type-giant | grain |
| rap-luxe | dark | #FFFFFF | #0A0A0A | #1A1A1A | #D4AF37 | #C9C9C9 | #9A9A9A | Syne, sans-serif | Manrope, sans-serif | mono | 14/999 | fullscreen-photo | gradient-mesh |
| contemporain-editorial | light | #1F1A14 | #F1EBE1 | #FBF7F0 | #8A7A5E | #C9863E | #6A5F50 | Fraunces, serif | 'Work Sans', sans-serif | mono | 4/4 | split-editorial | none |
| photographe-galerie | light | #16140F | #ECE9E4 | #F4F2EE | #16140F | #A89C87 | #6F685C | 'Bricolage Grotesque', sans-serif | 'Work Sans', sans-serif | mono | 2/2 | fullscreen-photo | none |
| coach-performance | dark | #F3F4F2 | #0E0F12 | #181A1E | #C6FF3A | #F3F4F2 | #8B8F8A | 'Bebas Neue', sans-serif | Manrope, sans-serif | mono | 4/4 | type-giant | grid |
| restaurant-nocturne | dark | #F3E6D6 | #160D0B | #241512 | #C9863E | #D9A86A | #8C7A64 | 'Cormorant Garamond', serif | Jost, sans-serif | mono | 0/0 | centered-glow | glow |

`fontHref` Google Fonts (avec JetBrains Mono pour `label`) par DA — utiliser exactement ces familles :
- mindful-moments : `Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500` + `Manrope:wght@400;500;600;700` + `JetBrains+Mono:wght@400;700`
- lexicon-creators : `Syne:wght@600;700;800` + `Manrope:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- auralis-neural : `Geist:wght@400;500;600;700` + `JetBrains+Mono:wght@400;700`
- nexus-transfers : `Playfair+Display:wght@500;600;700` + `Manrope:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- neurosync : `Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800` + `Manrope:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- rock-brutalist : `Anton` + `Archivo:wght@400;600;800` + `JetBrains+Mono:wght@400;700`
- rap-luxe : `Syne:wght@600;700;800` + `Manrope:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- contemporain-editorial : `Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,400` + `Work+Sans:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- photographe-galerie : `Bricolage+Grotesque:opsz,wght@12..96,300;12..96,700;12..96,800` + `Work+Sans:wght@400;500;600` + `JetBrains+Mono:wght@400;700`
- coach-performance : `Bebas+Neue` + `Manrope:wght@400;500;600;700` + `JetBrains+Mono:wght@400;700`
- restaurant-nocturne : `Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400` + `Jost:wght@300;400;500` + `JetBrains+Mono:wght@400;700`

- [ ] **Step 1 : Écrire les tests des DA**

Ajouter dans `lib/foundry/vibes.test.ts` :

```ts
import { contrast } from "./charte";

const NEW_DA: VibeId[] = [
  "mindful-moments","lexicon-creators","auralis-neural","nexus-transfers","neurosync",
  "rock-brutalist","rap-luxe","contemporain-editorial","photographe-galerie",
  "coach-performance","restaurant-nocturne",
];

describe("DA curées (Lot 1)", () => {
  it("les 11 DA existent et sont rendables", () => {
    for (const id of NEW_DA) {
      const v = getVibe(id)!;
      expect(v).toBeDefined();
      expect(v.fontHref).toContain("JetBrains+Mono");
      expect(v.fonts.label).toBeTruthy();
      expect(v.treatments?.hero).toBeTruthy();
    }
  });
  it("contraste texte/fond WCAG AA (≥ 4.5) sur chaque DA, fond ET panneau", () => {
    for (const id of NEW_DA) {
      const v = getVibe(id)!;
      expect(contrast(v.palette.ink, v.palette.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v.palette.ink, v.palette.card)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

> NB : `contrast` est déjà exporté par `lib/foundry/charte.ts` (l.99).

- [ ] **Step 2 : Lancer (échoue)**

Run: `npx vitest run lib/foundry/vibes.test.ts -t "DA curées"`
Expected: FAIL — DA inexistantes.

- [ ] **Step 3 : Ajouter les 11 entrées dans `VIBES`**

Dans `lib/foundry/vibes.ts`, à l'intérieur de l'objet `VIBES` (après `encre-editoriale`, avant la `}` de fermeture), ajouter une entrée par DA en suivant ce gabarit (exemple complet pour `mindful-moments`, à répliquer avec les valeurs du tableau) :

```ts
  "mindful-moments": {
    id: "mindful-moments",
    label: "Mindful — vert & or",
    mood: ["apaisant", "premium", "centré"],
    mode: "dark",
    fontHref: `${GF}?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap`,
    palette: { ink: "#F4F1EA", surface: "#16261F", card: "#22372F", accent: "#EBB552", accent2: "#F1CDBE", muted: "#9DB0A6" },
    fonts: { heading: "Fraunces, Georgia, serif", body: "Manrope, system-ui, sans-serif", label: "'JetBrains Mono', ui-monospace, monospace" },
    radius: { card: "16px", xl: "24px", pill: "999px", control: "12px" },
    density: { base: "8px", gap: "16px", cardPadding: "24px", sectionPadding: "80px" },
    texture: "grain",
    dials: { variance: 5, motion: 4, density: 5 },
    treatments: { hero: "split-editorial" },
  },
```

Répliquer pour les 10 autres avec les couleurs/fonts/radius/treatment/texture du tableau ci-dessus. Pour `radius`, mettre `xl` = `card`+8px, `pill` = `"999px"` (sauf `rock-brutalist`/`coach-performance`/`restaurant-nocturne` où `pill: "0px"`), `control` = colonne control. `dials` : mettre `variance/motion/density` cohérents (brutalist/rock/fitness ≈ 8-9 variance & motion ; éditorial/galerie ≈ 2-3 motion).

- [ ] **Step 4 : Lancer les tests des DA + tout vibes.test**

Run: `npx vitest run lib/foundry/vibes.test.ts`
Expected: PASS (dont `VIBE_IDS.length` = 17 de Task 1). Si un contraste échoue, ajuster `card`/`ink` de la DA fautive (éclaircir le texte ou assombrir le panneau) jusqu'à ≥ 4.5.

- [ ] **Step 5 : Vérifier tsc**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add lib/foundry/vibes.ts lib/foundry/vibes.test.ts
git commit -m "feat(da): ajoute 11 DA curées (5 SaaS, 3 musicien, 3 verticaux) avec mode/typo/densité/treatments"
```

---

## Task 4 : Non-régression — les 6 vibes historiques inchangées

**Files:**
- Test: `lib/foundry/vibes.test.ts`

- [ ] **Step 1 : Écrire le test de snapshot des anciennes vars**

Ajouter :

```ts
const LEGACY: VibeId[] = ["warm-serif","sage-nature","ocean-confiance","corail-studio","mineral-precis","encre-editoriale"];

describe("non-régression vibes historiques", () => {
  it("les 6 anciennes vibes produisent exactement leurs anciennes vars", () => {
    for (const id of LEGACY) {
      const v = getVibe(id)!;
      const css = vibeToCssVars(v);
      expect(css["--c-ink"]).toBe(v.palette.ink);
      expect(css["--c-surface"]).toBe(v.palette.surface);
      expect(css["--c-card"]).toBe(v.palette.card);
      expect(css["--c-accent"]).toBe(v.palette.accent);
      expect(css["--c-accent2"]).toBe(v.palette.accent2);
      expect(css["--c-muted"]).toBe(v.palette.muted);
      expect(css["--font-heading"]).toBe(v.fonts.heading);
      expect(css["--font-body"]).toBe(v.fonts.body);
      expect(css["--r-card"]).toBe(v.radius.card);
    }
  });
});
```

- [ ] **Step 2 : Lancer (doit passer immédiatement)**

Run: `npx vitest run lib/foundry/vibes.test.ts -t "non-régression"`
Expected: PASS (prouve que l'enrichissement n'a rien changé pour l'existant).

- [ ] **Step 3 : Commit**

```bash
git add lib/foundry/vibes.test.ts
git commit -m "test(da): verrouille la non-régression des 6 vibes historiques"
```

---

## Task 5 : Table des personas + ranking (matching)

**Files:**
- Create: `lib/foundry/da-personas.ts`
- Test: `lib/foundry/da-personas.test.ts`

- [ ] **Step 1 : Écrire le test**

Créer `lib/foundry/da-personas.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { rankVibesForTrade } from "./da-personas";
import { VIBE_IDS } from "./vibes";

describe("rankVibesForTrade", () => {
  it("classe TOUTES les vibes (jamais de perte)", () => {
    const r = rankVibesForTrade("musicien", "rap");
    expect(r.length).toBe(VIBE_IDS.length);
    expect(new Set(r.map((x) => x.vibeId)).size).toBe(VIBE_IDS.length);
  });
  it("met une DA pertinente en tête selon le sous-persona", () => {
    expect(rankVibesForTrade("musicien", "rap")[0].vibeId).toBe("rap-luxe");
    expect(rankVibesForTrade("musicien", "rock")[0].vibeId).toBe("rock-brutalist");
    expect(rankVibesForTrade("musicien", "contemporain")[0].vibeId).toBe("contemporain-editorial");
    expect(rankVibesForTrade("photographe")[0].vibeId).toBe("photographe-galerie");
    expect(rankVibesForTrade("restaurant")[0].vibeId).toBe("restaurant-nocturne");
    expect(rankVibesForTrade("fitness")[0].vibeId).toBe("coach-performance");
  });
  it("marque les 3 premières comme recommandées", () => {
    const r = rankVibesForTrade("photographe");
    expect(r.slice(0, 3).every((x) => x.recommended)).toBe(true);
    expect(r[3].recommended).toBe(false);
    expect(r[0].reason.length).toBeGreaterThan(8);
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `npx vitest run lib/foundry/da-personas.test.ts`
Expected: FAIL — module inexistant.

- [ ] **Step 3 : Implémenter `da-personas.ts`**

Créer `lib/foundry/da-personas.ts` :

```ts
// lib/foundry/da-personas.ts
// Affinité DA ↔ métier/sous-persona → classement par pertinence (onboarding).
// Déterministe, sans réseau. Toutes les vibes sont classées ; les mieux notées
// portent recommended=true. Une raison FR courte est rendue par DA.
import type { VibeId } from "./types";
import { VIBE_IDS } from "./vibes";

export type TradeId =
  | "coach" | "bien-etre" | "photographe" | "artisan" | "restaurant"
  | "beaute" | "conseil" | "musicien" | "fitness" | "autre";

/** Poids d'affinité d'une DA pour (trade, sous-persona). weight 0..100. */
interface Affinity { vibeId: VibeId; trade: TradeId; sub?: string; weight: number; reason: string }

export const DA_PERSONAS: Affinity[] = [
  // Musicien
  { vibeId: "rap-luxe", trade: "musicien", sub: "rap", weight: 95, reason: "Chrome et or sur noir : le luxe-street, streaming en avant." },
  { vibeId: "rock-brutalist", trade: "musicien", sub: "rock", weight: 95, reason: "Brutalist, jaune acide, dates qui défilent — énergie scène." },
  { vibeId: "contemporain-editorial", trade: "musicien", sub: "contemporain", weight: 95, reason: "Éditorial intime, sérif tendre, paroles mises en avant." },
  { vibeId: "rap-luxe", trade: "musicien", weight: 60, reason: "Présence forte pour un artiste qui s'affirme." },
  { vibeId: "rock-brutalist", trade: "musicien", weight: 55, reason: "Parti pris graphique fort, façon affiche." },
  { vibeId: "contemporain-editorial", trade: "musicien", weight: 55, reason: "Élégance sobre pour mettre la musique en avant." },
  // Photographe
  { vibeId: "photographe-galerie", trade: "photographe", weight: 95, reason: "Galerie froide, l'image d'abord, beaucoup d'air." },
  { vibeId: "encre-editoriale", trade: "photographe", weight: 70, reason: "Élégance de galerie, vos images priment." },
  { vibeId: "contemporain-editorial", trade: "photographe", weight: 65, reason: "Éditorial chaleureux pour un portfolio sensible." },
  // Restaurant
  { vibeId: "restaurant-nocturne", trade: "restaurant", weight: 95, reason: "Braise et or, ambiance de table à la lueur des bougies." },
  { vibeId: "nexus-transfers", trade: "restaurant", weight: 50, reason: "Crème chaleureuse, esprit maison." },
  { vibeId: "corail-studio", trade: "restaurant", weight: 60, reason: "Gourmand et solaire : on a déjà faim." },
  // Fitness / coach sportif
  { vibeId: "coach-performance", trade: "fitness", weight: 95, reason: "Industriel kinetic, lime électrique, preuve par les chiffres." },
  { vibeId: "lexicon-creators", trade: "fitness", weight: 55, reason: "Sombre et net, orienté conversion." },
  // Coach / bien-être
  { vibeId: "mindful-moments", trade: "bien-etre", weight: 90, reason: "Vert profond et or : la langue du bien-être premium." },
  { vibeId: "sage-nature", trade: "bien-etre", weight: 80, reason: "Végétal et lin, apaisant dès le premier écran." },
  { vibeId: "mindful-moments", trade: "coach", weight: 80, reason: "Calme premium, autorité douce." },
  { vibeId: "warm-serif", trade: "coach", weight: 75, reason: "Chaleur humaine pour un métier de confiance." },
  // Conseil / SaaS / tech
  { vibeId: "auralis-neural", trade: "conseil", weight: 85, reason: "Tech clair, panneau glow : crédibilité produit." },
  { vibeId: "neurosync", trade: "conseil", weight: 80, reason: "Feature clair et net, bento maîtrisé." },
  { vibeId: "lexicon-creators", trade: "conseil", weight: 78, reason: "Sombre orienté conversion (pricing, créateurs)." },
  { vibeId: "nexus-transfers", trade: "conseil", weight: 72, reason: "Fintech chaleureuse, données mises en valeur." },
  { vibeId: "ocean-confiance", trade: "conseil", weight: 70, reason: "Le bleu des marques de confiance." },
  // Artisan
  { vibeId: "ocean-confiance", trade: "artisan", weight: 85, reason: "Net et fiable, première impression d'un pro." },
  { vibeId: "neurosync", trade: "artisan", weight: 60, reason: "Clair et carré, devis lisibles." },
  { vibeId: "mineral-precis", trade: "artisan", weight: 65, reason: "Précision d'atelier." },
  // Beauté
  { vibeId: "encre-editoriale", trade: "beaute", weight: 80, reason: "Raffiné comme un salon haut de gamme." },
  { vibeId: "contemporain-editorial", trade: "beaute", weight: 72, reason: "Doux et éditorial." },
  { vibeId: "corail-studio", trade: "beaute", weight: 68, reason: "Pop et lumineux." },
];

export interface RankedVibe { vibeId: VibeId; weight: number; recommended: boolean; reason: string }

/** Raison générique de repli quand une DA n'a pas d'affinité explicite. */
const GENERIC_REASON = "Une base élégante, adaptable à votre activité.";

/**
 * Classe TOUTES les vibes pour un (trade, sous-persona) :
 * - score = max poids des affinités matching (sous-persona exact > trade seul) ;
 * - vibes sans affinité = poids 0 (restent listées, en bas) ;
 * - les 3 meilleures (poids > 0) reçoivent recommended=true.
 */
export function rankVibesForTrade(trade: TradeId, sub?: string): RankedVibe[] {
  const scored = VIBE_IDS.map((vibeId) => {
    const matches = DA_PERSONAS.filter((a) => a.vibeId === vibeId && a.trade === trade);
    let best: Affinity | undefined;
    for (const m of matches) {
      const score = m.sub ? (m.sub === sub ? m.weight + 1000 : -1) : m.weight;
      if (score < 0) continue;
      if (!best || (best.sub === sub ? best.weight + 1000 : best.weight) < score) best = m;
    }
    const weight = best ? (best.sub === sub ? best.weight + 1000 : best.weight) : 0;
    return { vibeId, weight, reason: best?.reason ?? GENERIC_REASON, recommended: false };
  });
  scored.sort((a, b) => b.weight - a.weight);
  let rec = 0;
  for (const s of scored) { if (s.weight > 0 && rec < 3) { s.recommended = true; rec++; } }
  return scored;
}
```

- [ ] **Step 4 : Lancer les tests (passent)**

Run: `npx vitest run lib/foundry/da-personas.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add lib/foundry/da-personas.ts lib/foundry/da-personas.test.ts
git commit -m "feat(da): table d'affinités DA↔métier + rankVibesForTrade (classement par pertinence)"
```

---

## Task 6 : `detectTrade` reconnaît musicien + sous-persona ; `suggest.ts` utilise le ranking

**Files:**
- Modify: `lib/foundry/suggest.ts` (entier)
- Modify: `lib/foundry/suggest.test.ts`

- [ ] **Step 1 : Étendre les tests**

Dans `lib/foundry/suggest.test.ts`, ajouter au `describe("detectTrade")` :

```ts
  it("détecte le musicien et son sous-persona", () => {
    expect(detectTrade("Rappeur indépendant, nouveau projet").trade).toBe("musicien");
    expect(detectTrade("Rappeur indépendant, nouveau projet").sub).toBe("rap");
    expect(detectTrade("Groupe de rock garage en tournée").sub).toBe("rock");
    expect(detectTrade("Chanteuse, single intimiste").sub).toBe("contemporain");
    expect(detectTrade("Salle de sport et coaching sportif").trade).toBe("fitness");
  });
```

Et adapter le test existant `detectTrade("...")` qui comparait à une string : `detectTrade(x)` renvoie désormais `{ trade, sub? }`. Mettre à jour les assertions existantes en `.trade` (ex. `expect(detectTrade("Je suis coach…").trade).toBe("coach")`).

Remplacer le `describe("suggestVibes")` par :

```ts
describe("suggestVibes", () => {
  it("classe toutes les vibes, recommandées en tête, avec raison", () => {
    const s = suggestVibes("Rappeur, nouvel album");
    expect(s.length).toBeGreaterThanOrEqual(6);
    expect(s[0].vibeId).toBe("rap-luxe");
    expect(s[0].recommended).toBe(true);
    for (const x of s) { expect(getVibe(x.vibeId)).toBeDefined(); expect(x.reason.length).toBeGreaterThan(8); }
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `npx vitest run lib/foundry/suggest.test.ts`
Expected: FAIL — `detectTrade` renvoie une string, pas d'objet ; `suggestVibes` renvoie 3.

- [ ] **Step 3 : Réécrire `suggest.ts`**

Remplacer **tout** le contenu de `lib/foundry/suggest.ts` par :

```ts
// lib/foundry/suggest.ts
// Détection métier + sous-persona depuis le pitch (onboarding) → DA classées par
// pertinence (cf. da-personas). Déterministe, sans réseau. L'agenceur ne décide
// JAMAIS de la DA : le client choisit dans une liste triée.
import { rankVibesForTrade, type TradeId, type RankedVibe } from "./da-personas";

export type { TradeId } from "./da-personas";

export interface TradeDetection { trade: TradeId; sub?: string }

const TRADE_KEYWORDS: Array<{ trade: TradeId; words: string[] }> = [
  { trade: "musicien", words: ["musicien", "musique", "chanteur", "chanteuse", "rappeur", "rappeuse", "rap", "rock", "groupe", "band", "concert", "album", "single", "dj", "beatmaker", "artiste", "tournée", "tournee", "scène", "scene"] },
  { trade: "fitness", words: ["salle de sport", "coach sportif", "fitness", "musculation", "crossfit", "personal trainer", "préparateur physique", "preparateur physique", "box", "studio de sport"] },
  { trade: "coach", words: ["coach", "coaching", "développement personnel", "developpement personnel", "thérapeute", "therapeute", "thérapie", "therapie", "hypnose", "psy", "accompagnement"] },
  { trade: "bien-etre", words: ["yoga", "bien-être", "bien etre", "massage", "sophrologie", "sophrologue", "naturopathe", "méditation", "meditation", "pilates", "reiki", "spa"] },
  { trade: "photographe", words: ["photographe", "photographie", "photo", "vidéaste", "videaste", "shooting", "mariage"] },
  { trade: "artisan", words: ["artisan", "plombier", "électricien", "electricien", "menuisier", "maçon", "macon", "peintre en bâtiment", "couvreur", "chauffagiste", "serrurier", "rénovation", "renovation", "btp", "paysagiste", "jardinier"] },
  { trade: "restaurant", words: ["restaurant", "traiteur", "chef", "cuisine", "pâtisserie", "patisserie", "boulangerie", "food", "café", "brunch", "bistrot", "table"] },
  { trade: "beaute", words: ["coiffeur", "coiffure", "esthétique", "esthetique", "barbier", "onglerie", "maquillage", "institut de beauté", "tatoueur", "tatouage"] },
  { trade: "conseil", words: ["consultant", "conseil", "avocat", "notaire", "expert-comptable", "comptable", "agence", "freelance", "développeur", "developpeur", "architecte", "immobilier", "courtier", "formation", "formateur", "saas", "startup", "logiciel", "application"] },
];

const SUB_KEYWORDS: Record<TradeId, Array<{ sub: string; words: string[] }>> = {
  musicien: [
    { sub: "rap", words: ["rap", "rappeur", "rappeuse", "hip-hop", "hip hop", "trap", "drill"] },
    { sub: "rock", words: ["rock", "groupe", "band", "métal", "metal", "punk", "garage", "guitare"] },
    { sub: "contemporain", words: ["chanteur", "chanteuse", "auteur", "compositeur", "pop", "folk", "intimiste", "acoustique", "variété", "variete"] },
  ],
  coach: [], "bien-etre": [], photographe: [], artisan: [], restaurant: [],
  beaute: [], conseil: [], fitness: [], autre: [],
};

function normalize(s: string): string { return ` ${s.toLowerCase()} `; }

/** Détecte le métier dominant + sous-persona éventuel. */
export function detectTrade(brief: string): TradeDetection {
  const text = normalize(brief);
  let best: { trade: TradeId; hits: number } = { trade: "autre", hits: 0 };
  for (const { trade, words } of TRADE_KEYWORDS) {
    const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
    if (hits > best.hits) best = { trade, hits };
  }
  const subs = SUB_KEYWORDS[best.trade] ?? [];
  let sub: string | undefined;
  let subHits = 0;
  for (const { sub: s, words } of subs) {
    const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
    if (hits > subHits) { subHits = hits; sub = s; }
  }
  return best.trade === "autre" ? { trade: "autre" } : { trade: best.trade, sub };
}

/** DA classées par pertinence pour un pitch (1re = recommandation). */
export function suggestVibes(brief: string): RankedVibe[] {
  const { trade, sub } = detectTrade(brief);
  return rankVibesForTrade(trade, sub);
}
```

- [ ] **Step 4 : Mettre à jour les consommateurs de l'ancienne API**

`lib/foundry/charte.ts` (l.296-299, `fallbackChartes`) consomme `suggestVibes(...).map(s => ... s.vibeId ...)` — toujours valide (le champ `vibeId` existe sur `RankedVibe`). Vérifier qu'aucun appelant n'attend `detectTrade` en string :

Run: `grep -rn "detectTrade(" lib app components --include=*.ts --include=*.tsx | grep -v ".test."`
Pour chaque résultat hors `suggest.ts`, adapter en `.trade`. (Au moment du plan : seul `suggest.ts`/`charte.ts` l'utilisent ; `charte.ts` n'appelle pas `detectTrade` directement.)

- [ ] **Step 5 : Lancer les tests foundry complets**

Run: `npx vitest run lib/foundry/`
Expected: PASS (suggest + charte + le reste). Si `charte.test.ts` casse sur le nombre de chartes de repli, ajuster `fallbackChartes` pour prendre `suggestVibes(brief).slice(0, 3)`.

- [ ] **Step 6 : tsc + commit**

```bash
npx tsc --noEmit
git add lib/foundry/suggest.ts lib/foundry/suggest.test.ts lib/foundry/charte.ts
git commit -m "feat(da): detectTrade musicien/fitness + sous-persona, suggestVibes classe par pertinence"
```

---

## Task 7 : Mécanisme de traitement hero (attribut piloté par la DA)

**Files:**
- Modify: `components/foundry/Assembler.tsx:30-61`
- Modify: `components/foundry/studio/panels.tsx` (`Themed`, ~l.40-46)
- Modify: `components/foundry/components/HeroSplitAsym.tsx`
- Test: `lib/foundry/treatment.test.ts` (logique pure de sélection)

L'Assembler connaît la vibe ; les composants reçoivent `{content, skin}`. On expose le traitement hero via un **attribut `data-hero`** sur le wrapper de chaque section hero, lu en CSS par le composant. Logique de sélection isolée dans une fonction pure testable.

- [ ] **Step 1 : Test de la fonction pure de sélection**

Créer `lib/foundry/treatment.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { heroTreatmentOf } from "./treatment";
import { getVibe } from "./vibes";

describe("heroTreatmentOf", () => {
  it("retourne le traitement déclaré par la DA", () => {
    expect(heroTreatmentOf(getVibe("rock-brutalist")!)).toBe("type-giant");
    expect(heroTreatmentOf(getVibe("photographe-galerie")!)).toBe("fullscreen-photo");
  });
  it("retombe sur 'default' si non déclaré", () => {
    expect(heroTreatmentOf(getVibe("warm-serif")!)).toBe("default");
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `npx vitest run lib/foundry/treatment.test.ts`
Expected: FAIL — module inexistant.

- [ ] **Step 3 : Créer `lib/foundry/treatment.ts`**

```ts
// lib/foundry/treatment.ts
import type { Vibe, HeroTreatment } from "./types";

/** Traitement hero imposé par la DA (défaut si non déclaré). */
export function heroTreatmentOf(vibe: Vibe): HeroTreatment {
  return vibe.treatments?.hero ?? "default";
}
```

- [ ] **Step 4 : Lancer (passe)**

Run: `npx vitest run lib/foundry/treatment.test.ts`
Expected: PASS.

- [ ] **Step 5 : Exposer l'attribut dans l'Assembler**

Dans `components/foundry/Assembler.tsx`, ajouter l'import puis poser `data-hero` sur le wrapper des sections de rôle `hero`. Remplacer le bloc de rendu des sections (l.37-61) par :

```tsx
      {v.resolved.map((s, i) => {
        const C = COMPONENTS[s.manifest.id];
        if (!C) return null;
        const heroAttr = s.manifest.role === "hero" ? { "data-hero": heroTreatmentOf(vibe) } : {};
        if (i === highlightIndex) {
          return (
            <div key={i} id="sg-preview-target" {...heroAttr}
              style={{ outline: "3px solid var(--c-accent)", outlineOffset: "-3px", scrollMarginTop: "24px" }}>
              <C content={s.content} skin={s.skin} />
            </div>
          );
        }
        if (s.manifest.role === "navbar") {
          return (<SmartNav key={i}><C content={s.content} skin={s.skin} /></SmartNav>);
        }
        return <div key={i} {...heroAttr}><C content={s.content} skin={s.skin} /></div>;
      })}
```

Et ajouter en tête du fichier : `import { heroTreatmentOf } from "@/lib/foundry/treatment";`

> Note : on enveloppe désormais chaque section non-navbar dans un `<div>` porteur de `data-hero` (vide pour les non-hero). Vérifier qu'aucun style global ne dépend du fait que les sections étaient des enfants directs (elles ne l'étaient déjà plus pour highlight/navbar).

- [ ] **Step 6 : Faire réagir `HeroSplitAsym` au traitement**

Dans `components/foundry/components/HeroSplitAsym.tsx`, ajouter un bloc `<style>` scopé qui réagit à `[data-hero="type-giant"]` et `[data-hero="centered-glow"]` sur l'ancêtre. Exemple minimal à intégrer (garde le rendu actuel comme `default`/`split-editorial`) :

```tsx
      <style>{`
        [data-hero="type-giant"] .hsa-title { font-size: clamp(3rem,9vw,6.5rem); letter-spacing: -3px; }
        [data-hero="centered-glow"] .hsa-wrap { text-align:center; }
      `}</style>
```

Et s'assurer que le titre porte `className="hsa-title"` et le conteneur `className="hsa-wrap"` (ajouter ces classes aux éléments existants si absentes). Le but du Lot 1 : prouver le mécanisme (le titre grossit en `type-giant`). Les traitements riches viennent en Lot 2.

- [ ] **Step 7 : Répliquer l'attribut dans l'aperçu éditeur (`Themed`)**

Dans `components/foundry/studio/panels.tsx`, la fonction `Themed` enveloppe le rendu de l'Atelier. Là où `StudioEditor` rend chaque section hero, poser `data-hero={heroTreatmentOf(vibe)}` sur le wrapper de section (cf. `StudioEditor.tsx` canvas, l.515-523 : ajouter l'attribut sur le `<div>` de section quand `s.role === "hero"`). Importer `heroTreatmentOf` et convertir `StudioVibe`→`Vibe` (même forme).

- [ ] **Step 8 : Vérifs**

Run: `npx vitest run lib/foundry/ && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9 : Commit**

```bash
git add lib/foundry/treatment.ts lib/foundry/treatment.test.ts components/foundry/Assembler.tsx components/foundry/components/HeroSplitAsym.tsx components/foundry/studio/panels.tsx components/foundry/studio/StudioEditor.tsx
git commit -m "feat(da): mécanisme de traitement hero piloté par la DA (data-hero) + variant type-giant"
```

---

## Task 8 : Migrer héros/navbars/footers vers les vars sémantiques

**Files (audit déjà fait — peu de littéraux) :**
- Modify: `components/foundry/components/PlumberEmergencyNavbar.tsx:20` (`color:#fff` du hover → `var(--c-bg)`)
- Modify: `PlumberProHero.tsx`, `PlumberModernHero.tsx`, `PlumberEmergencyHero.tsx` — `text-white` (Tailwind) sur fond coloré : remplacer par `style={{ color: "var(--c-bg)" }}` UNIQUEMENT là où le fond est `var(--c-accent)`/`var(--c-ink)` clair-sur-foncé reste correct ; sinon laisser.
- Modify: `PlumberProFooter.tsx`, `FooterColumns.tsx` — déjà migrés (session précédente), vérifier qu'ils utilisent `navLabel/navHref` et des vars.

> Principe : remplacer les couleurs **en dur** par des vars sémantiques **uniquement** quand elles doivent suivre la DA. Un `#fff` qui est « la couleur du texte sur un fond de marque » devient `var(--c-bg)` si le fond est clair OU reste tel quel si le hero est intrinsèquement sombre. Ne PAS introduire de régression visuelle sur les 6 vibes claires.

- [ ] **Step 1 : Test de garde — aucun hex de fond/texte structurel en dur dans les composants de rôle hero/navbar/footer du catalogue**

Créer `lib/foundry/no-hardcoded-colors.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "PlumberProHero","PlumberModernHero","PlumberEmergencyHero",
  "PlumberProNavbar","PlumberModernNavbar","PlumberEmergencyNavbar",
  "PlumberProFooter","FooterColumns",
];
// #fff/#000 etc. tolérés UNIQUEMENT dans rgba()/gradient/shadow. On interdit
// les `color:#xxx` / `background:#xxx` solides hors var().
const SOLID = /(background|background-color|color)\s*:\s*#[0-9a-fA-F]{3,6}\b/g;

describe("pas de couleur solide en dur (hero/navbar/footer catalogue)", () => {
  for (const f of FILES) {
    it(f, () => {
      const src = readFileSync(join(process.cwd(), "components/foundry/components", `${f}.tsx`), "utf8");
      const hits = (src.match(SOLID) ?? []).filter((h) => !h.includes("var("));
      expect(hits, `couleurs solides en dur: ${hits.join(", ")}`).toEqual([]);
    });
  }
});
```

- [ ] **Step 2 : Lancer (peut échouer sur PlumberEmergencyNavbar `#fff`)**

Run: `npx vitest run lib/foundry/no-hardcoded-colors.test.ts`
Expected: FAIL au moins sur `PlumberEmergencyNavbar` (`.penav-cta:hover { ... color:#fff }`).

- [ ] **Step 3 : Corriger les littéraux détectés**

Dans `components/foundry/components/PlumberEmergencyNavbar.tsx`, remplacer dans le `<style>` :
`.penav-cta:hover { background: var(--c-ink); color: #fff; }`
par :
`.penav-cta:hover { background: var(--c-ink); color: var(--c-bg); }`

Pour tout autre fichier que le test signale, remplacer le `color:#fff`/`background:#xxx` solide par la var sémantique adéquate (`var(--c-bg)` pour un texte sur fond encre, `var(--c-text)` pour un texte sur fond clair, `var(--c-border)` pour une bordure). Les `text-white` en classe **Tailwind** ne sont pas captés par ce test (ils restent volontaires sur les héros à fond de marque) — ne pas y toucher en Lot 1 sauf besoin visuel.

- [ ] **Step 4 : Lancer (passe)**

Run: `npx vitest run lib/foundry/no-hardcoded-colors.test.ts`
Expected: PASS.

- [ ] **Step 5 : Vérif visuelle manuelle (preview)**

Lancer le site (`npm run dev` déjà actif) et, via l'Atelier, basculer une page sur `rock-brutalist`, `rap-luxe`, `mindful-moments`, `photographe-galerie` : vérifier que héros/navbar/footer rendent en cohérence (texte lisible sur fond, accent = couleur de la DA). Noter tout souci pour Lot 2.

- [ ] **Step 6 : Commit**

```bash
git add components/foundry/components lib/foundry/no-hardcoded-colors.test.ts
git commit -m "refactor(da): héros/navbars/footers consomment les vars sémantiques (garde anti-couleur-en-dur)"
```

---

## Task 9 : Vérification finale Lot 1

- [ ] **Step 1 : Suite complète foundry + typecheck**

Run: `npx vitest run lib/foundry/ && npx tsc --noEmit`
Expected: PASS — au moins 72 tests historiques + les nouveaux (vibes, da-personas, suggest, treatment, no-hardcoded-colors).

- [ ] **Step 2 : Lint des fichiers touchés**

Run: `npx eslint lib/foundry/vibes.ts lib/foundry/suggest.ts lib/foundry/da-personas.ts lib/foundry/treatment.ts components/foundry/Assembler.tsx components/foundry/components/PlumberEmergencyNavbar.tsx`
Expected: aucune nouvelle erreur.

- [ ] **Step 3 : Commit de clôture (si reliquats) + résumé**

```bash
git add -A && git commit -m "chore(da): clôture Lot 1 — moteur de DA enrichi + 11 DA + matching" || echo "rien à committer"
```

---

## Self-review (couverture spec)

- §3 modèle enrichi → Task 1. ✓
- §4 compat ascendante → Task 2 + Task 4 (non-régression). ✓
- §5 migration héros/navbars/footers → Task 8. ✓
- §6 traitements hero → Task 7. ✓
- §7 les 11 DA → Task 3. ✓
- §8 matching onboarding (métier+sous-persona, classement) → Task 5 + Task 6. ✓
- §9 séquencement (CSS-only, WebGL phase 2) → respecté (aucune dépendance WebGL). ✓
- §10 non-régression/validation → Task 4, Task 9, contraste WCAG (Task 3). ✓

Hors périmètre confirmé : composants bespoke par DA, WebGL, sections Lot 2/3, enregistrement des lignées orphelines.
```
