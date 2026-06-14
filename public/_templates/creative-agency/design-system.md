# Design System — Creative Agency (« Forge »)

Charte graphique du template `creative-agency` (catégorie portfolio / agence).
DA : **noir éditorial à typo écrasante, accent bleu électrique**. Pensée pour
studios créatifs, agences, directeurs artistiques, freelances haut de gamme.

## Palette

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond dominant | `ink` | `#111111` | Fond de page, navbar, sections |
| Panneaux | `coal` | `#1a1a1b` | Cartes, footer, menu plein écran |
| Surface secondaire | `smoke` | `#202020` | Hovers, surfaces tertiaires |
| Texte principal | `paper` | `#ffffff` | Titres, texte fort, inversions |
| Texte atténué | `muted` | `#999999` | Paragraphes, descriptions |
| Texte discret | `faint` | `#5f5f5f` | Numéros, méta secondaires |
| Hairlines | `line` | `rgba(255,255,255,0.14)` | Bordures fines omniprésentes |
| **Accent** | `accent` | `#0099ff` | Étoiles, icônes, hovers, sélection |

Règles : l'accent ne sert JAMAIS de fond de section — uniquement détails
(icônes, étoiles, hover des boutons, point pulsé de l'horloge). Le contraste
vient du blanc sur noir ; le bleu électrise par petites touches.

## Typographies

| Rôle | Fonte | Styles |
|---|---|---|
| Display | **Anton** | Capitales uniquement, `line-height 0.92`, tailles clamp 44→150 px |
| Corps | **Geist** | 300–700, paragraphes 13.5–15 px, `text-muted` |
| Labels / méta | **Geist Mono** | 10–12 px, uppercase, `letter-spacing 0.14em` |

Signature typographique : les **titres de section géants centrés**
(`clamp(44px, 7.5vw, 104px)`), les listes en typo contour
(`-webkit-text-stroke` blanc 28 %, remplissage transparent) qui s'allument
en blanc à l'état actif, et le **wordmark dont le O est un carré plein**.

## Grammaire visuelle

- **Dividers numérotés** entre toutes les sections : hairline haut/bas,
  `[01]` à gauche, label mono à droite (`PORTÉS PAR LA VISION`…).
- **Coins droits partout** (aucun border-radius, sauf avatars ronds).
- **Boutons** : rectangles mono uppercase 12 px — variante bordure hairline
  (hover = fond accent, texte ink) et variante pleine blanche.
- **Grain** SVG léger (opacité 5 %) sur le hero, décoratif.
- **Photos traitées** : hero en `grayscale contrast-125` (esprit cinéma
  urbain), voiles `bg-ink/xx` par-dessus les images de fond.
- Navbar fixe : wordmark / **heure locale en temps réel** (point accent
  pulsé) / bouton MENU → panneau plein écran coal qui descend.

## Animations (framer-motion + CSS)

| Élément | Effet |
|---|---|
| Lignes du titre hero | Remontée masquée (`y:110%→0`) en cascade 0.10/0.22/0.34 s |
| Photo hero | Fade + dézoom `scale 1.04→1` |
| Mots STUDIO / FORGE (About) | Parallaxe horizontale opposée au scroll (`useScroll`) |
| Sections | `FadeIn` au scroll : fade + montée 28 px, once, ease `[0.21,0.65,0.36,1]` |
| Liste services | Item actif au survol : contour → blanc plein ; image du panneau crossfade (`AnimatePresence`) |
| Cartes projets | **Pile sticky** : chaque carte `position:sticky` à `top: 96+i*36px`, la suivante recouvre la précédente ; mots géants contour sticky derrière |
| Menu plein écran | Slide vertical `y:-100%→0`, ease `[0.76,0,0.24,1]`, liens en cascade |
| Avatars équipe | Hover : élargissement + dé-grisaille |
| Vignettes (showreel, blog) | Zoom doux 1→1.05 au hover, 700 ms |
| Horloge navbar | Tick chaque seconde + point accent pulsé |
| CTA final | Une lettre du titre remplacée par une **vignette image** inline |

## Structure de page (home)

1. `navbar` — fixe, heure locale, menu overlay
2. `hero` — photo N&B 5 col + titre XXL 7 col aligné droite, vignette showreel insérée dans la typo
3. `about` — mots géants en parallaxe + portrait central, paragraphe, réseaux `[ … ]`, rangée équipe
4. `services` — liste typo géante interactive + panneau sticky image / inclusions
5. `work` — titre géant, pile de cartes sticky (image / méta année + catégorie), partenaires, double CTA
6. `whyChoose` — grille 4 col : carte stat photo, carte globe, cartes texte icône
7. `testimonials` — notes (étoiles accent), carte cluster avatars + cartes citations en scroll horizontal
8. `pricing` — 2 cartes (bordure / coal vedette), listes à coches accent, note légale
9. `blog` — 3 cartes articles (image, date mono, titre display)
10. `finalCta` — typo géante sur portrait voilé chaud, vignette-lettre
11. `footer` — pages / newsletter sur texture / réseaux, **wordmark géant**, contact

## Provenance

Reconstruction React originale (code, textes français et images libres
Unsplash) du *layout* d'un template Framer commercial dont la licence a été
achetée. Aucun asset ni texte d'origine n'est embarqué.
