# Design System — eloctix (électricien éditorial premium)

## 1. ADN

Site d'électricien **éditorial et affirmé**, à mi-chemin entre le magazine et
l'agence. Dominante **bleu marine profond** (#1b1f48) sur fonds clairs, un accent
**orange brûlé** (#f1542a) utilisé avec parcimonie. La signature absolue : un
**titre de hero gigantesque** en capitales (jusqu'à 7,5 rem / 120 px), graisse
extra-bold, interlignage ultra-serré (0.86), DANS lequel sont **incrustées des
vignettes-images arrondies** au fil des mots — le titre devient une composition
typographique-photographique. Rien de timide : on assume des blocs massifs, des
grilles asymétriques, des compteurs de chiffres. À l'opposé d'electrician-pro
(léger, centré, blanc) : ici c'est dense, marine, éditorial.

> Note technique : le template original est un SPA React + **framer-motion**
> (révélations au scroll, compteurs animés, parallaxe). Une reconstruction HTML
> statique reproduit la **mise en page, la DA et la structure** au plus près ;
> les animations sont décrites mais ne s'exécutent pas en statique. La fidélité
> visuelle porte sur la composition, pas sur le mouvement.

## 2. Tokens (verrouillés)

Polices Google Fonts : **Plus Jakarta Sans** (500/600/700/800 — titres `font-display`)
et **Inter** (400/500/600 — corps).

```js
tailwind.config = {
  theme: { extend: {
    colors: {
      'ox-navy':   '#1b1f48',   /* marine principal : titres, fond footer, boutons secondaires */
      'ox-navy2':  '#16193a',   /* marine plus profond : cartes sombres, panneaux */
      'ox-orange': '#f1542a',   /* accent : CTA primaire, hover liens, numéros */
      'ox-sky':    '#eef1f6',   /* fond de section clair (bleu-gris très pâle) */
      'ox-mut':    '#6c7080',   /* texte secondaire */
      'ox-line':   'rgba(27,31,72,0.10)', /* bordures (marine 10%) */
    },
    fontFamily: {
      display: ['"Plus Jakarta Sans"', 'sans-serif'],
      sans:    ['"Inter"', 'sans-serif'],
    },
  }}
};
```

CSS custom global — **inclut les 4 effets « wordmark » qui sont la signature
visuelle du template** (texte géant traité : rempli pâle, contour, ou rayé) :

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; background: #fff; color: #1b1f48; margin: 0; }
h1,h2,h3 { font-family: '"Plus Jakarta Sans"', sans-serif; }

/* Wordmark rempli très pâle (sur fond clair) */
.wordmark-light { color: #1b1f480f; }
/* Wordmark CONTOUR blanc (sur panneau sombre) : texte transparent, filet blanc */
.wordmark-stroke { -webkit-text-stroke: 1.5px rgba(255,255,255,.12); color: transparent; }
/* Wordmark CONTOUR marine (sur fond clair) */
.wordmark-stroke-navy { -webkit-text-stroke: 1.5px rgba(27,31,72,.45); color: transparent; }
/* Wordmark RAYÉ : texte rempli de fines lignes marine horizontales, fondu de masque */
.wordmark-striped {
  background-image: repeating-linear-gradient(180deg,#1b1f48 0px,#1b1f48 4px,transparent 4px,transparent 11px);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-mask-image: linear-gradient(90deg,rgba(0,0,0,.12) 0%,#000 65%);
  mask-image: linear-gradient(90deg,#0000001f,#000 65%);
}
```

## 3. HEADER — signature du template (reconstruction au millimètre)

### 3a. NAV

Barre claire sur fond blanc, liens en **petites capitales marine** qui passent à
l'orange au survol.

```html
<header class="bg-white">
  <div class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
    <!-- Logo : pastille marine + nom display extra-bold -->
    <a href="#" class="flex items-center gap-2.5 text-ox-navy">
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-ox-orange">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>
      </span>
      <span class="font-display text-xl font-extrabold tracking-tight">{MARQUE}</span>
    </a>
    <!-- Liens : cachés sous md ; petites capitales -->
    <nav class="hidden items-center gap-9 md:flex">
      <a href="#services" class="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide text-ox-navy/80 transition-colors hover:text-ox-orange">Prestations</a>
      <!-- … 4 à 6 liens identiques … -->
    </nav>
    <!-- CTA : bouton marine plein (PAS orange dans la nav) -->
    <a href="#contact" class="mt-1 inline-flex items-center gap-2 rounded-xl bg-ox-navy px-5 py-3 text-[13px] font-semibold uppercase tracking-wide text-white">{CTA_NAV}</a>
  </div>
</header>
```

Points non négociables : liens `text-[13px] font-semibold uppercase tracking-wide
text-ox-navy/80 hover:text-ox-orange` ; logo = pastille ronde orange + nom
`font-display font-extrabold` ; CTA nav = `rounded-xl bg-ox-navy` (marine), pas
orange.

### 3b. HERO — composition typographique au WORDMARK GÉANT (cœur de la signature)

**Ce qui rend ce header unique** : le hero n'est PAS un simple titre. C'est une
**composition typographique empilée** où des **mots géants traités** (taille en
`vw`, donc démesurés — jusqu'à `text-[24vw]`) forment le DÉCOR, et le contenu
réel (accroche, CTA, photo) se superpose. Ces mots géants utilisent les effets
`.wordmark-*` (rayé, contour, rempli pâle). C'est CET arrière-plan typographique
qui signe le template — sans lui, le header est générique.

Le hero a TROIS strates, dans cet ordre vertical :

**Strate 1 — LE TITRE GÉANT SOLIDE (élément dominant, en haut).** C'est le plus
gros texte de la page : un titre de 3 mots/lignes en **marine PLEIN** (`text-ox-navy`,
PAS un contour, PAS pâle), capitales, extra-bold, interligne ultra-serré, AVEC
une **vignette-image arrondie incrustée dans les mots**. Il occupe la moitié
gauche, la photo principale est à droite.

```html
<section class="relative overflow-hidden bg-white pt-24 md:pt-28">
  <div class="max-w-7xl mx-auto px-6 grid items-start gap-8 md:grid-cols-[1.25fr_0.75fr]">
    <!-- GAUCHE : titre géant SOLIDE marine + vignette inline, puis accroche + CTA -->
    <div>
      <h1 class="font-display text-6xl font-extrabold uppercase leading-[0.92] tracking-tight text-ox-navy sm:text-7xl lg:text-8xl">
        {MOT1}
        {MOT2}
        <img src="{PHOTO_INLINE}" class="inline-block h-12 w-24 rounded-xl object-cover align-middle sm:h-14 sm:w-32 lg:h-16 lg:w-40" alt="" />
        {MOT3}
      </h1>
      <p class="mt-6 max-w-md text-[15px] leading-relaxed text-ox-mut">{ACCROCHE — 1-2 phrases}</p>
      <a href="#contact" class="mt-6 inline-block rounded-lg bg-ox-orange px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">{CTA}</a>
    </div>
    <!-- DROITE : grande photo métier -->
    <div class="overflow-hidden rounded-2xl">
      <img src="{PHOTO}" class="h-[420px] w-full object-cover sm:h-[520px] lg:h-[560px]" alt="" />
    </div>
  </div>

  <!-- Strate 2 — LE WORDMARK RAYÉ DE LA MARQUE : bande décorative géante EN BAS du
       hero, pleine largeur, le mot = LA MARQUE en capitales. Effet rayé (striped).
       select-none + pointer-events-none. C'est le second élément signature. -->
  <div class="pointer-events-none relative -mt-6 select-none md:-mt-10 overflow-hidden">
    <span class="block whitespace-nowrap text-center font-display text-[24vw] font-extrabold uppercase leading-[0.78] tracking-tighter wordmark-striped">{MARQUE}</span>
  </div>
</section>
```

**Hiérarchie à respecter absolument** : le **titre marine PLEIN** est l'élément
n°1 (le plus gros texte lisible, en haut) ; le **wordmark rayé de la marque** est
n°2 (bande décorative en bas). NE PAS inverser : ne jamais mettre un wordmark
pâle/contour en grand au sommet avec le vrai titre en petit dessous — c'est
l'erreur à ne pas commettre.

Autres usages du wordmark ailleurs sur le site : sur les **panneaux sombres**
`bg-ox-navy` (ex. CTA finale), un `wordmark-stroke` (contour blanc) en fond ;
sur fond clair, `wordmark-stroke-navy` ou `wordmark-light`. Tailles `text-[14vw]`
à `text-[24vw]`, `leading-[0.7]`–`leading-[0.78]`, toujours `select-none
pointer-events-none`.

La **barre de stats** (4 chiffres oranges) vient juste APRÈS le hero, en début de
corps de page :

```html
<div class="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 gap-8 md:grid-cols-4">
  <div>
    <div class="font-display text-4xl font-extrabold text-ox-orange">{VALEUR}</div>
    <div class="mt-1 text-xs uppercase tracking-wide text-ox-mut">{LIBELLÉ}</div>
  </div>
  <!-- … 3 autres … -->
</div>
```

### 3c. Signature à ne jamais perdre

1. **TITRE GÉANT SOLIDE marine en haut** (`text-6xl sm:text-7xl lg:text-8xl`,
   `text-ox-navy` PLEIN, uppercase, `leading-[0.92] tracking-tight`) — l'élément
   dominant, lisible immédiatement, avec une **vignette-image dans les mots**.
2. **WORDMARK RAYÉ de la MARQUE en bande basse** (`text-[24vw] wordmark-striped`,
   `select-none pointer-events-none`) : le décor typographique signature, EN BAS
   du hero, jamais au-dessus du titre.
3. Hiérarchie titre-plein > wordmark-rayé respectée (ne pas inverser).
4. Palette **marine dominante** + orange parcimonieux : CTA hero orange, CTA nav
   marine. Ne jamais inverser.
5. `rounded-2xl` sur les photos, `rounded-lg/xl` sur les boutons. Sections en
   alternance blanc / `bg-ox-sky`, panneaux forts en `rounded-3xl bg-ox-navy`.

## 4. Sections du corps (ordre du DOM)

En-tête de section type : éyebrow `text-[13px] font-semibold uppercase
tracking-wide text-ox-orange` + H2 `font-display text-3xl md:text-4xl
font-extrabold uppercase leading-tight text-ox-navy`. Conteneur `max-w-7xl
mx-auto px-6`, sections en `py-16` à `py-20`, alternance fond blanc / `bg-ox-sky`.

Ordre observé :
- **SERVICES — « DES SOLUTIONS ÉLECTRIQUES »** : grille de cartes
  `group overflow-hidden rounded-2xl border border-ox-line bg-white`, photo en
  tête `h-40` ou `h-72`, badge `absolute left-3 top-3 rounded-full bg-white/90
  px-3 py-1 text-[11px] uppercase text-ox-navy`. Grilles `md:grid-cols-3`.
- **PROCESS — « CONNEXION ET INSTALLATION »** : étapes numérotées 01→04
  (numéros oranges), `md:grid-cols-[1.4fr_1fr_1fr_1fr]`, texte « Une méthode
  rigoureuse, du diagnostic à la mise en service… ».
- **POURQUOI NOUS** : grille de bénéfices (Accompagnement dédié, Paiement
  sécurisé, Qualité certifiée…), `md:grid-cols-3`.
- **TARIFS — « DES FORMULES SOUPLES »** : cartes formules (Essentielle, Standard)
  sur `bg-ox-navy2` (panneau sombre) avec features et CTA.
- **TÉMOIGNAGES — « NOS CLIENTS »** : avatars `h-11 w-11 rounded-full`, citations.
- **RÉALISATIONS** : galerie de photos `rounded-2xl`.
- **ÉQUIPE — « NOTRE ÉQUIPE »** + **BLOG & CONSEILS** : grilles de cartes.
- **CTA FINAL — « PRÊT À FAIRE PASSER… »** : panneau marine `bg-ox-navy
  text-white` pleine largeur, gros titre + bouton orange.
- **FOOTER** : `bg-ox-navy pt-16 text-white`, colonnes de liens, barre basse
  `border-t border-white/10 text-white/40` avec mention « Propulsé par Akyra ».

## 5. Ton éditorial

Français soigné, ton premium et assuré, sans esbroufe. Les titres de sections
sont en **capitales courtes et fortes** (2-4 mots : « DES FORMULES SOUPLES »,
« NOS CLIENTS »). Le titre hero est une affirmation découpée en mots qui
respirent. Accroches concrètes (diagnostic, mise aux normes, intervention 48 h).
Stats chiffrées rassurantes (années, projets, 24/7).

## 6. Règles d'adaptation & verrous (pour Mistral)

**TU PEUX adapter** : tous les textes (en gardant les titres de section en
capitales courtes), les photos (y compris les vignettes incrustées dans le
titre), les chiffres de stats, le nombre de cartes par grille, retirer/ajouter
une section du corps en réutilisant l'en-tête + cartes `rounded-2xl border
border-ox-line`.

**VERROUILLÉ** : les tokens (§2), la structure du hero (titre géant uppercase +
vignettes incrustées + barre de stats + photo asymétrique à droite), la
répartition marine/orange (CTA hero orange, CTA nav marine), les rayons, le
footer marine.

**Demande hors-cadre** : l'intégrer dans le langage marine/orange éditorial — un
nouveau bloc reprend H2 capitales + cartes `rounded-2xl` + accent orange, jamais
un style étranger. En cas de doute : la solution qui réutilise le marine, l'orange
parcimonieux et la typo Plus Jakarta Sans extra-bold est la bonne.
