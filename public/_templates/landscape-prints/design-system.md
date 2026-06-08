# Design System — landscape-prints (photographe paysage + boutique tirages)

## 1. ADN

Site de **photographe de paysage / vente de tirages, immersif** : fond **noir
profond** (#050505), accent **orange international** (#FA642E) et une gamme
chaude « golden hour » (ember/sun) + un bleu ciel froid (mist). La signature : un
**hero en mosaïque de photos plein écran** (grille de tirages qui zooment au
survol) sur laquelle un **titre centré** se superpose, dont la 2ᵉ ligne est en
**Fraunces serif italique**. Ton contemplatif, nature, collection. À l'opposé du
SaaS : ici **immersif, sombre, photo plein cadre, chaud-froid**.

## 2. Tokens (verrouillés)

Polices : **DM Sans** (corps/titres) + **Fraunces** (`.font-serif-it`, serif italique).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#050505', inkSoft:'#0d0d0e', card:'#161616', orange:'#FA642E', ember:'#FF8B61', sun:'#FDBD68', mist:'#A8DBFF', muted:'#9a9a9a' },
  fontFamily: { sans:['"DM Sans"','sans-serif'], serif:['"Fraunces"','Georgia','serif'] },
  letterSpacing: { wide2:'0.2em', wide15:'0.15em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'DM Sans',sans-serif; background:#050505; color:#eee; margin:0; }
.font-serif-it { font-family:'Fraunces',Georgia,serif; font-style:italic; }
/* Zoom doux des vignettes de la mosaïque au survol */
.grid-cell img { transition: transform 1.6s cubic-bezier(.16,1,.3,1), filter 1s ease; }
.grid-cell:hover img { transform: scale(1.06); filter: saturate(1.15) brightness(1.05); }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0` transparente. Marque en capitales espacées, nav `uppercase
tracking-wide15`.

```html
<header class="fixed top-0 inset-x-0 z-50">
  <div class="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between text-white">
    <span data-sg-path="brand" class="text-sm uppercase tracking-wide2 font-medium">{MARQUE}</span>
    <nav class="hidden lg:flex items-center gap-7 text-xs uppercase tracking-wide15 text-white/70">
      <a href="#work" data-sg-path="nav[0]" class="hover:text-white transition-colors">Galerie</a>
      <a href="#prints" data-sg-path="nav[1]" class="hover:text-white transition-colors">Tirages</a>
      <a href="#about" data-sg-path="nav[2]" class="hover:text-white transition-colors">À propos</a>
      <a href="#contact" data-sg-path="nav[3]" class="hover:text-white transition-colors">Contact</a>
    </nav>
  </div>
</header>
```

### 3b. HERO — mosaïque de photos + titre centré (2e ligne serif italique)

```html
<section id="top" class="relative min-h-screen bg-ink overflow-hidden pt-20">
  <!-- MOSAÏQUE plein écran : grille de tirages, vignettes qui zooment au survol -->
  <div class="absolute inset-0 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 p-2 opacity-90">
    <div class="grid-cell relative overflow-hidden bg-card aspect-[3/4]"><img data-sg-img="hero.gallery[0].image" src="{IMG0}" alt="" class="w-full h-full object-cover"></div>
    <div class="grid-cell relative overflow-hidden bg-card aspect-[3/4]"><img data-sg-img="hero.gallery[1].image" src="{IMG1}" alt="" class="w-full h-full object-cover"></div>
    <!-- … 4 à 6 vignettes (certaines hidden md:block / lg:block) … -->
  </div>
  <!-- Voile sombre pour lisibilité -->
  <div class="absolute inset-0 bg-ink/55"></div>
  <!-- Titre CENTRÉ par-dessus (pointer-events-none) -->
  <div class="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pointer-events-none">
    <h1 class="leading-[0.95] tracking-tight drop-shadow-2xl">
      <span class="block text-6xl sm:text-7xl lg:text-8xl font-bold text-white" data-sg-path="hero.title1">{NOM}</span>
      <span class="block font-serif-it text-4xl sm:text-5xl lg:text-6xl text-white/90 mt-1" data-sg-path="hero.title2">{SOUS-TITRE serif italique}</span>
    </h1>
    <p data-sg-path="hero.tagline" class="mt-7 max-w-xl text-base md:text-lg text-white/70 font-light">{ACCROCHE}</p>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero en mosaïque de photos plein écran** (`grid-cols-3 md:5 lg:6 gap-2`,
   cellules `aspect-[3/4]`, **zoom doux au survol** `.grid-cell:hover`).
2. **Titre centré superposé** : 1re ligne DM Sans bold `text-6xl … lg:text-8xl`,
   **2e ligne en Fraunces serif italique** `.font-serif-it text-4xl … lg:text-6xl`.
3. Fond **noir profond**, voile `bg-ink/55` pour la lisibilité.
4. Accent **orange `#FA642E`** + gamme chaude golden-hour, labels `uppercase
   tracking-wide15/wide2`.

## 4. Sections du corps

Fond `bg-ink`/`inkSoft`, cartes `bg-card`, `py-24 md:py-32`. Sections : GALERIE
(grandes photos), TIRAGES/BOUTIQUE (grille de produits avec prix, accent orange),
À PROPOS (texte + portrait), PROCESS (impression), CONTACT. Titres mêlant DM Sans
bold et Fraunces italique. FOOTER noir, « Propulsé par Akyra ».

## 5. Ton éditorial

Français contemplatif, sensible à la nature et à la lumière. Titre = nom + une
ligne poétique en italique. Accroches sur le paysage, la lumière, les tirages
d'art. Labels courts en capitales. Sobre et évocateur.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos (mosaïque), nombre de tirages, le
nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + orange + Fraunces), structure du header
(mosaïque plein écran + titre centré serif-italique), la gamme chaude, le voile sombre.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + orange + Fraunces ; jamais une couleur hors
palette ou un fond clair.
