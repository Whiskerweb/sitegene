# Design System — sereenity (coach bien-être, chaleureux terracotta + serif)

> Spec issue d'une extraction au pixel du site rendu (getComputedStyle @1440px).
> Objectif : permettre une reproduction **1:1** en HTML + Tailwind (CDN) + GSAP/ScrollTrigger,
> annotée `data-sg-path`/`data-sg-img` pour l'éditeur.

## 1. ADN

Site de **coach en développement personnel / bien-être** : chaleureux, organique,
apaisant, premium. Fond **crème** dominant (#fcfaf7 page, #f8f3ec cartes), encre
profonde #0d0503 pour les titres, accent **terracotta argileux** #8d6959 (corps &
labels), accent vif **pêche/abricot** #e1937d (chiffres, noms, étoiles), accent
**vert sauge** #8e9867 réservé aux **boutons** (toujours en pilule). La signature
absolue : **tous les titres en Castoro serif**, fw400, **tracking négatif** marqué
(h1 −2px), posés en grand ; le titre hero est surligné par une **forme crème
organique** derrière le texte. Composition aérée, **tout est arrondi** (cartes 24px,
grands blocs 32px, pilules `rounded-full`), photographie bien-être chaude
(crème/beige/terracotta). Ce qui le distingue d'un site clinique : la douceur serif
+ les **pastilles flottantes** sur les images et un **hero en 3 colonnes
asymétriques**.

## 2. Tokens (verrouillés)

