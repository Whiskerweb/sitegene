# Design System — luxury-wedding (photographe de mariage haut de gamme)

## 1. ADN

Site de photographe/vidéaste de mariage **luxe, cinématographique, mode** :
typographie **ultra-fine** (`font-thin`/`font-extralight`) à interlettrage très
serré, immenses respirations, alternance de sections **noir profond** et **crème**.
Le hero est une **photo plein écran en noir & blanc** sur laquelle le titre,
discret et énorme, est ancré en bas. La nav est **symétrique** autour d'un petit
logo central (deux cercles entrelacés), avec des liens minuscules très espacés —
un code visuel emprunté à la mode et au studio d'art. À l'opposé total des
templates artisans (gras, colorés, compacts) : ici tout est **fin, lent, élégant,
monochrome**. L'émotion : intemporel, premium, intime.

> Note : le template d'origine a des micro-animations (badge rotatif, parallaxe
> du hero, révélations). La reconstruction statique reproduit la composition et la
> DA ; le badge tourne via une animation CSS simple (incluse), la parallaxe non.

## 2. Tokens (verrouillés)

Polices : **Google Sans Flex** (corps + titres, graisses fines) et **Arial Narrow**
(libellés condensés `.font-narrow`).

```js
tailwind.config = {
  theme: { extend: {
    colors: {
      ink:     '#0A0A0A',   /* noir : sections sombres, fond hero, texte sur crème */
      inkDeep: '#020617',   /* noir bleuté : sections très sombres */
      bg:      '#FAF8F5',   /* crème : sections claires */
      bgLight: '#f9f9f9',   /* gris très clair : sections claires alternées */
      accent:  '#455CE9',   /* bleu électrique : accent RARE (liens, détails) */
      sage:    '#738065',   /* vert sauge : accent secondaire discret */
      muted:   '#333333',
    },
    fontFamily: {
      sans:   ['"Google Sans Flex"', 'Arial', 'sans-serif'],
      narrow: ['"Arial Narrow"', 'Arial', 'sans-serif'],
    },
  }}
};
```

CSS custom global :

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Google Sans Flex', Arial, sans-serif; background: #FAF8F5; color: #0A0A0A; margin: 0; }
.font-narrow { font-family: 'Arial Narrow', Arial, sans-serif; }
/* Dégradé sombre du hero : assombrit le bas pour poser le titre */
.hero-gradient { background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%); }
/* Badge rotatif lent */
@keyframes spin-slow { to { transform: rotate(360deg); } }
.spin-slow { animation: spin-slow 20s linear infinite; transform-origin: 50px 50px; }
```

## 3. HEADER — signature (reconstruction au millimètre)

### 3a. NAV — symétrique à logo central

Barre **absolue** par-dessus le hero (`absolute top-0`), texte blanc. Trois zones :
liens gauche (2/5, alignés à droite), **logo central** (1/5, deux cercles
entrelacés), liens droite (2/5, alignés à gauche). Liens : **minuscules, très
fins, très espacés**.

```html
<nav class="z-50 text-white w-full absolute top-0">
  <div class="flex h-28 max-w-[100rem] mx-auto px-6 lg:px-12 items-center justify-between">
    <!-- Gauche : 2-3 liens, alignés à droite -->
    <div class="hidden lg:flex items-center justify-end space-x-6 xl:space-x-10 w-2/5">
      <a href="#" data-sg-path="nav[0]" class="uppercase text-xs font-thin tracking-[0.2em] hover:text-gray-300 transition-colors whitespace-nowrap">Accueil</a>
      <a href="#services" data-sg-path="nav[2]" class="uppercase text-xs font-thin tracking-[0.2em] hover:text-gray-300 transition-colors whitespace-nowrap">Prestations</a>
    </div>
    <!-- Centre : logo = deux cercles de 14px entrelacés (filet blanc 1.5) -->
    <div class="flex w-1/5 justify-center">
      <a href="#" class="inline-block hover:opacity-80 transition-opacity">
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none"><circle cx="21" cy="24" r="14" stroke="white" stroke-width="1.5"/><circle cx="27" cy="24" r="14" stroke="white" stroke-width="1.5"/></svg>
      </a>
    </div>
    <!-- Droite : 2-3 liens, alignés à gauche -->
    <div class="hidden lg:flex w-2/5 space-x-6 xl:space-x-10 items-center justify-start">
      <a href="#" data-sg-path="nav[3]" class="uppercase text-xs font-thin tracking-[0.2em] hover:text-gray-300 transition-colors whitespace-nowrap">Portfolio</a>
      <a href="#about" data-sg-path="nav[4]" class="uppercase text-xs font-thin tracking-[0.2em] hover:text-gray-300 transition-colors whitespace-nowrap">À propos</a>
      <a href="#" data-sg-path="nav[5]" class="uppercase text-xs font-thin tracking-[0.2em] hover:text-gray-300 transition-colors whitespace-nowrap">Contact</a>
    </div>
  </div>
</nav>

<!-- Badge rotatif : disque de texte tournant, bas-droite, mix-blend-difference -->
<div class="pointer-events-none absolute top-[85vh] right-4 lg:right-12 w-36 h-36 lg:w-40 lg:h-40 opacity-90 mix-blend-difference z-40">
  <svg viewBox="0 0 100 100" class="overflow-visible w-full h-full">
    <g class="spin-slow">
      <path id="circlePath" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none"/>
      <text class="uppercase font-thin fill-white tracking-widest" style="font-size:8.5px;">
        <textPath href="#circlePath" startOffset="0%" data-sg-path="spinningBadge">MARIAGES • FILMS • PHOTOGRAPHIE • {MARQUE} • </textPath>
      </text>
    </g>
  </svg>
