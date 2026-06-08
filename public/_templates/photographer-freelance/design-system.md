# Design System — photographer-freelance (photographe indépendant, chaud-sombre)

## 1. ADN

Site de **photographe freelance, personnel et chaleureux** : fond **noir**, texte
crème chaud, accent **orange signature** (#FF6017). La signature : une **photo
plein écran** surmontée d'un **titre géant en Archivo** (display, tracking
négatif serré) ancré en bas, avec une intro perso et des CTA en pilule à filet.
Ton « l'artiste derrière l'objectif », direct et humain. À l'opposé de
portrait-fineart (blanc minimal galerie) : ici **chaud, sombre, orange, gros
titre Archivo sur image**.

## 2. Tokens (verrouillés)

Polices : **Archivo** (`.font-display`, titres, 300–900) + **Inter** (`.font-body`).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#0A0A0A', panel:'#141414', cream:'#FAF5EA', muted:'#BABABA', accent:'#FF6017', accent2:'#FF7738' },
  fontFamily: { display:['Archivo','Arial','sans-serif'], body:['Inter','Arial','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',Arial,sans-serif; background:#0A0A0A; color:#FAF5EA; margin:0; }
.font-display { font-family:'Archivo',Arial,sans-serif; }
.display-tight { letter-spacing:-0.04em; line-height:0.92; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0`, transparente (sur la photo). Marque en Archivo, liens crème, CTA
**pilule à filet** (hover orange).

```html
<header class="fixed top-0 inset-x-0 z-50">
  <nav class="flex items-center justify-between px-6 md:px-10 py-5">
    <a href="#top" data-sg-path="brand" class="font-display text-lg md:text-xl font-semibold tracking-tight text-cream">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 text-[13px] tracking-wide text-cream/80">
      <li><a href="#work" data-sg-path="nav[0]" class="hover:text-cream transition-colors">Galerie</a></li>
      <li><a href="#about" data-sg-path="nav[1]" class="hover:text-cream transition-colors">À propos</a></li>
    </ul>
    <a href="#contact" data-sg-path="hero.ctaSecondary" class="hidden md:inline-flex items-center gap-2 text-[12px] tracking-wide uppercase border border-cream/30 rounded-full px-5 py-2 hover:bg-accent hover:border-accent hover:text-ink transition-colors">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — photo plein écran + titre Archivo géant ancré bas

```html
<section id="top" class="relative h-screen min-h-[680px] w-full overflow-hidden">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover" />
  <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30"></div>
  <!-- Intro perso + CTA, en haut/milieu gauche -->
  <div class="absolute top-28 left-6 md:left-10 max-w-sm z-10">
    <p data-sg-path="hero.intro" class="text-[12px] md:text-[13px] leading-relaxed text-cream/85 mb-4">{INTRO à la 1re personne}</p>
    <a href="#contact" data-sg-path="hero.ctaPrimary" class="inline-flex items-center gap-2 text-[11px] tracking-wide uppercase border border-cream/40 rounded-full px-5 py-2 hover:bg-accent hover:border-accent hover:text-ink transition-colors">{CTA}</a>
  </div>
  <!-- Titre GÉANT Archivo ancré en bas -->
  <div class="absolute bottom-24 md:bottom-28 left-6 md:left-10 right-6 z-10">
    <h1 class="font-display font-normal display-tight text-cream text-[44px] sm:text-[68px] md:text-[96px] lg:text-[112px]">
      <span data-sg-path="hero.titleLine1">{LIGNE 1}</span><br>
      <span data-sg-path="hero.titleLine2">{LIGNE 2}</span>
    </h1>
  </div>
  <!-- Bande de labels en bas -->
  <div class="absolute bottom-8 left-6 md:left-10 right-6 md:right-10 flex items-center justify-between text-[11px] tracking-wide uppercase text-cream/70 z-10">
    <span data-sg-path="hero.labelLeft">{SPÉCIALITÉS}</span>
    <span data-sg-path="hero.labelRight">{LIEU}</span>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Photo plein écran** `h-screen` + dégradé sombre, titre ancré **en bas**.
2. **Titre Archivo géant** `font-display display-tight text-[44px] … lg:text-[112px]`
   (tracking -0.04em, leading 0.92) — la masse Archivo serrée fait l'identité.
3. Accent **orange `#FF6017`** : hovers de CTA (pilules à filet → fond orange).
4. Intro à la 1re personne + bande de labels (spécialités / lieu) en bas du hero.
5. Palette noir/crème chaud + orange.

## 4. Sections du corps

Fond noir, panneaux `bg-panel`, `py-24`. Sections photographe : GALERIE/WORK
(grille de photos), À PROPOS (portrait + texte perso), SERVICES (types de
prestations), CONTACT (CTA orange). Titres Archivo. FOOTER noir, « Propulsé par Akyra ».

## 5. Ton éditorial

Français personnel, chaleureux, à la 1re personne. Titre = accroche en 2 lignes.
Intro qui présente le/la photographe. Labels courts (spécialités, lieu). Évoque
l'émotion, l'instant, le sur-mesure. Humain, pas corporate.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre d'images/services, le nom,
retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir/crème + Archivo + orange), structure du header
(photo plein écran + titre Archivo géant ancré bas + intro 1re personne), accent
orange.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir/crème + Archivo + orange ; jamais une couleur
hors palette.