Stack : HTML + Tailwind (CDN) + GSAP/ScrollTrigger. Google Fonts : **Castoro**
(titres — 400 + italic) et **Nunito** (corps & UI — 400/500/600/700). **Aucune
autre police.**

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:   '#0d0503',  /* titres, texte fort, sections sombres */
    clay:  '#8d6959',  /* terracotta : corps, labels, icônes de pastilles */
    peach: '#e1937d',  /* pêche : chiffres, noms de témoins, étoiles */
    sage:  '#8e9867',  /* vert sauge : EXCLUSIVEMENT les boutons (pilules) */
    cream: '#f8f3ec',  /* cartes claires, conteneurs */
    paper: '#fcfaf7',  /* fond de page */
    soft:  '#fbf9f5',  /* texte crème sur boutons/fonds sombres */
    yellow:'rgba(243,222,138,0.4)', /* forme de fond derrière les témoignages */
    muted: '#70747a',
  },
  fontFamily: { serif:['Castoro','Georgia','serif'], sans:['Nunito','system-ui','sans-serif'] },
  borderRadius: { card:'24px', xl2:'32px', pill:'30px' },
  maxWidth: { site:'1280px' },
}}};
```

CSS global (tel quel) :

```css
*, *::before, *::after { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { font-family:'Nunito',system-ui,sans-serif; background:#fcfaf7; color:#0d0503; margin:0; -webkit-font-smoothing:antialiased; }
h1,h2,h3,h4 { font-family:'Castoro',Georgia,serif; font-weight:400; margin:0; }
h1 { font-size:68px; line-height:1.15; letter-spacing:-2px; }   /* échelle desktop */
h2 { font-size:56px; line-height:1.2;  letter-spacing:-1.5px; }
h3 { font-size:36px; line-height:1.4;  letter-spacing:-1px; }
h4 { font-size:24px; line-height:1.4;  letter-spacing:-0.5px; }
/* Surlignage crème organique derrière le titre hero (effet marqueur) */
.title-mark { -webkit-box-decoration-break:clone; box-decoration-break:clone; background:#fffdf9; padding:.02em .18em; border-radius:18px; }
/* Bandeau de témoignages en défilement (marquee) */
@keyframes seren-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.seren-marquee { animation:seren-marquee 40s linear infinite; }
@media (prefers-reduced-motion:reduce){ .seren-marquee{animation:none} }
```

**Animations (GSAP/ScrollTrigger)** — révélation **fade + montée** (opacity 0→1,
translateY ~28px→0, ~0.8s, ease `power3.out`, **une fois**, déclenchée à l'entrée
viewport). En plus : **compteurs** qui s'incrémentent de 0 à la valeur (section
chiffres), **marquee** de témoignages, **accordéon** FAQ (hauteur animée + icône
qui pivote), **léger zoom** image au survol des cartes. Jamais de slide latéral ni
de zoom agressif à l'entrée.

## 3. HEADER — signature (reconstruction au millimètre)

### 3a. NAV

`fixed top-0`, fond transparent en haut (sur `paper`). Marque à gauche
(**pastille fleur terracotta** + nom en Castoro), liens **centrés** (Nunito 16px
fw500, `ink`), **CTA pilule SAGE** à droite (texte `soft`, Nunito fw700). Le CTA
n'est JAMAIS encre — toujours `bg-sage rounded-full`.

```html
<header class="fixed inset-x-0 top-0 z-50">
  <nav class="mx-auto flex max-w-site items-center justify-between px-8 py-5">
    <a href="#top" class="flex items-center gap-2.5">
      <span class="flex h-7 w-7 items-center justify-center rounded-full bg-clay"><span class="h-2 w-2 rounded-full" style="background:#e1937d"></span></span>
      <span data-sg-path="brand" class="font-serif text-xl text-ink" style="letter-spacing:-.5px">{MARQUE}</span>
    </a>
    <ul class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex font-sans text-base font-medium text-ink/80">
      <li><a data-sg-path="nav[0]" href="#apropos" class="hover:text-clay">{NAV 1}</a></li>
      <li><a data-sg-path="nav[1]" href="#services" class="hover:text-clay">{NAV 2}</a></li>
      <li><a data-sg-path="nav[2]" href="#tarifs" class="hover:text-clay">{NAV 3}</a></li>
    </ul>
    <a href="#tarifs" data-sg-path="nav.cta" class="rounded-full bg-sage px-6 py-3 font-sans text-base font-bold" style="color:#fbf9f5">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — 3 colonnes asymétriques

Grille `max-w-site` en **trois colonnes** (~ gauche 1fr · centre 448px · droite
330px), alignées en haut. **Gauche** : badge note (5 étoiles `peach` + « 4,X » +
mention `clay` 14px) → **H1 Castoro 68px** (`letter-spacing:-2px`) avec un fragment
sur fond `.title-mark` → accroche `clay` 16px → **CTA pilule sage** → trio
d'avatars ronds + « {N}+ » en `peach` fw700 + libellé `clay`. **Centre** : grande
**image portrait** `rounded-[32px]` (~448×592) + **pastilles flottantes** (pilules
`bg-white rounded-full`, texte `clay` fw700 + petite icône ; une pastille haute sur
fond `clay/90` texte crème). **Droite** : **H3 36px** → accroche `clay` → ligne
« {play} » (rond `bg-clay` + icône play crème) + libellé fw700 ink → 2e image
`rounded-[32px]` (~303×354) + pilule « {tag} ».

```html
<section id="top" class="px-5 pt-32 pb-16">
  <div class="mx-auto grid max-w-site items-start gap-10 lg:grid-cols-[minmax(0,1fr)_448px_330px]">
    <!-- GAUCHE -->
    <div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 text-sm font-medium" style="color:#fbf9f5">★ <span data-sg-path="hero.note">{NOTE}</span></span>
        <span data-sg-path="hero.noteLabel" class="text-sm font-medium text-clay">{MENTION AVIS}</span>
      </div>
      <h1 class="mt-7 max-w-[560px] text-ink"><span class="title-mark" data-sg-path="hero.title">{TITRE — promesse de mieux-être}</span></h1>
      <p data-sg-path="hero.subtitle" class="mt-7 max-w-[400px] text-clay">{ACCROCHE ≤ 120 car.}</p>
      <a href="#tarifs" data-sg-path="hero.cta" class="mt-8 inline-flex rounded-full bg-sage px-7 py-3.5 font-bold" style="color:#fbf9f5">{CTA}</a>
      <div class="mt-12 flex items-center gap-4">
        <div class="flex -space-x-3">
          <img data-sg-img="hero.avatars[0]" class="h-10 w-10 rounded-full object-cover ring-2 ring-white" src="{AVATAR}"/>
          <!-- 3 avatars -->
        </div>
        <p class="max-w-[210px] text-sm font-bold leading-snug text-clay"><span class="text-peach" data-sg-path="hero.proof">{N}+</span> <span data-sg-path="hero.proofLabel">{LIBELLÉ preuve sociale}</span></p>
      </div>
    </div>
    <!-- CENTRE -->
    <div class="relative">
      <div class="overflow-hidden rounded-[32px]"><img data-sg-img="hero.image" class="h-[560px] w-full object-cover object-top" src="{PORTRAIT bien-être}"/></div>
      <span class="absolute right-4 top-1/3 inline-flex items-center gap-2 rounded-full bg-clay/90 px-4 py-2 text-sm" style="color:#fbf9f5"><span class="h-2 w-2 rounded-full" style="background:#e1937d"></span>{PASTILLE}</span>
      <div class="absolute inset-x-3 bottom-4 flex flex-wrap justify-center gap-2.5">
        <!-- pilules blanches : icône clay + libellé clay fw700 -->
        <span data-sg-path="hero.pills[0]" class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-clay shadow-sm">{PASTILLE}</span>
      </div>
    </div>
    <!-- DROITE -->
    <div>
      <h3 data-sg-path="hero.side.title" class="text-ink">{SOUS-TITRE émotionnel}</h3>
      <p data-sg-path="hero.side.subtitle" class="mt-3 max-w-[290px] text-clay">{1 phrase}</p>
      <a href="#apropos" class="mt-5 inline-flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-full bg-clay" style="color:#fbf9f5">▶</span><span class="font-bold text-ink" data-sg-path="hero.side.play">{LIBELLÉ play}</span></a>
      <div class="relative mt-7 overflow-hidden rounded-[32px]"><img data-sg-img="hero.side.image" class="h-[300px] w-full object-cover" src="{2e IMAGE}"/><span class="absolute right-3 top-3 rounded-full bg-clay/90 px-3 py-1.5 text-sm font-bold" style="color:#fbf9f5" data-sg-path="hero.side.tag">{TAG}</span></div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Titres Castoro serif fw400 à tracking négatif** (h1 −2px) — l'élégance serif EST le style.
2. **CTA toujours en pilule `bg-sage` `rounded-full`** texte crème — jamais encre, jamais une autre couleur.
3. **Hero 3 colonnes** : texte+avatars / grande image à pastilles / mini-colonne play + 2e image.
4. **Surlignage crème `.title-mark`** derrière le titre hero.
5. Accents : `clay` (corps/labels/icônes), `peach` (chiffres/noms/étoiles), `sage` (boutons). **Aucune couleur froide.**
6. **Tout est arrondi** : cartes 24px, grands blocs 32px, pilules `rounded-full`. Photographie chaude crème/terracotta.

## 4. Sections du corps (ordre du DOM)

En-tête de section type : éyebrow Nunito **14px fw700** `ink` (court) puis **H2
Castoro 56px** `ink`. Conteneur `max-w-site mx-auto`, `py` généreux. Cartes claires
`bg-white` ou `bg-cream` en `rounded-card` (24px) ; grands conteneurs `bg-cream
rounded-[32px]`.

- **ESPACE D'ÉCOUTE** : carte `bg-cream rounded-[32px]` avec image (nature morte
  chaude) + grand **H2** + accroche `clay` ; petit bouton rond play `bg-white`.
- **EXPERTISE / CHIFFRES ÉQUIPE** : bloc mêlant carte `bg-cream` (H4 + texte) et
  **gros chiffres** (`+0` / `0%`, Castoro 36–60px) qui **s'incrémentent au scroll**,
  + portrait.
- **SERVICES** : éyebrow + **H2** + lien **pilule sage** « {voir tout} » ; puis
  **4 grandes lignes** pleine largeur (numéro/icône `clay` + **H3 36px** +
  description `clay`), séparées par un filet `border-b border-clay/15`, légère
  surbrillance au survol. (3 à 6 lignes.)
- **ÉTAPES** : conteneur `bg-cream rounded-[32px]`, image à gauche + **H2** +
  **2 à 3 sous-étapes** (icône + H4 + texte) + **CTA pilule sage**.
- **POURQUOI NOUS** : éyebrow + **H2 centré** + **3 cartes `bg-white rounded-card`**
  (icône ronde + H4 + texte `clay`).
- **VALEURS / SLOGAN** : **tags valeurs** dispersés (Nunito 16 fw500, `clay`) autour
  d'un **H3 40px centré** ; petit badge image rond.
- **GALERIE** (« coulisses ») : éyebrow + **H2** + collage d'images `rounded-card`.
- **TÉMOIGNAGES** : éyebrow + **H2** ; **forme de fond jaune** `bg-yellow` ; cartes
  `bg-white rounded-card` (citation **20px** `ink`, avatar rond + **nom `peach`
  fw700** + rôle) défilant en **marquee** (`.seren-marquee`, pause au survol). 3–4.
- **CHIFFRES CLÉS** : conteneur `bg-cream rounded-[32px]`, **H2** + rangée de **tags
  services** (`clay` 18px) + **4 compteurs** Castoro **64px** (incrément au scroll)
  + libellés 14px.
- **TARIFS** : éyebrow + **H2 centré** + **toggle Mensuel/Annuel** (pilule active
  `bg-ink soft`) + **3 cartes `bg-white rounded-card`** (H4 + texte + **prix Castoro
  56px** + `/unité` H4 + 4 features à coche `sage` + **CTA pilule sage**). 2–4.
- **FAQ** : éyebrow + **H2** + accordéon ; item ouvert `bg-cream rounded-[16px]`,
  question **H4 24px**, icône `+` qui pivote, réponse `clay` en hauteur animée. 4–6.
- **CTA FINAL** : image pleine largeur `rounded-[32px]` + voile sombre `bg-ink/78` ;
  logo + **H2 56px centré crème** + **CTA pilule blanche** (texte ink).
- **FOOTER** : `bg-cream` — logo + tagline `clay` + colonnes (Liens / Contact /
  Adresse, titres Nunito 20px fw700) + icônes sociales + barre basse (« DEPUIS {AN} »
  + copyright + « Propulsé par Akyra »).

## 5. Ton éditorial

Français chaleureux, doux, rassurant ; voix à la **première personne** (« je »,
« mon accompagnement »). Jamais clinique ni corporate. H1 = promesse de mieux-être
(une phrase, un fragment émotionnel sur le surlignage crème). Accroche ≤ 120 car.
Éyebrows = 2–4 mots. Titres de service = 2–4 mots. FAQ = vraies questions de
prospects (confidentialité, recommandation, visio, doute, déroulé). Les chiffres
rassurent : note d'avis, personnes accompagnées, % d'amélioration, années
d'expérience. Champ lexical : écoute, bienveillance, sans jugement, à votre rythme,
espace sûr, clarté, confiance, sérénité.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes (ton §5 + longueurs), toutes les photos
(garder une photographie bien-être chaude, lumière douce, tons crème/terracotta),
le nombre d'items (services 3–6, étapes 2–3, atouts 3, témoignages 3–4, tarifs 2–4,
FAQ 4–6, tags 6–12), retirer une section sans matière, en ajouter une en
RÉUTILISANT l'en-tête type (éyebrow 14px fw700 + H2 Castoro 56px) + cartes
`bg-white/cream rounded-card`.

**VERROUILLÉ** : tokens §2 (Castoro + Nunito ; ink/clay/peach/sage/cream), titres
**Castoro fw400 à tracking négatif**, **CTA toujours pilule `sage`**, surlignage
`.title-mark` du hero, **hero 3 colonnes**, pastilles flottantes sur images, rayons
généreux (24/32/full), la révélation **fade + montée** unique, les compteurs au
scroll. **Aucune couleur froide** (bleu, gris acier) nulle part.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre client** (ex. bandeau « agrément »/« 1ère séance offerte ») : l'intégrer
DANS le langage du template — pilule `bg-clay`/`bg-cream` ou second badge sur la photo
du hero ; jamais un élément d'un autre style. En cas de doute : la solution qui
réutilise pilule + Castoro + terracotta/sauge est la bonne.
