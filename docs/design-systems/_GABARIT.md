# Gabarit — design-system.md d'un template

> Un `design-system.md` est un **prompt exécutable par Mistral** : il doit contenir
> assez de précision pour que l'IA RECONSTRUISE le site (header en priorité) au
> millimètre, ET assez de règles pour qu'elle l'ADAPTE à un client sans dériver
> vers du générique. Il vit dans `public/_templates/<id>/design-system.md`.

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
