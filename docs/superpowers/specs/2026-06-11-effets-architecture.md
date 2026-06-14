# Architecture des effets — fonderie (11 juin 2026)

## Le constat : « effet » recouvre 2 choses très différentes

1. **Faux effets = des SECTIONS déguisées.** `circular-testimonials`,
   `stagger-testimonials`, `shuffle-testimonials`, `display-cards` sont des
   composants React qui sont en réalité des sections (avis, galerie). Ils n'ont
   rien d'« effet » — ce sont des blocs, à fort parti pris visuel.

2. **Vrais effets = des COMPORTEMENTS posés sur une section.** Ce qui n'existe
   pas encore proprement : l'animation d'entrée au scroll (une section qui
   apparaît en fondu/monte/zoome), le type de défilement (natif, fluide,
   inertie/snap), la parallaxe. Ce sont des **modificateurs transverses**, pas
   des composants.

Les `lib/effects` actuels (soft-glow, parallax-image, container-scroll,
floating-tags) sont du CSS/JS vanilla pour l'injection dans les templates —
**l'ancien monde**. Ils ne rentrent pas dans la fonderie tels quels.

## La décision

### A. Les « faux effets » deviennent des sections
On les ré-extrait au contrat foundry `{content, skin}`, avec un rôle
(reviews, gallery), une rareté, un sample — exactement comme les autres
sections. Ils disparaissent de la notion d'« effet ». Dans L'Atelier, ce sont
des blocs. (→ fait pendant l'extraction massive.)

### B. Les « vrais effets » = une couche d'ANIMATION générique
C'est le cœur. Un effet n'est PAS un composant : c'est une propriété attachée
à une section (ou au site), appliquée par un **wrapper générique** — donc qui
marche sur N'IMPORTE QUELLE section sans toucher à son code.

**Modèle de données (recette) :**
```ts
RecipeSection.fx?: {
  reveal?: "none" | "fade" | "rise" | "zoom" | "slide-left" | "slide-right";
  delay?: number;        // ms (cascade)
  stagger?: boolean;     // anime les enfants en cascade
}
Recipe.fx?: {
  scroll?: "native" | "smooth" | "snap";   // défilement global
}
```

**Rendu (Assembler) :**
- chaque section est enveloppée d'un `<Reveal fx>` — composant `"use client"` à
  IntersectionObserver qui applique l'animation d'entrée (keyframes CSS sur
  `transform`/`opacity` uniquement, donc 60 fps) une fois la section visible ;
- le défilement global est posé à la racine (le repo a déjà
  `lib/smooth-scroll-runtime.ts`) selon `recipe.fx.scroll`.

**Pourquoi c'est le bon design :**
- ajouter un effet = ajouter une valeur d'enum + un keyframe CSS. **Trivial.**
- zéro duplication : un seul wrapper anime toutes les sections, présentes ET
  futures, extraites ou non ;
- `transform`/`opacity` only → pas de jank ;
- respecte `prefers-reduced-motion`.

### C. Intégration dans L'Atelier
- **Par section** : un petit contrôle « Animation » dans la barre flottante ou
  le panneau de la section → choix de l'entrée (Aucune / Fondu / Montée / Zoom /
  Glissé) + cascade. Aperçu live.
- **Global** : un contrôle « Défilement » dans le panneau Couleurs/Réglages
  (Naturel / Fluide / Par sections).
- Tout est stocké dans la recette → re-rendu identique en preview et en public.

### D. Modèle économique
- Animations de base (fondu, montée) : **incluses**.
- Effets signature (parallaxe, reveals chorégraphiés, curseur) : **rare/epic**,
  vendus comme les composants (l'enum `reveal` peut porter une rareté ; gating
  au moment de l'appliquer, comme un composant).

## Plan d'implémentation (phasé)

1. **Couche animation (les vrais effets)** — le plus utile, ~200 lignes :
   types `fx`, wrapper `<Reveal>` + keyframes, runtime de scroll, contrôles
   éditeur (par section + global). Rend N'IMPORTE quel site vivant immédiatement.
2. **Faux effets → sections** : porter circular/stagger/shuffle-testimonials et
   display-cards dans la library (extraction).
3. **Effets signature premium** : marquer certaines animations rare/epic +
   gating marketplace.

## Recommandation
Faire **la phase 1 d'abord** : c'est « les vrais effets » que le client a
demandés (animation d'entrée au scroll, type de scroll), c'est générique, et ça
transforme le ressenti de tous les sites d'un coup — y compris les composants
« un peu moches » d'aujourd'hui, qui prennent vie une fois animés.
