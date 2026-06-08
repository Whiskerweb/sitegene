# Design System — dj-electro (DJ / musique électronique, noir & or)

## 1. ADN

Site de **DJ / producteur électro, nocturne et chaud** : fond **noir absolu**,
texte ivoire, un accent **pêche-or** (#fbd295) qui évoque les lumières chaudes
d'un club, et un bleu électrique rarissime. Titres en **Clash Display bold,
capitales**, serrés. Énergie de la nuit, du dancefloor, du résident de club. À
l'opposé du jazz (serif feutré) : ici **sans-serif bold, clubbing, chaud-sur-noir**.

## 2. Tokens (verrouillés)

Polices : **Clash Display** (`.font-display`, titres), **Open Sans** (`.font-body`,
corps), **Manrope** (sans, libellés).

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:'#000000', panel:'#080807', paper:'#ffffff',
    accent:'#fbd295', /* pêche-or : CTA, hovers */
    blue:'#0000ee', muted:'#b4b4b4', faint:'#8a8a8a', line:'#222222',
  },
  fontFamily: { display:['"Clash Display"','sans-serif'], body:['"Open Sans"','sans-serif'], sans:['Manrope','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Open Sans',sans-serif; background:#000; color:#eee; margin:0; }
.font-display { font-family:'"Clash Display"',sans-serif; }
.font-body { font-family:'"Open Sans"',sans-serif; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0`, `backdrop-blur-md bg-ink/50 border-b border-line`. Marque en
display bold, liens Manrope, CTA en **pilule à filet**.

```html
<header class="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-ink/50 border-b border-line">
  <nav class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
    <a href="#top" data-sg-path="brand" class="font-display font-bold text-lg tracking-tight text-paper">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 font-sans text-[14px] text-muted">
      <li><a href="#about" data-sg-path="nav[0]" class="hover:text-paper transition-colors">À propos</a></li>
      <li><a href="#dates" data-sg-path="nav[1]" class="hover:text-paper transition-colors">Dates</a></li>
    </ul>
    <a href="#contact" data-sg-path="cta" class="font-sans text-[14px] border border-line rounded-full px-5 py-2 text-paper hover:bg-paper hover:text-ink transition-colors">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — titre display bold sur noir, 2 colonnes

```html
<section id="top" class="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
  <div class="mx-auto max-w-7xl w-full px-6 grid lg:grid-cols-2 gap-12 items-center">
    <!-- GAUCHE : texte -->
    <div>
      <span data-sg-path="hero.eyebrow" class="font-sans text-[14px] text-muted">{ÉYEBROW}</span>
      <h1 data-sg-path="hero.title" class="font-display font-bold uppercase tracking-tight leading-[1.02] text-paper text-5xl md:text-6xl lg:text-[64px] mt-4">{TITRE — accroche club}</h1>
      <p data-sg-path="hero.tagline" class="mt-8 font-body text-base text-faint max-w-md">{ACCROCHE}</p>
      <div class="mt-8 flex items-center gap-5">
        <a href="#contact" data-sg-path="hero.ctaPrimary" class="inline-flex items-center justify-center font-sans text-[15px] font-medium rounded-full px-7 py-3 bg-accent text-ink hover:brightness-95 transition">{CTA1}</a>
        <a href="#about" data-sg-path="hero.ctaSecondary" class="inline-flex items-center gap-2 font-sans text-[15px] text-paper hover:text-accent transition">{CTA2}</a>
      </div>
    </div>
    <!-- DROITE : grande photo (ambiance scène/club) -->
    <div class="relative aspect-square lg:aspect-[4/5] overflow-hidden rounded-2xl">
      <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover" />
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Fond **noir**, hero `min-h-screen` 2 colonnes (texte / photo).
2. Titre **Clash Display bold UPPERCASE** `tracking-tight leading-[1.02]
   text-5xl md:text-6xl lg:text-[64px]` — le bold capitales serré fait l'énergie.
3. Accent **pêche-or `#fbd295`** : CTA primaire = **pilule pleine accent**, hovers
   de liens en accent. Le 2ᵉ CTA est un lien texte.
4. CTA nav = **pilule à filet** `border border-line hover:bg-paper hover:text-ink`.
5. Palette noir/ivoire + accent or ; bleu `#0000ee` rarissime.

## 4. Sections du corps

Fond noir, panneaux `bg-panel rounded-2xl border border-line`, `py-24`. Sections
DJ : À PROPOS, DATES (liste de sets/soirées à venir), MIXES/RELEASES (cartes),
GALERIE (photos de scène), RÉSERVATION/CONTACT (CTA accent). FOOTER noir,
« Propulsé par Akyra ».

## 5. Ton éditorial

Français énergique mais pro, registre nightlife/booking. Titre = accroche club
percutante. Accroches courtes et rythmées. Évoque clubs, festivals, résidences,
ambiances. Pas de mièvrerie ; punch et classe.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de dates/mixes, nom
d'artiste, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + accent or + Clash Display), structure du
header (titre display bold uppercase 2 colonnes), accent pêche-or parcimonieux,
fond noir.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + accent or + Clash Display ; jamais un bloc
clair ou une couleur hors palette.
