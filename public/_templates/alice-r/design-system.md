# Design System — alice-r (photographe éditorial, arc de photos)

## 1. ADN

Photographe **éditorial haut de gamme, chaleureux et sensible** : fond **brun
très sombre** (#1a1108), texte blanc, touches brun/ocre. Typo **Hanken Grotesk**
`font-medium`. LA signature : un **hero en arc/ovale de photos** — une douzaine
de petites photos inclinées, disposées en couronne autour d'un **titre central**.
Ton intemporel, narratif (« chaque image raconte une histoire »). À l'opposé des
photographes sombres minimalistes : ici **chaud, couronne de photos, éditorial**.

## 2. Tokens (verrouillés)

Police : **Hanken Grotesk** (300–700), graisse dominante **medium**.

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#1a1108', ink2:'#3a2210', brown:'#6b3a14', white:'#ffffff', muted:'#9ca3af', line:'#e5e7eb' },
  fontFamily: { sans:['"Hanken Grotesk"','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Hanken Grotesk',sans-serif; background:#1a1108; color:#fff; margin:0; }
/* Photos de l'arc : inclinées, ombrées, légère lévitation */
.arc-photo { position:absolute; object-fit:cover; border-radius:6px; box-shadow:0 18px 50px rgba(0,0,0,.45); }
@keyframes arcfloat { 0%,100%{ transform:translateY(0) rotate(var(--r)); } 50%{ transform:translateY(-10px) rotate(var(--r)); } }
.arc-photo{ animation:arcfloat 7s ease-in-out infinite; }
@media (prefers-reduced-motion:reduce){ .arc-photo{animation:none} }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0`, transparente. Marque + liens blancs, CTA pilule.

```html
<header class="fixed top-0 inset-x-0 z-50">
  <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between text-white">
    <a href="#top" data-sg-path="hero.brand" class="text-lg font-medium tracking-tight">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 text-sm text-white/80">
      <li><a href="#services" data-sg-path="nav[0]" class="hover:text-white transition-colors">Services</a></li>
      <li><a href="#works" data-sg-path="nav[1]" class="hover:text-white transition-colors">Galerie</a></li>
      <li><a href="#contact" data-sg-path="nav[2]" class="hover:text-white transition-colors">Contact</a></li>
    </ul>
    <a href="#contact" data-sg-path="hero.ctaPrimary" class="rounded-full bg-white text-ink text-sm font-medium px-5 py-2.5 hover:bg-white/90 transition-colors">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — couronne (arc) de photos + titre central

Conteneur `relative min-h-screen`. **13 photos `.arc-photo`** positionnées en
**ovale** (coordonnées ci-dessous, en `top`/`left` %, taille en px, rotation via
`--r`), et au **centre** le titre + sous-titre + CTA. Les photos forment un cadre
autour du texte.

```html
<section id="top" class="relative min-h-screen overflow-hidden flex items-center justify-center text-center pt-20">
  <!-- COURONNE DE PHOTOS (13) — top / left / taille px / rotation deg -->
  <img data-sg-img="arcPhotos[0].img"  src="{IMG0}"  class="arc-photo" style="top:20%;left:17%;width:150px;height:188px;--r:10deg">
  <img data-sg-img="arcPhotos[1].img"  src="{IMG1}"  class="arc-photo" style="top:12%;left:29%;width:165px;height:206px;--r:-6deg">
  <img data-sg-img="arcPhotos[2].img"  src="{IMG2}"  class="arc-photo" style="top:8%;left:43%;width:150px;height:188px;--r:4deg">
  <img data-sg-img="arcPhotos[3].img"  src="{IMG3}"  class="arc-photo" style="top:11%;left:57%;width:160px;height:200px;--r:-3deg">
  <img data-sg-img="arcPhotos[4].img"  src="{IMG4}"  class="arc-photo" style="top:20%;left:70%;width:165px;height:206px;--r:7deg">
  <img data-sg-img="arcPhotos[5].img"  src="{IMG5}"  class="arc-photo" style="top:38%;left:82%;width:150px;height:188px;--r:-8deg">
  <img data-sg-img="arcPhotos[6].img"  src="{IMG6}"  class="arc-photo" style="top:36%;left:8%;width:155px;height:194px;--r:-9deg">
  <img data-sg-img="arcPhotos[7].img"  src="{IMG7}"  class="arc-photo" style="top:58%;left:12%;width:160px;height:200px;--r:8deg">
  <img data-sg-img="arcPhotos[8].img"  src="{IMG8}"  class="arc-photo" style="top:60%;left:84%;width:155px;height:194px;--r:6deg">
  <img data-sg-img="arcPhotos[9].img"  src="{IMG9}"  class="arc-photo" style="top:80%;left:10%;width:150px;height:188px;--r:-5deg">
  <img data-sg-img="arcPhotos[10].img" src="{IMG10}" class="arc-photo" style="top:82%;left:85%;width:150px;height:188px;--r:7deg">
  <img data-sg-img="arcPhotos[11].img" src="{IMG11}" class="arc-photo" style="top:90%;left:26%;width:140px;height:175px;--r:9deg">
  <img data-sg-img="arcPhotos[12].img" src="{IMG12}" class="arc-photo" style="top:92%;left:70%;width:140px;height:175px;--r:-7deg">
  <!-- TITRE CENTRAL -->
  <div class="relative z-10 max-w-2xl px-6">
    <h1 class="text-4xl font-medium leading-[1.1] text-white sm:text-5xl md:text-6xl">
      <span class="block" data-sg-path="hero.title[0]">{LIGNE 1}</span>
      <span class="block" data-sg-path="hero.title[1]">{LIGNE 2}</span>
    </h1>
    <p data-sg-path="hero.subtitle" class="mt-6 text-white/70 text-base md:text-lg max-w-lg mx-auto">{ACCROCHE}</p>
    <a href="#contact" data-sg-path="hero.ctaPrimary" class="inline-block mt-8 rounded-full bg-white text-ink font-medium px-7 py-3.5 hover:bg-white/90 transition-colors">{CTA}</a>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Couronne (arc/ovale) de ~13 photos inclinées** encadrant un **titre central** —
   c'est LA signature ; garder les positions en ovale + rotations variées + lévitation.
2. Fond **brun très sombre `#1a1108`**, typo **Hanken Grotesk `font-medium`**.
3. Titre central `text-4xl … md:text-6xl font-medium leading-[1.1]` blanc, sur
   2 lignes, + sous-titre + **CTA pilule blanche**.
4. Touches brun/ocre, ambiance chaude et éditoriale.

## 4. Sections du corps

Fond `ink`, `py-24 md:py-32`. Sections (riches) : CITATION mise en avant, SERVICES
numérotés (01–04 : Portraits, Mariages, Famille, Marques), RÉALISATIONS/WORKS
(grandes photos), TÉMOIGNAGES, FAQ (« Comment réserver une séance ? »), GALERIE.
Titres Hanken medium. FOOTER `ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français sensible, narratif, premium. Titre = promesse intemporelle (« Des photos
intemporelles qui racontent votre histoire »). Services numérotés. Accroches sur
l'émotion, l'histoire, la lumière. Raffiné et chaleureux.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, les photos de l'arc, le nombre de services,
le nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, brun sombre + Hanken Grotesk), structure du header
(**couronne de photos en ovale + titre central**), la disposition en arc, l'ambiance chaude.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en brun sombre + Hanken Grotesk + couronne de photos ;
jamais une couleur froide ou une mise en page plate.
