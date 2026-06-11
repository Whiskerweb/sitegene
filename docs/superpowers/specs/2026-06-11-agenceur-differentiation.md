# Diagnostic : Pourquoi Mistral choisit toujours le même hero et les mêmes sections

> Document de diagnostic complet — rédigé le 2026-06-11.  
> Objectif : permettre à une IA tierce de comprendre l'architecture complète et d'implémenter les correctifs sans contexte supplémentaire.

---

## 1. Vue d'ensemble de l'architecture

### Parcours de génération d'un site (tunnel `/creer`)

```
Utilisateur saisit pitch + nom
         ↓
POST /api/foundry/charte   → Mistral génère 3 chartes graphiques (palette + fonts)
         ↓
Utilisateur choisit une charte
         ↓
POST /api/foundry/generate
  → repairCharte(charteSpec)       [lib/foundry/charte.ts]
  → generateRecipe(input, chat)    [lib/foundry/agenceur.ts]
      → buildAgenceurMessages(input)   ← PROMPT MISTRAL
      → chatFn(messages)               ← APPEL MISTRAL
      → parseAgenceurJson(raw)
      → repairRecipe(sections, input)  ← RÉPARATION
      → validateRecipe(recipe)
  → saveRecipeDraft(...)           [lib/foundry/server.ts]
  → recipeCards(recipe)
         ↓
Rendu /a/<siteId>                  [app/a/[siteId]/page.tsx]
  → composants React par section   [components/foundry/...]
```

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `lib/foundry/agenceur.ts` | Génération de recette via Mistral (652 lignes) |
| `lib/foundry/charte.ts` | Génération des 3 chartes graphiques + repairCharte |
| `lib/foundry/vibes.ts` | 17 directions artistiques (DA) avec palette/fonts/traitements |
| `lib/foundry/da-personas.ts` | Affinités vibe ↔ métier (scoring) |
| `lib/foundry/manifests.ts` | Catalogue de 71 composants (core + library) |
| `lib/foundry/types.ts` | Types : `Recipe`, `Vibe`, `ComponentManifest`, `RecipeSection` |
| `lib/foundry/samples.ts` | Données d'exemple par composant (valeurs de remplacement) |
| `lib/foundry/library/` | Composants extraits de sites réels (navbars-a, heroes-a, etc.) |
| `app/api/foundry/generate/route.ts` | Endpoint POST — orchestre la génération |
| `app/api/foundry/charte/route.ts` | Endpoint POST — génère les 3 chartes |

---

## 2. Le problème : Mistral choisit toujours `hero-split-asym`

### Constat observé

Quelle que soit la direction artistique choisie (rock brutalist, rap luxe, restaurant nocturne, coach…), le site généré commence **toujours** par le composant `hero-split-asym` — un hero à 3 colonnes généraliste. Les sections qui suivent changent légèrement dans les textes mais restent structurellement identiques.

---

## 3. Causes racines (par ordre de gravité)

### Cause 1 — CRITIQUE : Hero hardcodé dans le prompt Mistral

**Fichier :** `lib/foundry/agenceur.ts`, ligne 403–404

```
RÈGLES D'ASSEMBLAGE (strictes) :
- "hero-split-asym" toujours en PREMIER. "footer-columns" toujours en DERNIER.
```

Le prompt système dit explicitement à Mistral d'utiliser `hero-split-asym` en premier. Mistral obéit : il n'a aucune liberté sur le choix du hero.

**Fichier :** `lib/foundry/agenceur.ts`, ligne 326 (fonction `repairRecipe`)

```ts
if (heroIdx === -1) {
  sections.unshift({ component: "hero-split-asym", content: normalizeSectionContent("hero-split-asym", {}) });
}
```

Même si Mistral tentait de choisir un autre hero, la fonction `repairRecipe` inject `hero-split-asym` à la place si aucun composant de rôle `hero` n'est présent dans la réponse. Double verrou.

