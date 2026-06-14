# SP1 — Socle « fonderie » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prouver la boucle *recette → site React* avec théming par vibe et contrat de composant, sur du contenu réel, dans le codebase sitegene.

**Architecture:** Logique testable (types, vibes, manifests, validation/résolution de recette) dans `lib/foundry/` (sans JSX → testable en vitest node). Rendu React (Assembler + primitives + 4 composants seed) dans `components/foundry/`. Une route `app/foundry-demo/` rend une **recette écrite à la main**. Le théming passe par des **variables CSS** posées par l'Assembler ; les composants lisent ces variables (Tailwind v4, valeurs arbitraires `var(--…)`). Mistral n'intervient pas dans SP1.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind v4 (`@theme` dans `app/globals.css`), TypeScript, vitest (env node, include `lib/**/*.test.ts`), alias `@/*` → racine.

**Portée SP1 :** les 4 composants seed sont des **versions propres, theme-driven** (suffisantes pour prouver la boucle) — la reconstruction **pixel-fidèle** par extraction est le Sous-projet 2. On ne touche à aucun fichier existant sauf un ajout de keyframes dans `app/globals.css`.

---

## Structure des fichiers

**Créer :**
- `lib/foundry/types.ts` — types : `Vibe`, `Skin`, `ComponentManifest`, `Recipe`, `ResolvedSection`, `RecipeValidation`.
- `lib/foundry/vibes.ts` — registre des vibes (`warm-serif`) + `getVibe` + `vibeToCssVars`.
- `lib/foundry/vibes.test.ts` — tests vitest.
- `lib/foundry/manifests.ts` — manifests des 4 composants (data only, sans React) + `getManifest`/`listManifests`.
- `lib/foundry/manifests.test.ts` — tests vitest (cohérence interne des manifests).
- `lib/foundry/recipe.ts` — `validateRecipe(recipe)` → `{ ok, errors, resolved }`.
- `lib/foundry/recipe.test.ts` — tests vitest.
- `components/foundry/primitives.tsx` — primitives DA-aware : `Section`, `Eyebrow`, `Pill`.
- `components/foundry/components/HeroSplitAsym.tsx`
- `components/foundry/components/ServicesRows.tsx`
- `components/foundry/components/TestimonialsCarousel.tsx`
- `components/foundry/components/FooterColumns.tsx`
- `components/foundry/registry.tsx` — map `id → composant React` + garde de parité avec `MANIFESTS`.
- `components/foundry/Assembler.tsx` — `<Assembler recipe>` : pose les vars de vibe + rend les sections.
- `app/foundry-demo/demo-recipe.ts` — la recette écrite à la main.
- `app/foundry-demo/page.tsx` — route de démo qui rend l'Assembler.

**Modifier :**
- `app/globals.css` — ajouter les keyframes `foundry-marquee` et `foundry-rise` (à la fin du fichier).

---

## Task 1 : Types du contrat

**Files:**
- Create: `lib/foundry/types.ts`

- [ ] **Step 1 : Écrire les types**

```ts
// lib/foundry/types.ts
export type VibeId = "warm-serif";

export interface Vibe {
  id: VibeId;
  palette: { ink: string; surface: string; card: string; accent: string; accent2: string; muted: string };
  fonts: { heading: string; body: string };
  radius: { card: string; xl: string; pill: string };
}

export type SkinKey = "accent" | "surface" | "card" | "headingFont";
export type Skin = Partial<Record<SkinKey, string>>;

export interface ComponentManifest {
  id: string;
  role: string;
  description: string;
  whenToUse: string[];
  vibes: VibeId[];
  contentKeys: string[];        // clés de contenu REQUISES
  allowedSkinKeys: SkinKey[];   // clés de peau que ce composant honore
}

export interface RecipeSection {
  component: string;
  content: Record<string, unknown>;
  skin?: Skin;
}

export interface Recipe {
  vibe: VibeId;
  brand?: { primary?: string; logo?: string };
  sections: RecipeSection[];
}

export interface ResolvedSection {
  manifest: ComponentManifest;
  content: Record<string, unknown>;
  skin: Skin;
}

export interface RecipeValidation {
  ok: boolean;
  errors: string[];
  resolved: ResolvedSection[];
}
```

