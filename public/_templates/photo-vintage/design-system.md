# Design System — photo-vintage (studio photo vintage, rétro chaud)

## 1. ADN

Studio de **photographie vintage / argentique, rétro et chaleureux** : fond
**bordeaux profond** (#701E1F), palette chaude (corail, pêche, cacao) et un
**accent lime électrique** (#DFFF2C) très rare. Signature : des **photos qui
flottent** (positionnées en absolu, inclinées, animation douce de lévitation) et
un **titre géant mêlant Archivo black capitales + Libre Caslon serif italique
minuscule**. Ambiance pellicule, émotion, intemporel. À l'opposé du minimal :
ici **chaud, rétro, typo mixte, photos flottantes**.

## 2. Tokens (verrouillés)

Polices : **Archivo** (`.font-sans`, black) + **Libre Caslon Text** (`.font-serif`, serif italique).

```js
tailwind.config = { theme: { extend: {
  colors: { maroon:'#701E1F', coral:'#EC7672', peach:'#F9DCC5', cocoa:'#401714', ink:'#1A0E0C', lime:'#DFFF2C', cream:'#FBEFE3' },
  fontFamily: { sans:['Archivo','Arial','sans-serif'], serif:['"Libre Caslon Text"','Georgia','serif'] },
  letterSpacing: { wide2:'0.2em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Archivo',Arial,sans-serif; background:#701E1F; color:#FBEFE3; margin:0; }
.font-serif { font-family:'"Libre Caslon Text"',Georgia,serif; }
/* Photos flottantes (lévitation douce) */
.float-photo { box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
.floaty   { animation: floaty 6s   ease-in-out infinite; }
.floaty-2 { animation: floaty 7.5s ease-in-out infinite; }
.floaty-3 { animation: floaty 8.5s ease-in-out infinite; }
@media (prefers-reduced-motion:reduce){ .floaty,.floaty-2,.floaty-3{animation:none} }
```

## 3. HEADER — signature

### 3a. NAV

`absolute top-0` sur le bordeaux. Marque en capitales pêche espacées.

```html
<nav class="absolute top-0 left-0 w-full z-50">
  <div class="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
    <a href="#" data-sg-path="brand" class="text-sm font-bold tracking-wide2 uppercase text-peach">{MARQUE}</a>
    <div class="hidden md:flex items-center gap-7 text-xs uppercase tracking-wide2 text-peach/80">
      <a href="#work" data-sg-path="nav[0]" class="hover:text-peach transition-colors">Galerie</a>
      <a href="#about" data-sg-path="nav[1]" class="hover:text-peach transition-colors">À propos</a>
      <a href="#contact" data-sg-path="nav[2]" class="hover:text-peach transition-colors">Contact</a>
    </div>
  </div>
</nav>
```

### 3b. HERO — photos flottantes + titre Archivo/Caslon mixte

```html
<section class="relative min-h-screen bg-maroon overflow-hidden flex flex-col justify-center pt-28 pb-16">
  <!-- 3 photos flottantes, inclinées, lévitation douce -->
  <img data-sg-img="hero.photo1" src="{IMG1}" alt="" class="float-photo floaty absolute left-0 top-16 w-40 md:w-56 aspect-[3/4] object-cover rounded-sm rotate-[-6deg] opacity-95" />
  <img data-sg-img="hero.photo2" src="{IMG2}" alt="" class="float-photo floaty-2 absolute right-6 md:right-24 top-28 w-36 md:w-52 aspect-[3/4] object-cover rounded-sm rotate-[5deg] opacity-95" />
  <img data-sg-img="hero.photo3" src="{IMG3}" alt="" class="float-photo floaty-3 hidden md:block absolute left-[34%] bottom-12 w-40 lg:w-48 aspect-[3/4] object-cover rounded-sm rotate-[-3deg] opacity-95" />
  <!-- Titre ALIGNÉ À GAUCHE (max-w-[100rem]) : Archivo black caps + Caslon serif italique.
       2 lignes : ligne 1 = MOT caps + mot serif italique ; ligne 2 = suite en caps. -->
  <div class="relative z-10 max-w-[100rem] mx-auto px-6 lg:px-12 w-full">
    <p data-sg-path="hero.badge" class="text-peach/80 text-sm font-medium max-w-md mb-8 uppercase tracking-wide2">{ACCROCHE courte}</p>
    <h1 class="font-sans font-black uppercase leading-[0.86] tracking-tighter text-peach text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">
      <span class="inline-flex items-baseline flex-wrap gap-x-4">
        <span data-sg-path="hero.line1pre">{MOT CAPS}</span>
        <em class="font-serif italic font-normal lowercase tracking-normal text-5xl sm:text-6xl md:text-7xl lg:text-8xl" data-sg-path="hero.line1em">{mot serif italique}</em>
      </span>
      <span class="block" data-sg-path="hero.line2">{SUITE DU TITRE EN CAPS}</span>
    </h1>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Fond **bordeaux `#701E1F`**, palette chaude rétro.
2. **Photos flottantes** (3 photos `absolute`, inclinées `rotate-[…]`, animation
   `.floaty` de lévitation douce) — le détail signature.
3. **Titre mixte ALIGNÉ À GAUCHE** (conteneur `max-w-[100rem]`, pas centré),
   sur **2 lignes** : Archivo **black capitales** (`text-6xl … lg:text-[9rem]
   leading-[0.86] tracking-tighter`) entrelacé de **Libre Caslon serif italique
   minuscule** — le contraste caps/italique fait le vintage chic.
4. Accent **lime `#DFFF2C`** rarissime. Texte pêche sur bordeaux.

## 4. Sections du corps

Alternance bordeaux / corail / pêche-cream, `py-24`. Sections : GALERIE (photos
rétro, grilles), À PROPOS (texte serif + photo), SÉANCES/SERVICES, TÉMOIGNAGES,
CONTACT. Titres Archivo black + Caslon italique. FOOTER cocoa/bordeaux,
« Propulsé par Akyra ».

## 5. Ton éditorial

Français sensible, rétro-chic, registre argentique/pellicule. Titre = un mot caps
+ un mot serif italique. Accroches sur l'émotion, l'intemporel, la pellicule.
Chaleureux et nostalgique.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos (flottantes), nombre d'images, le
nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, bordeaux + Archivo/Caslon + lime rare), structure du
header (photos flottantes + titre mixte caps/italique), la palette chaude rétro.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en bordeaux + palette chaude + Archivo/Caslon ; jamais
une couleur froide hors palette.