### Cause 2 — CRITIQUE : La DA n'influence que le ton des textes, pas la structure

**Fichier :** `lib/foundry/agenceur.ts`, ligne 423–428 (message `user`)

```ts
const user = `PITCH DU CLIENT : « ${input.brief} »
NOM DE L'ACTIVITÉ : ${input.businessName}
MÉTIER DÉTECTÉ : ${trade}
DIRECTION ARTISTIQUE CHOISIE : ${vibe ? `${vibe.label} (${vibe.mood.join(", ")})` : input.vibeId} — adapte le TON des textes à cette ambiance, pas la structure.

Assemble le site et renvoie le JSON.`;
```

La phrase **"adapte le TON des textes à cette ambiance, pas la structure"** est un verrou explicite : Mistral est instruit de ne PAS changer la structure selon la DA. C'est l'opposé de ce que l'on veut.

### Cause 3 — HAUTE : Les `treatments` définis dans les vibes ne sont pas transmis à Mistral

**Fichier :** `lib/foundry/vibes.ts`

Chaque vibe a un champ `treatments` qui indique le type de hero voulu :

```ts
"rock-brutalist": {
  treatments: { hero: "type-giant" },   // typo XXL, graphique, brutal
  ...
},
"rap-luxe": {
  treatments: { hero: "fullscreen-photo" },  // plein écran, luxe
  ...
},
"mindful-moments": {
  treatments: { hero: "centered-glow" },
  ...
},
"contemporain-editorial": {
  treatments: { hero: "split-editorial" },
  ...
},
```

**Mais dans `buildAgenceurMessages`**, la variable `vibe` n'est utilisée que pour `vibe.label` et `vibe.mood.join(", ")` — le champ `treatments` n'est jamais lu ni transmis à Mistral. L'information de traitement hero est définie mais complètement ignorée.

### Cause 4 — HAUTE : Le catalogue contient 13 composants hero alternatifs jamais sélectionnables

La library (`lib/foundry/library/heroes-a.ts`, `lib/foundry/library/imported-a.ts`, etc.) contient des heroes spécialisés :

| Composant | Rôle déclaré | Pour qui |
|---|---|---|
| `creative-portfolio-hero` | hero | Portfolio sombre, typo XXL |
| `studio-portfolio-hero` | hero | Éditorial, tags flottants |
| `jazz-vocalist-hero` | hero | Musicien N&B, ambiance scène |
| `luxury-wedding-hero` | hero | Mariage haut de gamme N&B |
| `wedding-warm-hero` | hero | Mariage, photo grande, CTA |
| `electrician-pro-hero` | hero | Artisan, avis immédiats |
| `multi-trade-hero` | hero | Artisan sombre, garanties |
| `marquee-hero` | hero | Galerie en défilement |
| `bold-stack-hero` | hero | Maximaliste, typo 3D |
| `plumber-pro-hero` | hero | Plombier, pro |
| `plumber-modern-hero` | hero | Plombier, moderne |
| `plumber-emergency-hero` | hero | Plombier, urgence |

Ces composants sont dans le catalogue envoyé à Mistral. Mais comme le prompt dit `"hero-split-asym" toujours en PREMIER`, Mistral ne les choisira jamais.

### Cause 5 — HAUTE : Les fallbacks déterministes utilisent tous `hero-split-asym`

**Fichier :** `lib/foundry/agenceur.ts`, lignes 360–371 (`FALLBACK_PLANS`)

```ts
const FALLBACK_PLANS: Record<TradeId, string[]> = {
  coach:      ["hero-split-asym", ...],
  "bien-etre":["hero-split-asym", ...],
  photographe:["hero-split-asym", ...],
  artisan:    ["hero-split-asym", ...],
  restaurant: ["hero-split-asym", ...],
  beaute:     ["hero-split-asym", ...],
  conseil:    ["hero-split-asym", ...],
  musicien:   ["hero-split-asym", ...],
  fitness:    ["hero-split-asym", ...],
  autre:      ["hero-split-asym", ...],
};
```

