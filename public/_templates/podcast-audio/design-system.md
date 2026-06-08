# Design System — podcast-audio (podcast, éditorial sonore)

## 1. ADN

Site de **podcast / création sonore, cinématographique** : fond **noir profond**,
texte ivoire, un **titre en serif** (Instrument Serif) et des **micro-labels en
monospace** (Geist Mono). Deux accents : **bleu électrique** et un **jaune
acide** (#ebf213) pour les touches « play / écouter ». Ton narration immersive,
épisodes, voix. À l'opposé du SaaS : ici **sombre, serif + mono, jaune pop,
audio**.

## 2. Tokens (verrouillés)

Polices : **Geist** (corps) + **Geist Mono** (labels) + **Instrument Serif** (titres).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#0a0a0a', panel:'#131313', paper:'#eeeeee', cream:'#f4f1ea', muted:'#757575', line:'#222222', lineL:'#e2e2e2', accent:'#0000ee', yellow:'#ebf213' },
  fontFamily: { sans:['Geist','sans-serif'], mono:['"Geist Mono"','monospace'], serif:['"Instrument Serif"','serif'] },
  letterSpacing: { label:'0.16em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Geist',sans-serif; background:#0a0a0a; color:#eee; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0 backdrop-blur-sm bg-ink/30`. Marque **serif**, liens **mono**, CTA
**pilule à filet** (« Écouter maintenant »).

```html
<header class="fixed top-0 inset-x-0 z-50 backdrop-blur-sm bg-ink/30">
  <nav class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
    <a href="#top" data-sg-path="brand" class="font-serif text-2xl tracking-wide text-paper">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-9 font-mono text-[12px] tracking-label uppercase text-paper/70">
      <li><a href="#episodes" data-sg-path="nav[0]" class="hover:text-paper transition-colors">Épisodes</a></li>
      <li><a href="#about" data-sg-path="nav[1]" class="hover:text-paper transition-colors">À propos</a></li>
    </ul>
    <a href="#community" data-sg-path="cta" class="font-mono text-[12px] tracking-label uppercase border border-paper/30 rounded-full px-4 py-1.5 text-paper hover:bg-paper hover:text-ink transition-colors">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — titre serif + eyebrow jaune + bouton play

```html
<section id="top" class="relative min-h-screen flex items-center overflow-hidden pt-16">
  <div class="mx-auto max-w-7xl w-full px-6 grid lg:grid-cols-[1.3fr_0.7fr] gap-12 items-center">
    <div>
      <p data-sg-path="hero.eyebrow" class="font-mono text-[12px] tracking-label uppercase text-yellow mb-6">{ÉYEBROW}</p>
      <h1 data-sg-path="hero.title" class="font-serif leading-[0.95] text-paper text-5xl sm:text-6xl md:text-7xl lg:text-[88px]">{TITRE — accroche narrative}</h1>
      <p data-sg-path="hero.tagline" class="mt-8 font-sans font-light text-base md:text-lg text-paper/70 max-w-xl">{ACCROCHE}</p>
      <a href="#episodes" data-sg-path="hero.button" class="inline-block mt-10 font-mono text-[12px] tracking-label uppercase bg-paper text-ink rounded-md px-6 py-3 hover:bg-yellow transition-colors">{CTA — ex. Dernier épisode}</a>
    </div>
    <!-- DROITE : visuel/cover du podcast -->
    <div class="relative aspect-square rounded-xl overflow-hidden">
      <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover" />
    </div>
  </div>
  <!-- Labels mono en bas -->
  <div class="absolute bottom-6 inset-x-0 z-10 mx-auto max-w-7xl px-6 flex justify-between font-mono text-[11px] tracking-label uppercase text-paper/50">
    <span data-sg-path="hero.leftLabel">{GENRE/FORMAT}</span>
    <span data-sg-path="hero.rightLabel">{FRÉQUENCE/DEPUIS}</span>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Fond **noir**, **titre en Instrument Serif** `leading-[0.95] text-5xl …
   lg:text-[88px]` — la serif à grande taille sur noir fait l'élégance sonore.
2. **Eyebrow en jaune `#ebf213`** (mono) et **bouton « play » qui passe au jaune
   au survol** (`hover:bg-yellow`).
3. **Labels monospace** `tracking-label uppercase` (nav, coins bas du hero).
4. Marque en serif ; palette noir/ivoire + jaune acide + bleu rare.

## 4. Sections du corps

Fond noir/`panel`, sections `cream` claires possibles pour contraste, `py-24`.
Sections podcast : ÉPISODES (liste avec durées, boutons play jaune), À PROPOS
(voix/équipe), PLATEFORMES (Spotify/Apple…), COMMUNAUTÉ/NEWSLETTER (accent jaune),
CONTACT. Titres serif, labels mono. FOOTER noir, « Propulsé par Akyra ».

## 5. Ton éditorial

Français narratif, registre audio/récit. Eyebrow jaune court. Titre = accroche
narrative. Accroches sur l'écoute, les épisodes, la voix. Sobre et immersif.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre d'épisodes, le nom, retirer
une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + Instrument Serif + Geist Mono + jaune),
structure du header (titre serif + eyebrow jaune + bouton play + labels mono),
fond noir, jaune parcimonieux.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + serif/mono + jaune ; jamais une couleur hors
palette.
