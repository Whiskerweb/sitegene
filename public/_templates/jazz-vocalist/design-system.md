# Design System — jazz-vocalist (chanteuse jazz, éditorial noir)

## 1. ADN

Site d'artiste **jazz/soul, éditorial, nocturne** : fond **noir absolu**, texte
ivoire, un **nom d'artiste en serif géant** (EB Garamond) centré sur une photo de
scène en **noir & blanc**. Partout des **micro-labels en monospace** (DM Mono,
capitales, interlettrage 0.18em) qui structurent la page comme une pochette de
disque / un programme de concert. Accent bleu électrique rarissime. Émotion :
intime, feutré, classe, scène de jazz. À l'opposé des artisans : ici c'est
**sombre, typographique, musical, raffiné**.

## 2. Tokens (verrouillés)

Polices : **DM Sans** (corps), **EB Garamond** (serif, titres), **DM Mono** (labels).

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:    '#000000',  /* fond noir */
    paper:  '#eeeeee',  /* texte ivoire */
    muted:  '#b4b4b4',  /* texte secondaire */
    accent: '#0000ee',  /* bleu électrique : accent RARE */
    panel:  '#111111',  /* cartes/panneaux */
    line:   '#222222',  /* filets, bordures */
  },
  fontFamily: {
    sans:  ['"DM Sans"', 'sans-serif'],
    serif: ['"EB Garamond"', 'serif'],
    mono:  ['"DM Mono"', 'monospace'],
  },
  letterSpacing: { label: '0.18em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background:#000; color:#eee; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0`, `backdrop-blur-sm bg-ink/40`, fine. Marque en **serif** à gauche,
liens en `font-mono` petits à droite.

```html
<header class="fixed top-0 inset-x-0 z-50 backdrop-blur-sm bg-ink/40">
  <nav class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
    <a href="#" data-sg-path="brand" class="font-serif text-xl tracking-wide text-paper">{MARQUE}</a>
    <ul class="hidden md:flex gap-8 font-mono text-[12px] tracking-label uppercase text-muted">
      <li><a href="#about" data-sg-path="nav[0]" class="hover:text-paper transition-colors">À propos</a></li>
      <li><a href="#releases" data-sg-path="nav[1]" class="hover:text-paper transition-colors">Discographie</a></li>
      <li><a href="#dates" data-sg-path="nav[3]" class="hover:text-paper transition-colors">Dates</a></li>
    </ul>
  </nav>
</header>
```

### 3b. HERO — nom serif géant sur photo N&B

```html
<section id="top" class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover grayscale" />
  <div class="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink"></div>
  <div class="relative z-10 text-center px-6">
    <p data-sg-path="hero.eyebrow" class="font-mono text-[12px] tracking-label uppercase text-muted mb-6">{LIEU}</p>
    <h1 data-sg-path="hero.title" class="font-serif font-medium leading-none text-paper text-6xl sm:text-7xl md:text-8xl lg:text-[120px]">{NOM ARTISTE}</h1>
    <p data-sg-path="hero.tagline" class="mt-8 font-sans text-base md:text-lg text-muted max-w-xl mx-auto">{ACCROCHE — 1 phrase}</p>
  </div>
  <!-- Labels mono dans les coins bas -->
  <div class="absolute bottom-6 inset-x-0 z-10 flex justify-between px-6 font-mono text-[11px] tracking-label uppercase text-muted/70">
    <span data-sg-path="hero.leftLabel">{GENRES}</span>
    <span data-sg-path="hero.rightLabel">{DEPUIS}</span>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Fond **noir**, hero `min-h-screen`, photo **N&B** (`grayscale`) + dégradé
   `from-ink/70 via-ink/30 to-ink`, contenu **centré**.
2. **Nom d'artiste en serif géant** `font-serif font-medium leading-none text-6xl
   … lg:text-[120px]` — EB Garamond à 120px, c'est la signature.
3. **Labels monospace** `font-mono text-[12px] tracking-label uppercase text-muted`
   partout : eyebrow du hero, labels de section, et **labels dans les coins bas
   du hero** (genres à gauche, « Depuis … » à droite).
4. Palette **noir/ivoire** ; accent bleu `#0000ee` rarissime.
5. Tags en **pilules à filet** (`border border-line rounded-full px-4 py-1.5
   font-mono uppercase`).

## 4. Sections du corps

Fond noir, sections `py-28 border-t border-line`, conteneur `max-w-7xl`. Motif
récurrent : grille `md:grid-cols-[200px_1fr]` avec un **label mono à gauche** et
le contenu à droite. Sections : À PROPOS (texte + tags pilules), DISCOGRAPHIE
(`releases`, grille d'albums), TÉMOIGNAGES, DATES (`dates`, liste de concerts à
venir), CONTACT (CTA pilule `border border-line rounded-full hover:bg-paper
hover:text-ink`). FOOTER noir minimal, « Propulsé par Akyra ».

## 5. Ton éditorial

Français soigné, feutré, registre musique live haut de gamme. Le titre = le nom
de l'artiste/groupe. Labels courts en capitales (« À propos », « Dates »).
Accroches sobres évoquant les concerts, les salles, le répertoire. Pas de hype ;
l'élégance se dit par la sobriété typographique.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, les photos (toujours N&B au hero), le
nombre d'albums/dates/tags, le nom d'artiste, retirer une section sans matière
(témoignages absents → section « répertoire / formations musicales » dans le même
style, sans faux avis).

**VERROUILLÉ** : tokens (§2, noir + EB Garamond + DM Mono), structure du header
(nom serif géant centré sur photo N&B + labels mono + labels de coins), la
finesse mono, le fond noir, l'accent bleu rarissime.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image (`hero.image`, `releases.items[0].title`…) pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + serif/mono ; jamais un bloc clair ou coloré
qui casserait l'ambiance nocturne.
