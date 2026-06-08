# Design System — electronic-collective (collectif musique électronique)

## 1. ADN

Site d'un **collectif de musique électronique, éditorial clair** : fond **gris
clair** (#f0f0f0) dominant (pas noir !), texte noir, accent **bleu électrique**
(#0000ee), panneaux sombres ponctuels. Typo **MuseoModerno** (display géométrique
arrondie) pour les gros titres, Inter pour le corps. Signature : un **hero en
grille de 3 colonnes-images plein écran** avec le nom du collectif centré, et la
**nav en bas de page** (coins). Ton underground, rave, art collectif. À l'opposé
des artisans : ici **clair, géométrique, bleu, grille immersive**.

## 2. Tokens (verrouillés)

Polices : **MuseoModerno** (`.font-display`, display arrondie) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#000000', paper:'#f0f0f0', panel:'#212121', accent:'#0000ee', white:'#ffffff', muted:'#858585' },
  fontFamily: { display:['"MuseoModerno"','sans-serif'], sans:['"Inter"','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#f0f0f0; color:#000; margin:0; }
.font-display { font-family:'"MuseoModerno"',sans-serif; }
```

## 3. HEADER — signature

### 3b. HERO — grille 3 colonnes-images + nom centré + nav en bas

Le header EST le hero : un **plein écran en 3 colonnes d'images** (`grid-cols-3
h-screen`), le **nom du collectif centré** par-dessus la colonne du milieu, et la
**navigation + réseaux dans les coins bas** (minuscules).

```html
<section class="relative">
  <div class="grid grid-cols-1 md:grid-cols-3 h-screen">
    <div class="relative overflow-hidden bg-panel"><img data-sg-img="hero.img1" src="{IMG1}" alt="" class="absolute inset-0 w-full h-full object-cover" /></div>
    <div class="relative overflow-hidden bg-panel">
      <img data-sg-img="hero.img2" src="{IMG2}" alt="" class="absolute inset-0 w-full h-full object-cover" />
      <!-- Nom du collectif, centré sur la colonne du milieu -->
      <div class="absolute inset-0 z-20 flex items-center justify-center">
        <h1 data-sg-path="hero.title" class="font-display text-white text-3xl md:text-2xl lg:text-4xl tracking-tight px-4 text-center drop-shadow-lg">{NOM DU COLLECTIF}</h1>
      </div>
    </div>
    <div class="relative overflow-hidden bg-panel"><img data-sg-img="hero.img3" src="{IMG3}" alt="" class="absolute inset-0 w-full h-full object-cover" /></div>
  </div>
  <!-- Nav en bas-gauche, réseaux en bas-droite (minuscules) -->
  <nav class="absolute bottom-6 left-6 z-30 flex flex-wrap gap-6 font-sans text-sm text-ink mix-blend-difference text-white">
    <a href="#about" data-sg-path="nav[0]" class="hover:text-accent transition-colors">accueil</a>
    <a href="#tour" data-sg-path="nav[1]" class="hover:text-accent transition-colors">galerie</a>
    <a href="#contact" data-sg-path="nav[2]" class="hover:text-accent transition-colors">réservation</a>
  </nav>
  <div class="absolute bottom-6 right-6 z-30 flex gap-6 font-sans text-sm mix-blend-difference text-white">
    <a href="#" data-sg-path="socials[0]" class="hover:text-accent transition-colors">facebook</a>
    <a href="#" data-sg-path="socials[1]" class="hover:text-accent transition-colors">twitter</a>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero plein écran en grille 3 colonnes-images** (`grid-cols-3 h-screen`), le
   **nom du collectif centré** par-dessus la colonne du milieu (MuseoModerno blanc).
2. **Nav en bas** (coins : nav à gauche, réseaux à droite), liens **minuscules**.
3. Corps **gris clair `#f0f0f0`** (pas noir), gros titres **MuseoModerno** géants
   (`text-5xl … lg:text-8xl`), accent **bleu `#0000ee`** au survol.
4. Panneaux sombres `bg-panel` ponctuels.

## 4. Sections du corps

Fond `paper` gris clair, `max-w-6xl`, `py-16/24`. Sections : BIO (gros titre
MuseoModerno + 2 images), TOUR/DATES (liste `grid-cols-[260px_1fr]`), RELEASES,
GALERIE, RÉSERVATION/CONTACT (accent bleu). Titres MuseoModerno géants. FOOTER
clair ou `panel`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français underground, minuscules assumées, registre collectif/rave. Le hero = le
nom du collectif. Titres de section en gros MuseoModerno. Accroches sur les
soirées, le son, l'art collectif. Brut et arty.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos (grille hero), nombre de dates, le
nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, gris clair + MuseoModerno + bleu), structure du
header (hero grille 3 colonnes + nom centré + nav en bas), le fond clair, le bleu.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en gris clair + MuseoModerno + bleu ; jamais une couleur
hors palette.
