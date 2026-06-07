# Design System — electrician-pro (« Ohmly »)

## 1. ADN

Site vitrine d'électricien **clair, net et énergique** : fond blanc dominant, un
seul accent **orange électrique** (#FF7417) qui claque sur des noirs profonds,
typographie Manrope extra-bold très serrée pour les titres. L'effet recherché :
la fiabilité d'un artisan sérieux + la modernité d'une marque tech. Ce qui le
distingue : un hero **centré et aéré** couronné d'une étoile-rating, posé sur un
halo orange ultra-subtil, suivi d'une grande photo panoramique à coins très
arrondis portant un badge flottant — jamais de hero sombre, jamais d'image
derrière le titre.

## 2. Tokens (verrouillés)

Stack : HTML + Tailwind CDN + GSAP/ScrollTrigger. Polices Google Fonts :
**Manrope** (500/600/700/800 — titres) et **Inter** (400/500/600 — corps).

```js
tailwind.config = {
  theme: { extend: {
    colors: {
      primary: '#FF7417',    /* orange accent — CTA, puces, étoiles, icône logo */
      primaryDark: '#FF7A30',
      ink:     '#0A0A0A',    /* titres + sections sombres (footer, carte stat) */
      bg:      '#F2F2F2',    /* fond des cartes claires (FAQ, témoignages, CTA) */
      muted:   '#696969',    /* texte courant atténué */
      border:  '#EDEDED',    /* bordures de cartes et de la nav */
      star:    '#FF7417',
    },
    fontFamily: {
      sans:    ['"Inter"', 'sans-serif'],
      display: ['"Manrope"', 'sans-serif'],
    },
    borderRadius: { 'xl2': '18px', 'xl3': '28px' },
  }}
};
```

CSS custom global (à inclure tel quel) :

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; background: #fff; color: #0A0A0A; margin: 0; }
h1,h2,h3 { font-family: 'Manrope', sans-serif; }
/* Halo décoratif du hero : arc orange à 7% d'opacité partant du coin haut-droit */
.hero-lines { background-image:
    radial-gradient(120% 100% at 100% 0%, rgba(255,116,23,0.07) 0%, transparent 45%); }
/* Soulignement animé des liens nav */
.nav-link { position: relative; }
.nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#FF7417; transition:width .25s; }
.nav-link:hover::after { width:100%; }
```

## 3. HEADER — signature du template (reconstruction au millimètre)

### 3a. NAV (barre de navigation)

Structure exacte :

```html
<nav class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <!-- 1) Logo : carré orange arrondi 32px + éclair blanc + nom de marque -->
    <a href="#" class="flex items-center gap-2">
      <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>
      </div>
      <span class="text-ink font-display font-extrabold text-lg tracking-tight">{MARQUE}</span>
    </a>
    <!-- 2) Liens : cachés sous md ; lien actif = text-ink font-semibold ;
         autres = text-muted hover:text-ink font-medium ; tous text-sm + .nav-link -->
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="nav-link text-ink text-sm font-semibold transition-colors">Accueil</a>
      <a href="#about" class="nav-link text-muted hover:text-ink text-sm font-medium transition-colors">À propos</a>
      <!-- … 4 à 6 liens d'ancres au même format … -->
    </div>
    <!-- 3) CTA : pilule orange pleine, toujours visible (même en mobile) -->
    <a href="#" class="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-105 transition-all">{CTA_NAV}</a>
  </div>