Même quand l'IA échoue et qu'on tombe sur le repli déterministe, tous les 10 métiers utilisent `hero-split-asym`. Aucun n'utilise de hero spécialisé.

### Cause 6 — MOYENNE : `da-personas.ts` n'est jamais utilisé pendant l'assemblage

**Fichier :** `lib/foundry/da-personas.ts`

Ce fichier définit les affinités vibe ↔ métier avec des scores précis :
```ts
musicien + rap → rap-luxe (score 95)
musicien + rock → rock-brutalist (score 95)
photographe → photographe-galerie (score 95)
restaurant → restaurant-nocturne (score 95)
```

Mais la fonction `rankVibesForTrade()` de ce fichier n'est **jamais appelée** dans `agenceur.ts`. Ces données d'affinité ne sont utilisées que dans le tunnel côté DA (choix de chartes), jamais pour guider la sélection de composants.

### Cause 7 — MOYENNE : Le catalogue entier (71 composants) est envoyé sans filtrage par métier/vibe

**Fichier :** `lib/foundry/agenceur.ts`, fonction `catalogForPrompt()` (ligne 383)

```ts
function catalogForPrompt(): string {
  return listManifests()
    .map((m) => { ... })
    .join("\n\n");
}
```

`listManifests()` retourne les 71 composants sans aucun filtrage. Mistral reçoit des composants de plombier (`plumber-pro-hero`) quand on génère un site de photographe, des composants de mariage pour un artisan, etc. Cela noie les signaux pertinents et pousse Mistral vers le composant le plus générique et le plus "sûr" (`hero-split-asym`).

### Cause 8 — FAIBLE : Température Mistral non documentée