- [ ] **Step 2 : Vérifier la compilation des types**

Run: `cd sitegene && npx tsc --noEmit -p tsconfig.json 2>&1 | grep foundry || echo "OK types"`
Expected: `OK types` (aucune erreur sur foundry).

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add lib/foundry/types.ts && git commit -m "feat(foundry): types du contrat (vibe, skin, manifest, recipe)"
```

---

## Task 2 : Vibe `warm-serif` + `vibeToCssVars`

**Files:**
- Create: `lib/foundry/vibes.ts`
- Test: `lib/foundry/vibes.test.ts`

- [ ] **Step 1 : Écrire le test (échoue)**

```ts
// lib/foundry/vibes.test.ts
import { describe, it, expect } from "vitest";
import { getVibe, vibeToCssVars, VIBES } from "./vibes";

describe("vibes", () => {
  it("expose la vibe warm-serif", () => {
    expect(getVibe("warm-serif")?.palette.accent).toBe("#8d6959");
    expect(getVibe("inconnue")).toBeUndefined();
  });
  it("mappe la vibe en variables CSS", () => {
    const vars = vibeToCssVars(VIBES["warm-serif"]);
    expect(vars["--c-surface"]).toBe("#fcfaf7");
    expect(vars["--font-heading"]).toContain("Castoro");
    expect(vars["--r-card"]).toBe("24px");
  });
  it("la couleur de marque surcharge l'accent", () => {
    const vars = vibeToCssVars(VIBES["warm-serif"], { primary: "#123456" });
    expect(vars["--c-accent"]).toBe("#123456");
  });
});
```

- [ ] **Step 2 : Lancer le test → échoue**

Run: `cd sitegene && npx vitest run lib/foundry/vibes.test.ts`
Expected: FAIL (`Cannot find module './vibes'`).

- [ ] **Step 3 : Écrire l'implémentation**

```ts
// lib/foundry/vibes.ts
import type { Vibe, VibeId } from "./types";

export const VIBES: Record<VibeId, Vibe> = {
  "warm-serif": {
    id: "warm-serif",
    palette: { ink: "#0d0503", surface: "#fcfaf7", card: "#f8f3ec", accent: "#8d6959", accent2: "#e1937d", muted: "#70747a" },
    fonts: { heading: "Castoro, Georgia, serif", body: "Nunito, system-ui, sans-serif" },
    radius: { card: "24px", xl: "32px", pill: "999px" },
  },
};

export function getVibe(id: string): Vibe | undefined {
  return (VIBES as Record<string, Vibe>)[id];
}

export function vibeToCssVars(vibe: Vibe, brand?: { primary?: string }): Record<string, string> {
  return {
    "--c-ink": vibe.palette.ink,
    "--c-surface": vibe.palette.surface,
    "--c-card": vibe.palette.card,
    "--c-accent": brand?.primary || vibe.palette.accent,
    "--c-accent2": vibe.palette.accent2,
    "--c-muted": vibe.palette.muted,
    "--font-heading": vibe.fonts.heading,
    "--font-body": vibe.fonts.body,
    "--r-card": vibe.radius.card,
    "--r-xl": vibe.radius.xl,
    "--r-pill": vibe.radius.pill,
  };
}
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `cd sitegene && npx vitest run lib/foundry/vibes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
cd sitegene && git add lib/foundry/vibes.ts lib/foundry/vibes.test.ts && git commit -m "feat(foundry): vibe warm-serif + vibeToCssVars"
```

---

## Task 3 : Manifests des 4 composants seed

**Files:**
- Create: `lib/foundry/manifests.ts`
- Test: `lib/foundry/manifests.test.ts`

- [ ] **Step 1 : Écrire le test (échoue)**