</nav>
```

Points non négociables : nav **sticky** sur fond `bg-white/90` + `backdrop-blur` +
fine bordure basse `border-border` ; le logo est TOUJOURS un carré `w-8 h-8
bg-primary rounded-lg` contenant un pictogramme blanc (éclair) ; le soulignement
hover des liens est l'animation `.nav-link::after` (jamais un autre effet).

### 3b. HERO

Composition : **deux étages**. Étage 1 = bloc de texte centré, étroit
(`max-w-5xl`), sur fond blanc orné du halo `.hero-lines`. Étage 2 = grande photo
panoramique pleine largeur de conteneur (`max-w-6xl`), coins `rounded-xl3` (28px),
badge flottant en bas-droite. La photo est SOUS le texte, jamais derrière.

```html
<section class="relative bg-white hero-lines overflow-hidden">
  <!-- ÉTAGE 1 : texte centré -->
  <div class="max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">
    <!-- a) Rating : 5 étoiles oranges + mention avis, AVANT le titre -->
    <div class="inline-flex items-center gap-2 mb-7">
      <span class="text-star text-sm tracking-tight">★★★★★</span>
      <span class="text-muted text-sm font-medium">{NOTE, ex. « 4,8+ Avis »}</span>
    </div>
    <!-- b) H1 : Manrope extra-bold, ÉNORME et serré, max 2 lignes -->
    <h1 class="text-ink font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl mx-auto mb-6">
      {TITRE — promesse métier, ≤ 48 caractères}
    </h1>
    <!-- c) Tagline : une phrase, colonne étroite -->
    <p class="text-muted text-base md:text-lg max-w-xl mx-auto mb-8">
      {ACCROCHE — bénéfices concrets, 1 phrase, ≤ 140 caractères}
    </p>
    <!-- d) CTA unique : pilule orange, padding généreux -->
    <a href="#services" class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-7 py-3.5 rounded-full hover:brightness-105 transition-all text-sm">
      <span>{CTA — verbe d'action}</span>
    </a>
  </div>
  <!-- ÉTAGE 2 : photo panoramique + badge flottant -->
  <div class="max-w-6xl mx-auto px-6 pb-16">
    <div class="relative rounded-xl3 overflow-hidden shadow-xl">
      <img src="{PHOTO métier}" alt="" class="w-full h-[420px] md:h-[520px] object-cover" />
      <!-- badge : pilule blanche bas-droite avec point orange -->
      <div class="absolute bottom-5 right-5 bg-white text-ink text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary"></span>
        <span>{BADGE court, ex. zone d'intervention}</span>
      </div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Hero **centré**, texte au-dessus / photo en dessous — jamais en colonnes, jamais d'image de fond derrière le titre.
2. H1 `text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight` en Manrope `font-extrabold` — l'énormité serrée du titre EST le style.
3. Halo `.hero-lines` (orange 7% coin haut-droit) — discret mais obligatoire.
4. Étoiles ★★★★★ couleur `star` + note AVANT le titre — la preuve sociale ouvre la page.
5. Photo `h-[420px] md:h-[520px]` à coins 28px + badge pilule flottant bas-droite avec point orange.
6. Toutes les pilules (CTA, badges) sont `rounded-full` ; les cartes sont `rounded-xl2` (18px) ou `rounded-xl3` (28px). Aucun angle vif nulle part.

## 4. Sections du corps (ordre du DOM)

Pattern d'en-tête commun à chaque section : label éyebrow
(`inline-flex items-center gap-2 text-primary font-semibold text-xs uppercase
tracking-wider mb-4` précédé d'un point `w-1.5 h-1.5 rounded-full bg-primary`)
puis H2 `text-ink font-extrabold text-4xl md:text-5xl tracking-tight
max-w-2xl mx-auto` — le tout centré (`text-center mb-12`). Toutes les sections :
`bg-white py-20 px-6` avec conteneur `max-w-7xl mx-auto`.

- **SERVICES** : grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` de
  cartes-photos `aspect-[4/3] rounded-xl2` SANS texte sous l'image : le titre vit
  dans une **pilule flottante** en haut-gauche (`absolute top-3 left-3 bg-white/95
  backdrop-blur rounded-full pl-4 pr-2 py-1.5`) contenant le nom + un rond orange
  `w-7 h-7` avec flèche ↗ blanche. Hover : `group-hover:scale-105` sur l'image
  (transition 500ms). 6 items par défaut (3 à 6 acceptés).
- **WHY (bento)** : grille `md:grid-cols-3 gap-5` mélangeant cartes claires
  `bg-bg rounded-xl2 p-8`, UNE carte sombre `bg-ink` contenant la statistique
  (gros chiffre + libellé), et des cartes-photos `min-h-[200px]`. C'est le seul
  endroit avec une carte noire en plein corps de page.
- **TESTIMONIALS** : grille `md:grid-cols-2 gap-6`, cartes `bg-bg rounded-xl2 p-7`
  avec citation, nom, rôle. 4 items.
- **PRICING** : `lg:grid-cols-2` — à gauche une photo `min-h-[420px]`, à droite
  2 cartes `bg-bg p-8` (tarif horaire avec gros prix + grille de features
  `grid-cols-2`, puis devis projet avec CTA pilule orange).
- **FAQ** : liste de 5 items accordéon `bg-bg rounded-xl2`, bouton plein largeur
  `px-6 py-5`, icône `+` orange qui tourne à 45° à l'ouverture (`.faq-icon`),
  réponse en `max-height` animé.
- **CTA FINAL** : panneau `bg-bg rounded-xl3 px-8 md:px-14 py-14 md:grid-cols-2` —
  texte + bouton-téléphone pilule orange à gauche, photo `rounded-xl2` à droite.
- **FOOTER** : `bg-ink text-white pt-16 pb-8` — logo (même carré orange, nom en
  `text-primary`), tagline `text-white/50`, liens `text-white/70 hover:text-white`
  alignés à droite, 3 ronds sociaux `bg-white/10`, barre basse `border-t
  border-white/10` avec copyright + « Propulsé par Akyra ».

## 5. Ton éditorial

Français impeccable, ton d'artisan expert : direct, rassurant, concret. Jamais de
superlatifs creux ni d'anglicismes. H1 = promesse métier ≤ 48 caractères.
Tagline = 1 phrase ≤ 140 caractères mentionnant agrément/rapidité/garantie.
Labels eyebrow = 1-2 mots. Titres de services = 2-4 mots. FAQ = vraies questions
de clients (urgence, agrément, tarifs, devis, délais). Les chiffres rassurent :
note d'avis, années d'expérience, interventions réalisées, délais de réponse.

## 6. Règles d'adaptation & verrous (pour Mistral)

**TU PEUX adapter librement** : tous les textes (en respectant le ton §5 et les
longueurs max), toutes les photos, le nombre d'items des grilles (services 3-6,
FAQ 4-6, témoignages 2-4), retirer une section du corps si le client n'a pas la
matière (pricing, testimonials), ajouter une section du corps en RÉUTILISANT le
pattern d'en-tête commun + cartes `bg-bg rounded-xl2` + grilles existantes.

**VERROUILLÉ — ne jamais modifier** : les tokens (§2, couleurs et polices), la
structure du header (§3 : nav sticky + hero centré 2 étages), l'animation
`.nav-link`, le halo `.hero-lines`, les rayons (`rounded-full` pilules, 18/28px
cartes), le pattern d'en-tête de section, le footer sombre.

**Demande client hors-cadre** (ex. « bandeau urgence 24/7 dans le header ») :
intègre-la DANS le langage du template — ici, une pilule `bg-ink text-white
text-xs` au-dessus de la nav ou un second badge pilule sur la photo du hero,
jamais un élément d'un autre style (pas de bannière rouge, pas de gradient
étranger). En cas de doute : la solution qui réutilise pilule + point orange +
Manrope bold est la bonne.