Le client Mistral (`lib/mistral.ts`) utilise probablement une température fixe non adaptée par use case. Une température basse (0.0–0.3) aggrave la tendance à choisir le composant le plus probable (le plus cité dans l'entraînement = le plus générique).

---

## 4. Preuve par le code : flux exact du message envoyé à Mistral

Voici exactement ce que Mistral reçoit aujourd'hui pour un musicien rock (résumé) :

**Message système :**
```
Tu es l'ARCHITECTE-AGENCEUR d'Akyra...

RÈGLES D'ASSEMBLAGE (strictes) :
- Entre 6 et 9 sections + le footer.
- "hero-split-asym" toujours en PREMIER. "footer-columns" toujours en DERNIER.
- ...

CATALOGUE :
### hero-split-asym
rôle: hero · rareté: rare
description: Hero 3 colonnes : accroche + preuve sociale...
...

### creative-portfolio-hero
rôle: hero · rareté: ...
description: ...
...
[71 composants en tout]
```

**Message utilisateur :**
```
PITCH DU CLIENT : « Je suis guitariste dans un groupe de metal à Paris »
NOM DE L'ACTIVITÉ : Dark Riff
MÉTIER DÉTECTÉ : musicien
DIRECTION ARTISTIQUE CHOISIE : Rock Brutalist (brutal, acide, scène) — adapte le TON des textes à cette ambiance, pas la structure.

Assemble le site et renvoie le JSON.
```

**Résultat :** Mistral retourne `hero-split-asym` en premier (il n'a pas le choix), écrit des textes avec un ton "rock" mais la structure est identique à un site de coach.

---

## 5. Architecture cible : ce qui doit changer

### Principe directeur

La DA (vibe) doit piloter **à la fois** :
1. La palette / fonts (déjà fait via `repairCharte`)
2. Le **type de hero** (traitement visuel + composant choisi)
3. Le **rythme de la page** (sections design vs sections conversion)
4. Les composants de sections disponibles (filtrage par pertinence métier)

### Changement 1 — Libérer le choix du hero dans le prompt

**Dans `buildAgenceurMessages` (agenceur.ts, ligne 403) :**

Remplacer :
```
- "hero-split-asym" toujours en PREMIER. "footer-columns" toujours en DERNIER.
```

Par :
```
- Une section de rôle "hero" toujours en PREMIER (choisis le hero le plus adapté au métier et à la DA parmi la liste ci-dessous). "footer-columns" toujours en DERNIER.
- HEROES AUTORISÉS POUR CE CONTEXTE : [liste filtrée par trade+vibe, voir Changement 4]
```

### Changement 2 — Injecter les `treatments` dans le message utilisateur

**Dans la fonction `buildAgenceurMessages`, message `user` :**

Remplacer :
```ts
const user = `...
DIRECTION ARTISTIQUE CHOISIE : ${vibe.label} (${vibe.mood.join(", ")}) — adapte le TON des textes à cette ambiance, pas la structure.
...`;
```

Par :
```ts
const heroTreatment = vibe?.treatments?.hero;
const treatmentNote = heroTreatment
  ? `Le traitement hero imposé par cette DA est "${heroTreatment}" — choisis le composant hero qui correspond à ce traitement.`
  : "";

const user = `...
DIRECTION ARTISTIQUE CHOISIE : ${vibe.label} (${vibe.mood.join(", ")})
${treatmentNote}
La DA pilote à la fois le ton des textes ET la sélection des composants visuels (hero, sections design).
...`;
```

### Changement 3 — Créer un mapping trade+vibe → hero recommandé

Créer un fichier `lib/foundry/hero-router.ts` :

```ts
// Chaque entrée : trade → { default: heroId, overrides: { vibePattern: heroId } }
// vibePattern : regex ou liste de vibeIds
export const HERO_ROUTER: Record<TradeId, { default: string; overrides?: Array<{ vibes: VibeId[]; hero: string }> }> = {
  musicien: {
    default: "jazz-vocalist-hero",
    overrides: [
      { vibes: ["rock-brutalist"], hero: "creative-portfolio-hero" },
      { vibes: ["rap-luxe"],       hero: "bold-stack-hero" },
    ],
  },
  photographe: {
    default: "studio-portfolio-hero",
    overrides: [
      { vibes: ["photographe-galerie", "encre-editoriale"], hero: "studio-portfolio-hero" },
      { vibes: ["warm-serif", "contemporain-editorial"],    hero: "luxury-wedding-hero" },
    ],
  },
  artisan: {
    default: "electrician-pro-hero",
    overrides: [
      { vibes: ["ocean-confiance", "mineral-precis"], hero: "plumber-pro-hero" },
      { vibes: ["lexicon-creators"],                  hero: "multi-trade-hero" },
    ],
  },
  restaurant: {
    default: "hero-split-asym",  // pas encore de hero restaurant dédié
  },
  coach: {
    default: "hero-split-asym",
  },
  "bien-etre": {
    default: "hero-split-asym",
  },
  beaute: {
    default: "hero-split-asym",
  },
  fitness: {
    default: "hero-split-asym",
  },
  conseil: {
    default: "hero-split-asym",
  },
  autre: {
    default: "hero-split-asym",
  },
};

export function resolveHero(trade: TradeId, vibeId: string): string {
  const router = HERO_ROUTER[trade] ?? HERO_ROUTER.autre;
  if (router.overrides) {
    for (const o of router.overrides) {
      if (o.vibes.includes(vibeId as VibeId)) return o.hero;
    }
  }
  return router.default;
}
```

### Changement 4 — Filtrer le catalogue selon trade + vibe

**Remplacer `catalogForPrompt()` par `catalogForPrompt(trade, vibeId)` :**

```ts
function catalogForPrompt(trade: TradeId, vibeId: string): string {
  const all = listManifests();

  // Heros : seulement le hero recommandé + hero-split-asym en repli
  const recommendedHero = resolveHero(trade, vibeId);
  const allowedHeroIds = new Set([recommendedHero, "hero-split-asym"]);

  // Sections : exclure les composants trop spécialisés pour d'autres métiers
  const excluded = getExcludedForTrade(trade); // Set<string> — ex: plumber-* pour musicien

  return all
    .filter((m) => {
      if (m.role === "hero") return allowedHeroIds.has(m.id);
      if (excluded.has(m.id)) return false;
      return true;
    })
    .map((m) => {
      const sample = JSON.stringify(getSample(m.id));
      const recommended = m.id === recommendedHero ? " ← HERO RECOMMANDÉ POUR CE CONTEXTE" : "";
      return [
        `### ${m.id}${recommended}`,
        `rôle: ${m.role} · rareté: ${m.rarity}`,
        `description: ${m.description}`,
        `quand l'utiliser: ${m.whenToUse.join(" ; ")}`,
        `exemple de "content" : ${sample}`,
      ].join("\n");
    })
    .join("\n\n");
}
```

### Changement 5 — Mettre à jour `repairRecipe` pour ne plus hardcoder `hero-split-asym`

**Dans `repairRecipe` (agenceur.ts, ligne 326) :**

Remplacer :
```ts
if (heroIdx === -1) {
  sections.unshift({ component: "hero-split-asym", content: normalizeSectionContent("hero-split-asym", {}) });
}
```

Par :
```ts
if (heroIdx === -1) {
  const trade = detectTrade(input.brief).trade;
  const vibeId = input.customVibe?.id ?? input.vibeId;
  const heroId = resolveHero(trade, vibeId);
  sections.unshift({ component: heroId, content: normalizeSectionContent(heroId, {}) });
}
```

### Changement 6 — Mettre à jour les `FALLBACK_PLANS` par métier

Chaque plan de secours doit utiliser le hero le plus approprié :

```ts
const FALLBACK_PLANS: Record<TradeId, string[]> = {
  musicien:    ["jazz-vocalist-hero",    "intro-split", "services-rows", "stats-countup", "testimonials-carousel", "contact-block", "cta-banner", "footer-columns"],
  photographe: ["studio-portfolio-hero", "gallery-mosaic", "intro-split", "stats-countup", "testimonials-carousel", "contact-block", "cta-banner", "footer-columns"],
  artisan:     ["electrician-pro-hero",  "intro-split", "services-rows", "process-steps", "stats-countup", "testimonials-carousel", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  coach:       ["hero-split-asym",       "logo-marquee", "intro-split", "services-rows", "process-steps", "stats-countup", "reviews-postit-carousel", "pricing-cards", "faq-accordion", "contact-block", "cta-banner", "footer-columns"],
  // ... autres métiers
};
```

### Changement 7 — Sections design spécifiques par DA dans le prompt

Enrichir la règle `RÈGLES D'ASSEMBLAGE` avec une note sur les sections design selon la DA :

```ts
const daStructureNote = vibe?.treatments?.hero
  ? `Pour la DA "${vibe.label}" : inclure au moins UNE section design (parallax-strip, marquee-words, quote-spotlight, gallery-mosaic) pour rythmer la page — cette DA a un fort caractère visuel.`
  : "";

// Injecter dans le system prompt après les règles d'assemblage
```

---

## 6. Plan d'implémentation priorisé

### Priorité 1 — Impact immédiat (1–2h)

1. **Supprimer le hardcode `hero-split-asym` dans le prompt** (`agenceur.ts` ligne 403)  
   → Remplacer par "une section hero, choisis le plus adapté"

2. **Changer "adapte le TON, pas la structure"** (`agenceur.ts` ligne 426)  
   → Remplacer par "la DA pilote ton ET structure"

3. **Injecter `vibe.treatments.hero` dans le message utilisateur**  
   → Ajouter 3 lignes de code dans `buildAgenceurMessages`

### Priorité 2 — Différenciation réelle (2–4h)

4. **Créer `lib/foundry/hero-router.ts`** — mapping trade+vibe → hero

5. **Mettre à jour `catalogForPrompt(trade, vibeId)`** — filtrer les heroes

6. **Mettre à jour `repairRecipe`** — utiliser `resolveHero()` au lieu de hardcoder

7. **Mettre à jour `FALLBACK_PLANS`** — heroes adaptés par métier

### Priorité 3 — Affinement (4–8h)

8. **Créer `getExcludedForTrade(trade)`** — exclure composants hors contexte

9. **Ajouter note sections-design dans le prompt** selon `treatments`

10. **Utiliser `da-personas.rankVibesForTrade()`** pour affiner le filtrage catalogue

---

## 7. Composants navbars disponibles (bonus : navbar aussi homogène)

La même analyse s'applique aux navbars. `lib/foundry/library/navbars-a.ts` définit 9 navbars spécialisées :

| Composant | Pour qui |
|---|---|
| `glass-pill-navbar` | SaaS moderne |
| `app-bar-navbar` | SaaS classique |
| `pill-menu-navbar` | E-learning |
| `chip-links-navbar` | Voyage |
| `ink-bar-navbar` | Musicien sombre premium |
| `split-wordmark-navbar` | Musicien symétrique |
| `studio-clock-navbar` | Portfolio, horloge locale |
| `ticker-navbar` | Événement, bandeau défilant |
| `wordmark-navbar` | Photographe typographique |

Ces navbars sont dans le catalogue mais la même logique s'applique : Mistral n'est pas guidé vers la bonne navbar. Un mapping `trade+vibe → navbar` similaire au `hero-router.ts` devrait être créé.

---

## 8. Résumé des fichiers à modifier

| Fichier | Action | Priorité |
|---|---|---|
| `lib/foundry/agenceur.ts` | Supprimer hardcode hero, changer instruction DA, injecter treatments, MAJ catalogForPrompt + repairRecipe + FALLBACK_PLANS | P1+P2 |
| `lib/foundry/hero-router.ts` | **CRÉER** — mapping trade+vibe → heroId | P2 |
| `lib/foundry/vibes.ts` | Vérifier/compléter le champ `treatments.hero` pour toutes les 17 vibes | P2 |
| `lib/foundry/agenceur.test.ts` | Tests : `resolveHero("musicien", "rock-brutalist") === "creative-portfolio-hero"` | P2 |

---

## 9. Tests de validation post-implémentation

```bash
# Test unitaire hero-router
npx vitest run lib/foundry/hero-router.test.ts

# Test agenceur (que le hero varie selon trade+vibe)
npx vitest run lib/foundry/agenceur.test.ts

# Vérification types
npx tsc --noEmit

# Test manuel E2E
# 1. Pitch "guitariste metal Paris" → DA rock-brutalist → hero doit être creative-portfolio-hero ou bold-stack-hero
# 2. Pitch "photographe mariage" → DA photographe-galerie → hero doit être studio-portfolio-hero
# 3. Pitch "coach développement perso" → DA coach-performance → hero peut rester hero-split-asym (pas de hero coach dédié)
# 4. Pitch "restaurant gastronomique" → DA restaurant-nocturne → hero doit changer vs coach
```

---

## 10. Ce qui n'est PAS dans ce document

- La correction des chartes graphiques (dark mode pour musicien) — déjà implémentée dans `lib/foundry/charte.ts`
- La collecte de liens/photos — déjà implémentée dans `lib/foundry/inject.ts` + `CollectStep.tsx`
- La génération spéculative — déjà implémentée dans `CreerClient.tsx`
- Le rendu des composants hero alternatifs — ils existent déjà dans `components/foundry/library/heroes-a.tsx`

Les composants hero de la library sont **déjà rendables**, **déjà dans le catalogue**. Il suffit de débloquer leur sélection par Mistral.
