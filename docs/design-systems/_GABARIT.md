# Gabarit — design-system.md d'un template

> Un `design-system.md` est un **prompt exécutable par Mistral** : il doit contenir
> assez de précision pour que l'IA RECONSTRUISE le site (header en priorité) au
> millimètre, ET assez de règles pour qu'elle l'ADAPTE à un client sans dériver
> vers du générique. Il vit dans `public/_templates/<id>/design-system.md`.

## Décisions produit (cadre cible)

- **Génération** : le site est généré par l'IA **une seule fois, à l'activation
  du thème** par le client, puis stocké et servi statiquement (pas de
  régénération à chaque édition).
- **Édition** : le HTML généré doit rester éditable par l'éditeur WYSIWYG actuel.
  Donc chaque texte/image modifiable porte les attributs **`data-sg-path="…"`**
  (texte) et **`data-sg-img="…"`** (image), exactement comme les templates
  figés. Les chemins suivent la structure de contenu du métier
  (ex. `hero.title`, `services.items[0].title`, `services.items[0].image`).
  → cette exigence est rappelée dans la section « Règles d'adaptation » de chaque
  design system et dans le prompt système de génération.

## Règles d'écriture

- **Écrire pour Mistral** : impératif, concret, zéro ambiguïté. Chaque classe
  Tailwind structurante est citée littéralement (`text-5xl md:text-6xl lg:text-7xl`),
  jamais paraphrasée (« grand titre »).
- **Le header d'abord** : c'est la signature du template. Sa section doit permettre
  une reconstruction pixel-perfect : structure DOM exacte, classes complètes,
  contenus, espacements, états hover, responsive.
- **Tout le reste ensuite**, section par section, avec le même vocabulaire mais une
  granularité légèrement moindre (structure + classes clés + spécificités).
- **Les tokens en tête** : la palette et la typo sont définies UNE fois (config
  Tailwind inline) et référencées partout par leur nom (`primary`, `ink`, `muted`).

## Animations (kit partagé)

Un **kit d'animation commun** (`public/_templates/_shared/motion.html`, vanilla JS,
sans dépendance, respecte `prefers-reduced-motion`) est **injecté automatiquement**
dans chaque site généré. Le design system n'a pas à le recopier ; la génération
annote seulement le HTML :
- **`data-anim`** (+ variantes `fade`/`left`/`right`/`scale`, + `data-anim-delay`
  en ms pour le stagger) sur les blocs qui apparaissent au scroll → fondu + montée.
- **`anim-words`** sur le grand titre du hero → apparition mot à mot.
- **`data-count="<n>"`** (+ `data-count-suffix`, `data-count-decimals`) sur chaque
  chiffre de statistique → compteur animé de 0 à la valeur quand il entre à l'écran.

Le kit révèle les éléments via `IntersectionObserver` ; en `prefers-reduced-motion`
ou sans IO, tout s'affiche immédiatement (accessibilité). Pour une capture pleine
page, tout est dans le viewport → tout se révèle.

## Sections obligatoires (dans cet ordre)

1. **ADN** — 2-3 phrases : intention visuelle, émotion, à qui ça parle, ce qui
   distingue ce template de tous les autres.
2. **Tokens** — le bloc `tailwind.config` exact (couleurs hex + usage commenté,
   fontFamily, borderRadius custom) + les polices Google Fonts (familles, graisses)
   + le CSS custom global (background décoratif, underline nav, etc., code inclus).
3. **HEADER (signature)** — exhaustif, en deux blocs :
   - **NAV** : position (sticky/fixe), fond, structure flex, logo (forme, icône,
     taille), liens (nombre, ordre, classes, état actif, effet hover au code près),
     CTA (forme, couleurs, padding), responsive (ce qui disparaît sous md).
   - **HERO** : composition d'ensemble (centré/asymétrique), chaque élément dans
     l'ordre DOM avec ses classes complètes : badge/rating, H1 (tailles responsive,
     max-width, line-height, tracking), tagline, CTA, visuel (dimensions, radius,
     ombre, badges flottants positionnés), fond décoratif (code CSS).
   - **Ce qui fait sa signature** : 3-5 puces nommant les détails distinctifs à ne
     jamais perdre lors d'une adaptation.
4. **Sections du corps** — pour chaque section (ordre du DOM) : rôle, conteneur
   (`max-w-*`), pattern d'en-tête de section, grille (`grid-cols-*`, gaps),
   anatomie d'une carte/item type avec classes, spécificités (badges, hover,
   accordéon…).
5. **Ton éditorial** — registre, longueur type par champ (H1 ≤ N car, tagline 1-2
   phrases…), vocabulaire métier, ce qu'on ne dit jamais.
6. **Règles d'adaptation & verrous** — ce que Mistral PEUT adapter (textes, images,
   nb d'items dans les grilles, ajouter/retirer une section du corps…), ce qui est
   VERROUILLÉ (tokens, structure du header, effets hover, radius), et comment
   intégrer une demande hors-cadre en restant dans la DA.

## Critère de validation d'un design-system.md

Mistral, recevant CE document seul (sans le HTML original), doit produire un
header dont le rendu est visuellement indiscernable de l'original — puis savoir
l'adapter à un brief client sans casser la signature. Testé via
`scripts/test-design-system.mjs` avant approbation.