```ts
// lib/foundry/manifests.test.ts
import { describe, it, expect } from "vitest";
import { MANIFESTS, getManifest, listManifests } from "./manifests";

describe("manifests", () => {
  it("contient les 4 composants seed", () => {
    expect(listManifests().map((m) => m.id).sort()).toEqual(
      ["footer-columns", "hero-split-asym", "services-rows", "testimonials-carousel"]
    );
  });
  it("chaque manifest est cohérent", () => {
    for (const m of listManifests()) {
      expect(m.description.length).toBeGreaterThan(10);
      expect(m.whenToUse.length).toBeGreaterThan(0);
      expect(m.vibes).toContain("warm-serif");
      expect(m.contentKeys.length).toBeGreaterThan(0);
      expect(m.id).toBe(getManifest(m.id)!.id);
    }
  });
});
```

- [ ] **Step 2 : Lancer → échoue**

Run: `cd sitegene && npx vitest run lib/foundry/manifests.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Écrire l'implémentation**

```ts
// lib/foundry/manifests.ts
import type { ComponentManifest } from "./types";

export const MANIFESTS: Record<string, ComponentManifest> = {
  "hero-split-asym": {
    id: "hero-split-asym",
    role: "hero",
    description: "Hero 3 colonnes : accroche + preuve sociale (avatars) à gauche, grande photo au centre, mini-bloc + 2e photo à droite.",
    whenToUse: ["forte preuve sociale", "métier visuel/humain (coach, photographe, bien-être)", "hero riche premium"],
    vibes: ["warm-serif"],
    contentKeys: ["badge", "title", "subtitle", "cta", "proofCount", "proofLabel", "image", "image2", "avatars"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "services-rows": {
    id: "services-rows",
    role: "services",
    description: "Liste de services en grandes lignes numérotées (numéro + titre + description), séparées par des filets.",
    whenToUse: ["présenter 3 à 6 offres", "métier orienté prestations (coach, artisan)"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "testimonials-carousel": {
    id: "testimonials-carousel",
    role: "testimonials",
    description: "Carrousel de cartes-avis en défilement continu (marquee) : citation, avatar, nom, rôle.",
    whenToUse: ["au moins 3 témoignages clients", "renforcer la confiance"],
    vibes: ["warm-serif"],
    contentKeys: ["eyebrow", "title", "items"],
    allowedSkinKeys: ["accent", "surface"],
  },
  "footer-columns": {
    id: "footer-columns",
    role: "footer",
    description: "Footer en colonnes : marque + tagline, liens, contact ; barre basse copyright.",
    whenToUse: ["clôture de page (toujours)"],
    vibes: ["warm-serif"],
    contentKeys: ["brand", "tagline", "columns", "copyright"],
    allowedSkinKeys: ["surface"],
  },
};

export function getManifest(id: string): ComponentManifest | undefined {
  return MANIFESTS[id];
}
export function listManifests(): ComponentManifest[] {
  return Object.values(MANIFESTS);
}
```

- [ ] **Step 4 : Lancer → passe**

Run: `cd sitegene && npx vitest run lib/foundry/manifests.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
cd sitegene && git add lib/foundry/manifests.ts lib/foundry/manifests.test.ts && git commit -m "feat(foundry): manifests des 4 composants seed"
```

---

## Task 4 : Validation & résolution de recette

**Files:**
- Create: `lib/foundry/recipe.ts`
- Test: `lib/foundry/recipe.test.ts`

- [ ] **Step 1 : Écrire le test (échoue)**

```ts
// lib/foundry/recipe.test.ts
import { describe, it, expect } from "vitest";
import { validateRecipe } from "./recipe";
import type { Recipe } from "./types";

const base: Recipe = {
  vibe: "warm-serif",
  sections: [
    { component: "footer-columns", content: { brand: "X", tagline: "t", columns: [], copyright: "c" } },
  ],
};

describe("validateRecipe", () => {
  it("valide une recette correcte", () => {
    const v = validateRecipe(base);
    expect(v.ok).toBe(true);
    expect(v.resolved).toHaveLength(1);
    expect(v.resolved[0].manifest.id).toBe("footer-columns");
  });
  it("rejette une vibe inconnue", () => {
    const v = validateRecipe({ ...base, vibe: "nope" as Recipe["vibe"] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("vibe");
  });
  it("rejette un composant inconnu", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "ghost", content: {} }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("composant inconnu");
  });
  it("rejette un contenu manquant", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X" } }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("contenu manquant");
  });
  it("rejette une clé de skin non autorisée", () => {
    const v = validateRecipe({ ...base, sections: [{ component: "footer-columns", content: { brand: "X", tagline: "t", columns: [], copyright: "c" }, skin: { accent: "#000" } }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toContain("non autorisé");
  });
});
```

- [ ] **Step 2 : Lancer → échoue**

Run: `cd sitegene && npx vitest run lib/foundry/recipe.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Écrire l'implémentation**

```ts
// lib/foundry/recipe.ts
import { getVibe } from "./vibes";
import { getManifest } from "./manifests";
import type { Recipe, RecipeValidation, ResolvedSection, SkinKey } from "./types";

export function validateRecipe(recipe: Recipe): RecipeValidation {
  const errors: string[] = [];
  const resolved: ResolvedSection[] = [];
  const vibeOk = !!getVibe(recipe.vibe);
  if (!vibeOk) errors.push(`vibe inconnue : ${recipe.vibe}`);

  recipe.sections.forEach((s, i) => {
    const m = getManifest(s.component);
    if (!m) {
      errors.push(`composant inconnu [${i}] : ${s.component}`);
      return;
    }
    if (vibeOk && !m.vibes.includes(recipe.vibe)) {
      errors.push(`[${i}] ${s.component} : non testé pour la vibe ${recipe.vibe}`);
    }
    for (const k of m.contentKeys) {
      if (!(k in s.content)) errors.push(`[${i}] ${s.component} : contenu manquant '${k}'`);
    }
    const skin = s.skin ?? {};
    for (const k of Object.keys(skin)) {
      if (!m.allowedSkinKeys.includes(k as SkinKey)) {
        errors.push(`[${i}] ${s.component} : skin '${k}' non autorisé`);
      }
    }
    resolved.push({ manifest: m, content: s.content, skin });
  });

  return { ok: errors.length === 0, errors, resolved };
}
```

- [ ] **Step 4 : Lancer → passe**

Run: `cd sitegene && npx vitest run lib/foundry/recipe.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
cd sitegene && git add lib/foundry/recipe.ts lib/foundry/recipe.test.ts && git commit -m "feat(foundry): validation + résolution de recette"
```

---

## Task 5 : Keyframes globales + primitives DA-aware

**Files:**
- Modify: `app/globals.css` (ajout en fin de fichier)
- Create: `components/foundry/primitives.tsx`

- [ ] **Step 1 : Ajouter les keyframes à la fin de `app/globals.css`**

```css
/* ===== Foundry (SP1) ===== */
@keyframes foundry-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
.foundry-marquee { animation: foundry-marquee 40s linear infinite }
.foundry-marquee:hover { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) { .foundry-marquee { animation: none } }
```

- [ ] **Step 2 : Écrire les primitives**

```tsx
// components/foundry/primitives.tsx
import type { ReactNode } from "react";

/** Section : fond pilotable par la vibe (surface | card), padding généreux. */
export function Section({ id, surface = "surface", children, className = "" }: { id?: string; surface?: "surface" | "card"; children: ReactNode; className?: string }) {
  const bg = surface === "card" ? "var(--c-card)" : "var(--c-surface)";
  return (
    <section id={id} className={`px-5 py-16 md:py-24 ${className}`} style={{ background: bg }}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

/** Éyebrow : petite étiquette, point accent + libellé. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--c-accent)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-accent2)" }} />
      {children}
    </p>
  );
}

/** Pill : pastille pleine accent (CTA) ou contour. */
export function Pill({ href = "#", children, variant = "solid" }: { href?: string; children: ReactNode; variant?: "solid" | "ghost" }) {
  const style = variant === "solid"
    ? { background: "var(--c-accent)", color: "#fff" }
    : { border: "1px solid color-mix(in srgb, var(--c-accent) 30%, transparent)", color: "var(--c-ink)" };
  return (
    <a href={href} className="inline-flex items-center rounded-[var(--r-pill)] px-6 py-3 text-sm font-bold transition hover:brightness-95" style={style}>
      {children}
    </a>
  );
}
```

- [ ] **Step 3 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "components/foundry/primitives" || echo "OK primitives"`
Expected: `OK primitives`.

- [ ] **Step 4 : Commit**

```bash
cd sitegene && git add app/globals.css components/foundry/primitives.tsx && git commit -m "feat(foundry): keyframes globales + primitives DA-aware"
```

---

## Task 6 : Composant `HeroSplitAsym`

**Files:**
- Create: `components/foundry/components/HeroSplitAsym.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// components/foundry/components/HeroSplitAsym.tsx
import type { Skin } from "@/lib/foundry/types";

interface HeroContent {
  badge: string; title: string; subtitle: string; cta: string;
  proofCount: string; proofLabel: string;
  image: string; image2: string; avatars: string[];
}

export default function HeroSplitAsym({ content, skin }: { content: HeroContent; skin: Skin }) {
  const root: React.CSSProperties = {};
  if (skin.accent) root["--c-accent" as keyof React.CSSProperties] = skin.accent as never;
  return (
    <section className="px-5 pt-28 pb-16 md:pt-36" style={{ background: "var(--c-surface)", ...root }}>
      <div className="mx-auto grid max-w-[1280px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px_320px]">
        {/* gauche */}
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] px-3 py-1.5 text-sm font-bold text-white" style={{ background: "var(--c-accent)" }}>★ {content.badge}</span>
          </div>
          <h1 className="mt-7 max-w-[560px] text-[2.6rem] leading-[1.12] md:text-[4rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-2px" }}>{content.title}</h1>
          <p className="mt-7 max-w-[400px] text-base leading-relaxed" style={{ color: "var(--c-accent)" }}>{content.subtitle}</p>
          <a href="#tarifs" className="mt-8 inline-flex rounded-[var(--r-pill)] px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-95" style={{ background: "var(--c-accent)" }}>{content.cta}</a>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {content.avatars.map((a, i) => (
                <img key={i} src={a} alt="" className="h-10 w-10 rounded-full object-cover ring-2" style={{ borderColor: "var(--c-surface)" }} />
              ))}
            </div>
            <p className="max-w-[210px] text-sm font-bold leading-snug" style={{ color: "var(--c-accent)" }}>
              <span style={{ color: "var(--c-accent2)" }}>{content.proofCount}</span> {content.proofLabel}
            </p>
          </div>
        </div>
        {/* centre */}
        <div className="overflow-hidden rounded-[var(--r-xl)]">
          <img src={content.image} alt="" className="h-[440px] w-full object-cover object-top md:h-[560px]" />
        </div>
        {/* droite */}
        <div className="overflow-hidden rounded-[var(--r-xl)]">
          <img src={content.image2} alt="" className="h-[300px] w-full object-cover md:h-[360px]" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "HeroSplitAsym" || echo "OK hero"`
Expected: `OK hero`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/components/HeroSplitAsym.tsx && git commit -m "feat(foundry): composant HeroSplitAsym"
```

---

## Task 7 : Composant `ServicesRows`

**Files:**
- Create: `components/foundry/components/ServicesRows.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// components/foundry/components/ServicesRows.tsx
import { Section, Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface ServiceItem { n: string; name: string; desc: string }
interface ServicesContent { eyebrow: string; title: string; items: ServiceItem[] }

export default function ServicesRows({ content }: { content: ServicesContent; skin: Skin }) {
  return (
    <Section id="services">
      <Eyebrow>{content.eyebrow}</Eyebrow>
      <h2 className="mt-4 max-w-xl text-[2rem] md:text-[3.2rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>{content.title}</h2>
      <div className="mt-10">
        {content.items.map((it, i) => (
          <div key={i} className="grid items-center gap-4 border-t py-8 md:grid-cols-[80px_1fr_1.2fr]" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)" }}>
            <span className="text-3xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-accent)" }}>{it.n}</span>
            <h3 className="text-[1.6rem] md:text-[2.25rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1px" }}>{it.name}</h3>
            <p style={{ color: "var(--c-accent)" }}>{it.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "ServicesRows" || echo "OK services"`
Expected: `OK services`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/components/ServicesRows.tsx && git commit -m "feat(foundry): composant ServicesRows"
```

---

## Task 8 : Composant `TestimonialsCarousel`

**Files:**
- Create: `components/foundry/components/TestimonialsCarousel.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// components/foundry/components/TestimonialsCarousel.tsx
import { Eyebrow } from "../primitives";
import type { Skin } from "@/lib/foundry/types";

interface Testi { text: string; name: string; role: string; avatar: string }
interface TestiContent { eyebrow: string; title: string; items: Testi[] }

export default function TestimonialsCarousel({ content }: { content: TestiContent; skin: Skin }) {
  const loop = [...content.items, ...content.items];
  return (
    <section id="temoignages" className="overflow-hidden py-16 md:py-24" style={{ background: "var(--c-surface)" }}>
      <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center">
        <div className="flex justify-center"><Eyebrow>{content.eyebrow}</Eyebrow></div>
        <h2 className="mx-auto mt-4 max-w-2xl text-[2rem] md:text-[3.2rem]" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)", letterSpacing: "-1.5px", lineHeight: 1.15 }}>{content.title}</h2>
      </div>
      <div className="overflow-hidden">
        <div className="foundry-marquee flex w-max gap-6 px-3">
          {loop.map((t, i) => (
            <figure key={i} className="w-[360px] shrink-0 rounded-[var(--r-card)] p-8" style={{ background: "var(--c-card)" }}>
              <blockquote className="text-xl leading-relaxed" style={{ color: "var(--c-ink)" }}>« {t.text} »</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <span><span className="block font-bold" style={{ color: "var(--c-accent2)" }}>{t.name}</span><span className="text-sm" style={{ color: "var(--c-accent)" }}>{t.role}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "TestimonialsCarousel" || echo "OK testi"`
Expected: `OK testi`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/components/TestimonialsCarousel.tsx && git commit -m "feat(foundry): composant TestimonialsCarousel"
```

---

## Task 9 : Composant `FooterColumns`

**Files:**
- Create: `components/foundry/components/FooterColumns.tsx`

- [ ] **Step 1 : Écrire le composant**

```tsx
// components/foundry/components/FooterColumns.tsx
import type { Skin } from "@/lib/foundry/types";

interface FooterCol { title: string; links: string[] }
interface FooterContent { brand: string; tagline: string; columns: FooterCol[]; copyright: string }

export default function FooterColumns({ content }: { content: FooterContent; skin: Skin }) {
  return (
    <footer className="px-5 pt-16 pb-8" style={{ background: "var(--c-card)" }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--c-ink)" }}>{content.brand}</span>
          <p className="mt-5 max-w-xs" style={{ color: "var(--c-accent)" }}>{content.tagline}</p>
        </div>
        {content.columns.map((c, i) => (
          <div key={i}>
            <p className="text-lg font-bold" style={{ color: "var(--c-ink)" }}>{c.title}</p>
            <ul className="mt-5 flex flex-col gap-3" style={{ color: "var(--c-accent)" }}>
              {c.links.map((l, j) => (<li key={j}>{l}</li>))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-[1280px] border-t pt-6 text-xs" style={{ borderColor: "color-mix(in srgb, var(--c-accent) 18%, transparent)", color: "var(--c-accent)" }}>{content.copyright}</div>
    </footer>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "FooterColumns" || echo "OK footer"`
Expected: `OK footer`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/components/FooterColumns.tsx && git commit -m "feat(foundry): composant FooterColumns"
```

---

## Task 10 : Registry composants + garde de parité

**Files:**
- Create: `components/foundry/registry.tsx`

- [ ] **Step 1 : Écrire le registry**

```tsx
// components/foundry/registry.tsx
import type { ComponentType } from "react";
import type { Skin } from "@/lib/foundry/types";
import { MANIFESTS } from "@/lib/foundry/manifests";
import HeroSplitAsym from "./components/HeroSplitAsym";
import ServicesRows from "./components/ServicesRows";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import FooterColumns from "./components/FooterColumns";

type FoundryComponent = ComponentType<{ content: any; skin: Skin }>;

export const COMPONENTS: Record<string, FoundryComponent> = {
  "hero-split-asym": HeroSplitAsym as FoundryComponent,
  "services-rows": ServicesRows as FoundryComponent,
  "testimonials-carousel": TestimonialsCarousel as FoundryComponent,
  "footer-columns": FooterColumns as FoundryComponent,
};

// Garde de parité (dev) : tout manifest a un composant et inversement.
if (process.env.NODE_ENV !== "production") {
  const mk = Object.keys(MANIFESTS).sort().join(",");
  const ck = Object.keys(COMPONENTS).sort().join(",");
  if (mk !== ck) console.warn(`[foundry] parité manifest/composant rompue : manifests=[${mk}] composants=[${ck}]`);
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "components/foundry/registry" || echo "OK registry"`
Expected: `OK registry`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/registry.tsx && git commit -m "feat(foundry): registry composants + garde de parité"
```

---

## Task 11 : Assembler

**Files:**
- Create: `components/foundry/Assembler.tsx`

- [ ] **Step 1 : Écrire l'Assembler**

```tsx
// components/foundry/Assembler.tsx
import type { CSSProperties } from "react";
import type { Recipe } from "@/lib/foundry/types";
import { getVibe, vibeToCssVars } from "@/lib/foundry/vibes";
import { validateRecipe } from "@/lib/foundry/recipe";
import { COMPONENTS } from "./registry";

export default function Assembler({ recipe }: { recipe: Recipe }) {
  const vibe = getVibe(recipe.vibe);
  if (!vibe) return <div style={{ padding: 40 }}>Vibe inconnue : {recipe.vibe}</div>;

  const v = validateRecipe(recipe);
  if (!v.ok) {
    return (
      <pre style={{ padding: 24, color: "#b00", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        Recette invalide :{"\n"}{v.errors.join("\n")}
      </pre>
    );
  }

  const vars = vibeToCssVars(vibe, recipe.brand) as unknown as CSSProperties;

  return (
    <div style={{ ...vars, fontFamily: "var(--font-body)", background: "var(--c-surface)", color: "var(--c-ink)", minHeight: "100vh" }}>
      {v.resolved.map((s, i) => {
        const C = COMPONENTS[s.manifest.id];
        return C ? <C key={i} content={s.content} skin={s.skin} /> : null;
      })}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep "Assembler" || echo "OK assembler"`
Expected: `OK assembler`.

- [ ] **Step 3 : Commit**

```bash
cd sitegene && git add components/foundry/Assembler.tsx && git commit -m "feat(foundry): Assembler (recette → site)"
```

---

## Task 12 : Recette de démo + route + rendu réel

**Files:**
- Create: `app/foundry-demo/demo-recipe.ts`
- Create: `app/foundry-demo/page.tsx`

> Les images réutilisent celles déjà déployées en local : `/_templates/sereenity/media/*` (hero.jpg, hero2.jpg, av1–4.jpg). Aucune dépendance externe.

- [ ] **Step 1 : Écrire la recette de démo**

```ts
// app/foundry-demo/demo-recipe.ts
import type { Recipe } from "@/lib/foundry/types";

const M = "/_templates/sereenity/media";

export const demoRecipe: Recipe = {
  vibe: "warm-serif",
  brand: { primary: "#8d6959" },
  sections: [
    {
      component: "hero-split-asym",
      content: {
        badge: "4,9",
        title: "Retrouvez votre équilibre, une séance à la fois.",
        subtitle: "Un accompagnement chaleureux et sur-mesure pour traverser le stress, les doutes et les transitions de vie.",
        cta: "Prendre rendez-vous",
        proofCount: "300+",
        proofLabel: "personnes déjà accompagnées",
        image: `${M}/hero.jpg`,
        image2: `${M}/hero2.jpg`,
        avatars: [`${M}/trio1.jpg`, `${M}/trio2.jpg`, `${M}/trio3.jpg`],
      },
    },
    {
      component: "services-rows",
      content: {
        eyebrow: "Mon accompagnement",
        title: "Comment je vous aide à avancer",
        items: [
          { n: "01", name: "Accompagnement individuel", desc: "Des séances en tête-à-tête pour apprivoiser le stress, l'anxiété ou une période de doute." },
          { n: "02", name: "Accompagnement de couple", desc: "Renouer le dialogue, reconstruire la confiance et traverser les tensions." },
          { n: "03", name: "Famille & parentalité", desc: "Un soutien pour les familles qui traversent un conflit ou un changement." },
        ],
      },
    },
    {
      component: "testimonials-carousel",
      content: {
        eyebrow: "Témoignages",
        title: "Vous n'êtes pas seul",
        items: [
          { text: "L'accompagnement a changé ma vie.", name: "Émilie C.", role: "Accompagnement individuel", avatar: `${M}/av1.jpg` },
          { text: "Je me suis senti écouté et accompagné.", name: "Marc L.", role: "Séances en visio", avatar: `${M}/av2.jpg` },
          { text: "On m'a aidée sans me laisser définir par ma douleur.", name: "Hana M.", role: "Accompagnement du deuil", avatar: `${M}/av3.jpg` },
        ],
      },
    },
    {
      component: "footer-columns",
      content: {
        brand: "Sereenity",
        tagline: "Votre espace pour avancer, grandir et vous sentir compris.",
        columns: [
          { title: "Liens rapides", links: ["Accueil", "À propos", "Services", "Tarifs"] },
          { title: "Me contacter", links: ["bonjour@sereenity.fr", "+33 1 23 45 67 89", "12 rue des Tilleuls, Paris"] },
        ],
        copyright: "© Sereenity. Tous droits réservés.",
      },
    },
  ],
};
```

- [ ] **Step 2 : Écrire la route de démo**

```tsx
// app/foundry-demo/page.tsx
import Assembler from "@/components/foundry/Assembler";
import { demoRecipe } from "./demo-recipe";

export const dynamic = "force-static";

export default function FoundryDemoPage() {
  return <Assembler recipe={demoRecipe} />;
}
```

- [ ] **Step 3 : Vérifier la compilation complète**

Run: `cd sitegene && npx tsc --noEmit 2>&1 | grep -E "foundry|app/foundry-demo" || echo "OK build types"`
Expected: `OK build types`.

- [ ] **Step 4 : Lancer toute la suite de tests foundry**

Run: `cd sitegene && npx vitest run lib/foundry`
Expected: PASS (tous les tests vibes/manifests/recipe).

- [ ] **Step 5 : Rendu réel (vérification visuelle)**

Run: `cd sitegene && npm run dev` puis ouvrir `http://localhost:3000/foundry-demo`
Expected (gate de validation) :
- la page rend un vrai site (hero 3 colonnes + services en lignes + témoignages en marquee + footer) ;
- la DA `warm-serif` est appliquée partout (fond crème, titres serif Castoro, accents terracotta, rayons arrondis) — **sans** avoir touché au code des composants ;
- changer `vibe`/`brand.primary` dans `demo-recipe.ts` re-théme tout le site ;
- retirer une section de la recette retire la section du site (et ajouter une section invalide affiche l'erreur de validation au lieu de casser).

- [ ] **Step 6 : Commit**

```bash
cd sitegene && git add app/foundry-demo/ && git commit -m "feat(foundry): recette de démo + route /foundry-demo (boucle recette→site prouvée)"
```

---

## Definition of Done (SP1)

- `npx vitest run lib/foundry` : vert (types, vibes, manifests, recipe).
- `npx tsc --noEmit` : aucune erreur foundry.
- `/foundry-demo` rend un site complet, beau, sous `warm-serif`, depuis une recette écrite à la main.
- Changer la recette (vibe, marque, sections) change le site sans toucher au code des composants.
- Recette invalide → message d'erreur clair (pas de crash).
