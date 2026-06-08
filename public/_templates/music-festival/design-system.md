# Design System — music-festival (festival de musique, affiche)

## 1. ADN

Site de **festival de musique, type affiche/poster** : fond **noir**, texte crème,
accent **orange vif** (#fe470d), micro-labels en **monospace** (Geist Mono). La
signature : une **bande-image en haut** surmontée d'un **wordmark géant** (la
date/édition du festival, ex. « SOL'26 ») en `text-[20vw]` qui déborde, puis un
bloc nom + infos + carte billetterie. Énergie brute, line-up, dates, tickets. À
l'opposé du jazz feutré : ici **dark mais punchy, mono, orange, format affiche**.

## 2. Tokens (verrouillés)

Polices : **Geist** (titres/corps) + **Geist Mono** (labels).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#000000', paper:'#f6f6ea', panel:'#343434', panel2:'#3d3d3d', orange:'#fe470d', blue:'#0000ee', muted:'#9a9a90' },
  fontFamily: { sans:['Geist','system-ui','sans-serif'], mono:['"Geist Mono"','ui-monospace','monospace'] },
  letterSpacing: { label:'0.16em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Geist',system-ui,sans-serif; background:#000; color:#f6f6ea; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0 bg-ink/85 backdrop-blur-sm`, liens **mono**, CTA **orange** carré.

```html
<header class="fixed top-0 inset-x-0 z-50 bg-ink/85 backdrop-blur-sm text-paper">
  <nav class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
    <a href="#top" data-sg-path="brand" class="font-sans font-semibold tracking-tight">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 font-mono text-[12px] tracking-label uppercase text-muted">
      <li><a href="#lineup" data-sg-path="nav[0]" class="hover:text-paper transition-colors">Programmation</a></li>
      <li><a href="#dates" data-sg-path="nav[1]" class="hover:text-paper transition-colors">Dates</a></li>
    </ul>
    <a href="#tickets" data-sg-path="cta" class="font-mono text-[12px] tracking-label uppercase bg-orange text-white rounded-sm px-4 py-2 hover:opacity-90 transition-opacity">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — bande-image + wordmark date géant + nom/infos

```html
<section id="top" class="relative bg-ink text-paper overflow-hidden pt-16">
  <!-- Bande-image avec WORDMARK GÉANT (date/édition) qui déborde en bas -->
  <div class="relative h-[34vh] min-h-[220px] overflow-hidden">
    <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover opacity-80" />
    <h2 data-sg-path="wordmark" class="absolute -bottom-2 left-4 md:left-6 font-sans font-semibold leading-none text-paper/95 text-[20vw] md:text-[18vw] tracking-tight pointer-events-none">{ÉDITION, ex. SOL'26}</h2>
  </div>
  <!-- Nom + infos + carte -->
  <div class="mx-auto max-w-7xl px-6 pb-24 pt-10 grid md:grid-cols-[1fr_360px] gap-10 items-start">
    <div>
      <h1 data-sg-path="hero.title" class="font-sans font-medium leading-[1.02] text-5xl md:text-7xl lg:text-[80px]">{NOM DU FESTIVAL}</h1>
      <p data-sg-path="hero.tagline" class="mt-6 max-w-md font-sans text-sm text-muted leading-relaxed">{ACCROCHE}</p>
    </div>
    <!-- Carte billetterie (panel) -->
    <div class="bg-panel rounded-md p-6">
      <h3 data-sg-path="hero.cardTitle" class="font-sans text-lg text-paper">{TITRE CARTE}</h3>
      <a href="#tickets" data-sg-path="hero.cardCta" class="mt-4 inline-block font-mono text-[12px] tracking-label uppercase bg-orange text-white rounded-sm px-4 py-2">{CTA}</a>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Wordmark date/édition géant** `text-[20vw] md:text-[18vw]` qui déborde
   (`-bottom-2`) sur la bande-image du hero — LA signature affiche.
2. Fond **noir**, accent **orange `#fe470d`** sur les CTA (carrés `rounded-sm`).
3. **Labels monospace** `tracking-label uppercase` (nav, sections, infos).
4. Nom du festival en Geist `text-5xl md:text-7xl lg:text-[80px]`, + **carte
   billetterie** `bg-panel` à droite du hero.

## 4. Sections du corps

Fond noir, cartes `bg-panel rounded-md`, labels mono. Sections festival :
PROGRAMMATION/LINE-UP (grille d'artistes), DATES (jours/scènes), BILLETTERIE
(formules de pass, l'une en `orange`), INFOS PRATIQUES (lieu, accès), GALERIE.
FOOTER noir, « Propulsé par Akyra ».

## 5. Ton éditorial

Français punchy, registre festival/live. Le wordmark = l'édition (ex. « SOL'26 »).
Le titre = le nom du festival. Labels mono courts. Accroches énergiques (line-up,
scènes, ambiance). Pas de mièvrerie.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre d'artistes/dates/pass, le
nom + l'édition (wordmark), retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + orange + Geist Mono), structure du header
(bande-image + wordmark date géant + carte billetterie), accent orange, labels mono.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + orange + mono ; jamais une couleur hors palette.
