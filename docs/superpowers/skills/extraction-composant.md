# Skill — Extraire un composant d'un site réel vers la library « fonderie »

Process **reproductible** pour verser une section d'un vrai site (clone Framer, site
en place) dans `components/foundry/` comme composant possédé, thémable et achetable.
**On extrait, on n'invente pas.** La qualité se paie une fois, au gate.

## Principe cardinal : INSPECTER, ne jamais deviner
L'échec récurrent = reconstruire de mémoire / d'un résumé. Toujours partir des
**valeurs réelles mesurées** (`getComputedStyle`), jamais d'une impression visuelle.

## Les 5 étapes

### 1. Capturer (inspection)
- Servir le site/clone en local, **injecter une sonde** qui dump, pour la section ciblée :
  `getComputedStyle` de chaque élément (tailles, couleurs, typo, rayons, espacements,
  positions/rect), la **structure DOM**, et les **animations** (transforms/classes au
  scroll, hover, autoplay, marquee). Screenshots desktop+mobile.
- Sortir une **spec fidèle** (structure + styles, PAS les textes — ils sont remplacés).
- ⚠️ Vérifier qu'on capte le BON élément (ex. la carte-avis, pas le fond derrière) —
  c'est l'erreur classique.

### 2. Reconstruire (composant React possédé)
- Écrire le composant propre **à partir de la spec** (valeurs exactes), animations comprises.
- **Recréer les assets** en local/inline (SVG d'icônes/pins, dégradés) → **zéro dépendance**
  au CDN d'origine (Framer). 
- **Theme-driven** : lire la DA via variables CSS (`var(--c-ink)`, `var(--c-accent)`,
  `var(--c-accent2)`, `var(--c-surface)`, `var(--c-card)`, `var(--font-heading)`,
  `var(--r-card)`…). Ne JAMAIS coder les couleurs/typo de la DA en dur (sauf accents
  signature volontaires, ex. couleurs ludiques des pins).
- Server Component par défaut ; `"use client"` seulement si interactivité JS réelle
  (un marquee/reveal CSS n'en a pas besoin).

### 3. Paramétrer (brancher au contrat)
- `content.schema` : extraire tout le texte + images en **slots** (`contentKeys` du manifest).
- `skin` : exposer les tokens de peau éditables (`allowedSkinKeys`).
- **Verrouiller** la structure/layout/JSX/animations (Mistral n'y touche pas).
- Écrire le `manifest` : `id`, `role` (= catégorie : hero/services/reviews/pricing/contact/
  faq/banner/carousel/footer…), **`rarity`** (`common`/`rare`/`epic`, jugement humain :
  common = statique propre ; rare = parti pris design OU anim scroll ; epic = signature
  waouh), `description`, `whenToUse`, `vibes` (testées), `contentKeys`, `allowedSkinKeys`.

### 4. Vérifier (GATE — rien n'entre sans matcher)
- `npx tsc --noEmit` propre + `npx vitest run lib/foundry` vert (parité registry/manifest).
- Rendu réel dans `/foundry-demo` (ou une recette de test) **sous chaque vibe compatible**.
- **Diff visuel** vs l'original : tant que ça ne matche pas, on ne publie pas.

### 5. Publier
- Enregistrer dans `components/foundry/registry.tsx` (import + `COMPONENTS`).
- Mettre à jour le test d'inventaire `lib/foundry/manifests.test.ts`.
- Commit dédié `feat(foundry): extraction — <id> (<rareté>)`.
- ⚠️ **Hygiène git** : `git add` UNIQUEMENT les fichiers du composant (jamais `-A`/`.`) —
  la branche peut contenir du WIP utilisateur.

## Repères de rareté (marketplace)
- **common** : FAQ classique, bandeau, texte, carrousel simple. Propre, « normal ».
- **rare** : avis en notes épinglées, révélation au scroll, hero asymétrique riche.
- **epic** : gros effet signature (à extraire des meilleures sources).

## Plusieurs formes par catégorie
Une même `role` (ex. `reviews`) existe en plusieurs composants/raretés (ex.
`testimonials-carousel` common + `reviews-postit-carousel` rare). Mistral pioche la
forme adaptée à la DA + au budget rareté ; le client peut en échanger une par une autre
(plug-and-play via `ComponentPosition`).

## Exemple fait (référence)
`reviews-postit-carousel` (rare) extrait de Sereenity : capture via dump getComputedStyle
(cartes 387×383 #fff br24, pins SVG colorés, fond pinboard `rgba(243,222,138,.4)`, marquee,
nom en `--c-accent2`) → reconstruit avec pins SVG inline + théming vibe → manifest reviews/rare
→ rendu validé dans /foundry-demo.
