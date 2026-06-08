# Design System — portrait-fineart (portfolio photo, minimal éditorial)

## 1. ADN

Portfolio de photographe d'art **minimal, éditorial, blanc** : grande photo
plein écran, typographie **Manrope** avec interlettrage négatif (`.display`,
-0.04em) pour les titres, et un système de **micro-labels monospace entre
crochets** numérotés (`[ 01 — INTRO ]`, `[09]`, `[30]`) qui rythment la page
comme un catalogue de galerie. Fond blanc, encres profondes, accent bleu
électrique rare. Le titre du hero est une **phrase-manifeste** ancrée en bas de
l'image (pas un nom). Émotion : galerie d'art contemporain, rigueur, élégance
froide. À l'opposé du jazz (noir/serif) : ici **blanc, sans-serif, structuré,
catalogue**.

## 2. Tokens (verrouillés)

Police : **Manrope** (300–700). Classes custom `.display` (titres) et `.mono` (labels).

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:    '#0A0A0A',  /* texte / encres */
    night:  '#12141D',  /* sections sombres */
    bg:     '#FFFFFF',  /* fond blanc */
    bgSoft: '#FBFBFB',  /* fond très clair alterné */
    line:   '#E7E7E7',  /* filets */
    muted:  '#999999',  /* labels secondaires */
    accent: '#0000EE',  /* bleu électrique : accent RARE */
  },
  fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Manrope', system-ui, sans-serif; background:#fff; color:#0A0A0A; margin:0; }
.display { letter-spacing: -0.04em; }                                  /* titres serrés */
.mono { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; } /* labels */
```

## 3. HEADER — signature

### 3a. NAV — labels mono avec compteurs entre crochets

`absolute top-0`, sur l'image (texte blanc). Marque en `.mono`, liens `.mono`,
certains suivis d'un **compteur entre crochets** (`[09]`, `[30]`) en opacité réduite.

```html
<header class="absolute top-0 inset-x-0 z-30">
  <div class="max-w-[100rem] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between text-white">
    <span data-sg-path="brand" class="mono font-semibold">{MARQUE}</span>
    <nav class="hidden md:flex items-center gap-7 lg:gap-9">
      <a href="#" data-sg-path="nav.home" class="mono hover:opacity-60 transition-opacity">Accueil</a>
      <a href="#categories" data-sg-path="nav.about" class="mono hover:opacity-60 transition-opacity">À propos</a>
      <a href="#work" class="mono hover:opacity-60 transition-opacity"><span data-sg-path="nav.gallery">Galerie</span> <span class="opacity-60" data-sg-path="nav.galleryCount">[09]</span></a>
      <a href="#archive" class="mono hover:opacity-60 transition-opacity"><span data-sg-path="nav.archive">Archive</span> <span class="opacity-60" data-sg-path="nav.archiveCount">[30]</span></a>
      <a href="#" data-sg-path="nav.contact" class="mono hover:opacity-60 transition-opacity">Contact</a>
    </nav>
    <button class="md:hidden text-2xl" aria-label="Menu">&#9776;</button>
  </div>
</header>
```

### 3b. HERO — photo plein écran, titre-phrase ancré en bas

```html
<section class="relative h-screen w-full overflow-hidden">
  <div class="absolute inset-0 overflow-hidden">
    <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover object-center" />
    <div class="absolute inset-0" style="background:linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%);"></div>
  </div>
  <!-- header (3a) ici -->
  <!-- Titre ancré EN BAS -->
  <div class="absolute bottom-0 inset-x-0 z-20">
    <div class="max-w-[100rem] mx-auto px-6 lg:px-10 pb-16 lg:pb-20">
      <p data-sg-path="hero.location" class="mono text-white/80 mb-5">[{LIEU}]</p>
      <h1 data-sg-path="hero.title" class="display text-white font-medium leading-[1.04] text-[2.6rem] sm:text-5xl lg:text-6xl max-w-4xl">{PHRASE-MANIFESTE — une phrase}</h1>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Hero `h-screen`, photo plein écran (couleur, pas N&B), double dégradé sombre
   haut+bas, titre ancré **en bas à gauche**.
2. Le titre est une **phrase-manifeste** `.display font-medium leading-[1.04]
   text-[2.6rem] sm:text-5xl lg:text-6xl max-w-4xl` (Manrope, tracking négatif) —
   PAS un nom, mais une affirmation sur la pratique.
3. **Labels monospace entre crochets** `.mono` partout : localisation `[LIEU]`,
   compteurs nav `[09]`/`[30]`, numéros de section `[ 01 — INTRO ]`.
4. Fond **blanc** dominant, encres profondes, accent bleu `#0000EE` rarissime.

## 4. Sections du corps

Fond `bg-bg` (blanc) / `bgSoft` / `bg-night` (sombre), `py-20 lg:py-28`, conteneur
`max-w-[100rem]`. Motif : grille `lg:grid-cols-12`, **label mono numéroté** dans
une colonne étroite (`lg:col-span-3`, `[ 01 — INTRO ]`) + contenu large
(`lg:col-span-9`) en `.display`. Sections : INTRO/STATEMENT, CATÉGORIES, WORK
(galerie d'images), ARCHIVE (liste numérotée), CONTACT. Filets `border-line` fins.
FOOTER blanc/minimal, « Propulsé par Akyra ».

## 5. Ton éditorial

Français sobre, intellectuel, registre galerie d'art. Le titre hero = une phrase
sur la démarche photographique. Labels courts en capitales entre crochets.
Numérotation des sections. Pas d'emphase commerciale ; rigueur et retenue.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, les photos, le nombre d'images/catégories
(et donc les compteurs `[NN]`), le nom de marque, retirer une section sans
matière (avis absents → section « démarche / approche » dans le même style, sans
faux avis).

**VERROUILLÉ** : tokens (§2, blanc + Manrope), structure du header (labels mono
à crochets + nav compteurs), le titre-phrase ancré en bas, le système de labels
numérotés, l'accent bleu rarissime.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image (`hero.image`, `work.items[0].image`…) pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en blanc + Manrope + labels mono ; jamais un bloc
coloré ou gras qui casserait la rigueur de galerie.
