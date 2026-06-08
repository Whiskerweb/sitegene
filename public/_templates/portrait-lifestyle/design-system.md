# Design System — portrait-lifestyle (photographe portrait & lifestyle, éditorial chaud)

## 1. ADN

Photographe **portrait & lifestyle, éditorial chaud** : fond **crème tiède**
(#F7F3F0), encres brun-noir, typographie **Cormorant Garamond en italique** très
grande et fine (élégance manuscrite). La nav est en `mix-blend-difference`. Sous
le hero, une **grille d'images** (un portrait en N&B + des photos lifestyle en
couleur). Ton intime, naturel, magazine. À l'opposé de portrait-fineart (blanc
minimal mono) : ici **crème chaud, serif italique, grille de vie**.

## 2. Tokens (verrouillés)

Polices : **Cormorant Garamond** (`.font-display`, serif italique) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#2C2827', bg:'#F7F3F0', dark:'#1A1715', faint:'#8A8480' },
  fontFamily: { display:['"Cormorant Garamond"','Georgia','serif'], sans:['Inter','Helvetica','Arial','sans-serif'] },
  letterSpacing: { wide2:'0.18em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',Helvetica,Arial,sans-serif; background:#F7F3F0; color:#2C2827; margin:0; }
.font-display { font-family:'"Cormorant Garamond"',Georgia,serif; }
/* Petite pastille décorative devant le titre */
.dot { display:inline-block; width:10px; height:10px; border-radius:50%; background:#2C2827; margin-right:14px; vertical-align:middle; }
```

## 3. HEADER — signature

### 3a. NAV — mix-blend, marque serif italique

```html
<nav class="fixed top-0 inset-x-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between mix-blend-difference text-white">
  <a href="#" data-sg-path="brand" class="font-display italic text-xl md:text-2xl tracking-tight">{MARQUE}</a>
  <ul class="flex items-center gap-7 text-[11px] uppercase tracking-wide2">
    <li><a href="#work" data-sg-path="nav[0]" class="hover:opacity-60 transition-opacity">Galerie</a></li>
    <li><a href="#about" data-sg-path="nav[1]" class="hover:opacity-60 transition-opacity">À propos</a></li>
    <li><a href="#contact" data-sg-path="nav[2]" class="hover:opacity-60 transition-opacity">Contact</a></li>
  </ul>
</nav>
```

### 3b. HERO — titre Cormorant italique géant + grille d'images

```html
<header id="top" class="px-6 md:px-12 pt-32 md:pt-40 pb-16 md:pb-24">
  <div class="max-w-[100rem] mx-auto">
    <h1 class="font-display italic font-light leading-[0.95] text-[44px] sm:text-6xl md:text-7xl lg:text-[108px] max-w-3xl text-ink">
      <span class="dot"></span><span data-sg-path="hero.title">{TITRE — phrase sensible}</span>
    </h1>
    <div class="mt-8 flex items-end justify-between flex-wrap gap-4">
      <p data-sg-path="hero.tagline" class="text-sm text-faint max-w-[220px] leading-relaxed">{ACCROCHE courte}</p>
      <span class="text-2xl text-ink select-none hidden md:inline">↓</span>
    </div>
    <!-- Galerie d'images en ACCORDÉON : portrait N&B + lifestyle couleur.
         Au survol, l'image pointée s'élargit et les autres se rétractent
         (classe .gallery-expand du kit partagé, CSS pur). Chaque image dans un .gx. -->
    <div class="mt-12 gallery-expand gap-3 md:gap-4 h-[320px] md:h-[460px]">
      <div class="gx"><img data-sg-img="hero.portrait" src="{PORTRAIT}" alt="" class="grayscale" /></div>
      <div class="gx"><img data-sg-img="hero.lifestyle[0]" src="{LIFE1}" alt="" /></div>
      <div class="gx"><img data-sg-img="hero.lifestyle[1]" src="{LIFE2}" alt="" /></div>
      <div class="gx"><img data-sg-img="hero.lifestyle[2]" src="{LIFE3}" alt="" /></div>
    </div>
  </div>
</header>
```

### 3c. Signature à ne jamais perdre

1. **Titre Cormorant Garamond en italique** `font-display italic font-light
   leading-[0.95] text-[44px] … lg:text-[108px]` — la serif italique fine et
   géante fait l'élégance, précédée d'une **pastille `.dot`**.
2. Fond **crème `#F7F3F0`** chaud, encres brun-noir.
3. Nav `mix-blend-difference` (s'inverse), marque serif italique.
4. **Galerie d'images en accordéon** sous le titre (classe `.gallery-expand`,
   chaque image dans un `.gx`) : un **portrait en N&B** (`grayscale`) + des photos
   lifestyle en couleur. **Au survol, l'image pointée s'élargit** et les autres se
   rétractent — interaction signature à conserver.

## 4. Sections du corps

Fond crème, `px-6 md:px-12 py-20`, grilles asymétriques d'images. Sections :
GALERIE/WORK (mosaïques portrait+lifestyle), À PROPOS (texte serif + portrait),
SERVICES/SÉANCES, TÉMOIGNAGES, CONTACT. Titres Cormorant italique. FOOTER crème
ou `dark`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français doux, sensible, magazine lifestyle. Titre = phrase sur l'histoire/les
instants. Accroches courtes et chaleureuses. Évoque portraits, vie, naturel,
lumière. Élégant sans froideur.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos (portrait N&B + lifestyle couleur),
nombre d'images, le nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, crème + Cormorant italique), structure du header
(titre italique géant + pastille + grille d'images portrait N&B/lifestyle),
mix-blend nav, l'ambiance crème chaude.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en crème + Cormorant italique ; jamais une couleur vive
ou un style froid/technique.