</div>
```

### 3b. HERO — photo plein écran N&B, titre ancré en bas

```html
<section class="flex flex-col bg-ink w-full h-screen pb-16 md:pb-24 relative justify-end">
  <!-- Fond : photo PLEIN ÉCRAN en niveaux de gris, opacity-80, + dégradé sombre bas -->
  <div class="overflow-hidden bg-ink absolute inset-0">
    <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover object-center opacity-80 grayscale" />
    <div class="hero-gradient absolute inset-0"></div>
  </div>
  <!-- Contenu ancré en BAS (justify-end), 2 colonnes -->
  <div class="z-10 w-full max-w-[100rem] mx-auto px-6 lg:px-12 relative">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
      <!-- Gauche : titre GÉANT mais FIN, 2 lignes -->
      <h1 class="leading-[0.9] text-6xl sm:text-7xl lg:text-8xl text-white tracking-tighter font-thin drop-shadow-lg">
        <span data-sg-path="hero.title1">{MOT1}</span><br>
        <span data-sg-path="hero.title2">{MOT2}</span>
      </h1>
      <!-- Droite : accroche fine -->
      <p data-sg-path="hero.tagline" class="text-2xl md:text-3xl leading-relaxed text-gray-200 font-thin max-w-xl drop-shadow-md">{ACCROCHE — 2-3 phrases élégantes}</p>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero plein écran** `h-screen bg-ink` avec **photo N&B** (`grayscale opacity-80`)
   + `hero-gradient`, contenu **ancré en bas** (`justify-end`).
2. **Titre fin et géant** : `text-6xl sm:text-7xl lg:text-8xl font-thin tracking-tighter
   leading-[0.9]`, blanc — c'est la finesse (`font-thin`) à grande taille qui fait le luxe.
   JAMAIS de gras, jamais de couleur vive dans le titre.
3. **Nav symétrique** : liens gauche/droite répartis 2/5–2/5 autour d'un **logo
   central** (deux cercles entrelacés), liens `uppercase text-xs font-thin tracking-[0.2em]`.
4. **Badge rotatif** texte-sur-cercle, bas-droite, `mix-blend-difference`, `spin-slow`.
5. Typographie **fine partout** (`font-thin`/`font-extralight`), `tracking-tighter`
   sur les titres, immenses marges (`py-32`), alternance `bg-ink` / `bg-bg`.

## 4. Sections du corps (ordre du DOM)

Sections en `py-24 md:py-32`, alternant fonds **sombres** (`bg-ink`/`bg-inkDeep`,
texte blanc) et **clairs** (`bg-bg`/`bgLight`/`white`, texte `ink`). En-tête de
section type : H2 `text-5xl md:text-6xl font-thin tracking-tighter` + paragraphe
`font-extralight text-ink/60 text-lg lg:text-xl`, souvent disposés
`flex md:flex-row md:items-end justify-between` (titre à gauche, texte à droite).

- **BANDEAU LOGOS / preuve** (juste sous le hero) : `bg-ink border-b border-white/5`,
  rangée de logos ou mentions presse, `font-thin` discrets (label `logos.label`).
- **À PROPOS / PHILOSOPHIE** (`bg-bg`, clair) : grand texte fin + un ou deux
  portraits verticaux `aspect-[3/4]` posés en absolu (`philosophy.imageRight`).
- **PRESTATIONS** (`bg-bgLight`) : liste de services en grandes lignes fines,
  titres `services.items[].title`, descriptions `font-extralight`.
- **PORTFOLIO** (`bg-ink`, sombre) : grande galerie d'images, légendes
  `portfolio.caption1.title` discrètes.
- **ÉQUIPE / TÉMOIGNAGES** : sur fond sombre, citations fines.
- **FAQ** (`bg-white`) : questions `faq.items[].q` en `font-thin`.
- **CONTACT / INQUIRE** (`bg-ink`, sombre) : grand titre `contact.heading`,
  invitation à prendre contact, ton confidentiel.
- **FOOTER** sombre, minimal, le logo deux-cercles repris, mention « Propulsé par Akyra ».

## 5. Ton éditorial

Français raffiné, sobre, sensible. On parle d'émotion, d'histoire, d'intemporel,
d'authenticité — jamais de promotion agressive ni de prix criards. Titres en 1-2
mots (« Mariage / Photographie »). Accroches longues et littéraires (2-3 phrases).
Libellés de section courts et fins. Pas de superlatifs commerciaux ; le luxe se
dit par la retenue.

## 6. Règles d'adaptation & verrous (pour Mistral)

**TU PEUX adapter** : tous les textes (ton §5), les photos (toujours en N&B pour
le hero/portfolio sombre), le nombre de services/images, le nom du studio (badge
rotatif + footer), retirer une section sans matière (témoignages absents →
remplacer par une section « approche / engagements » dans le même style fin, sans
faux avis nominatifs).

**VERROUILLÉ** : les tokens (§2), la structure du header (hero plein écran N&B +
titre fin ancré bas + nav symétrique à logo central + badge rotatif), la
**finesse typographique** (`font-thin`/`font-extralight`, jamais de gras), les
fonds alternés sombre/crème, l'absence de couleur vive (l'accent bleu/sauge reste
rarissime).

**Édition (obligatoire)** : sur chaque texte modifiable, poser
`data-sg-path="…"` ; sur chaque image, `data-sg-img="…"` (chemins suivant la
structure : `hero.image`, `services.items[0].title`, etc.) pour rester compatible
avec l'éditeur WYSIWYG.

**Demande hors-cadre** : l'intégrer avec la même retenue (typo fine, monochrome,
beaucoup d'espace) ; jamais un élément gras ou coloré qui casserait le luxe.
