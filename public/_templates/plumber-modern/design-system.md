# Design System — plumber-modern (plombier moderne, bleu plein)

## 1. ADN

Plombier **moderne et confiant** : hero **entièrement bleu** (#1681FF), titre en
**Outfit** (display géométrique) sur 3 lignes, accent **jaune** (#FDBC0D), encre
**bleu marine** (#09093D) dans le corps clair. Badge de note, photo à droite. Ton
clair, pro, accessible. À l'opposé de l'urgence (blueprint) : ici **bleu plein
lumineux, Outfit, moderne**.

## 2. Tokens (verrouillés)

Polices : **Outfit** (`.font-display`, titres) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#1681FF', ink:'#09093D', accent:'#FDBC0D', bg:'#F5F7FA', muted:'#3B3B3B', line:'#E5EAEC', white:'#FFFFFF' },
  fontFamily: { display:['"Outfit"','sans-serif'], sans:['Inter','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#fff; color:#09093D; margin:0; }
.font-display { font-family:'"Outfit"',sans-serif; }
```

## 3. HEADER — signature

### 3a. NAV — sur le bleu, marque Outfit

```html
<header class="absolute top-0 inset-x-0 z-50">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#"><span data-sg-path="brand" class="text-white font-display font-semibold text-xl tracking-tight">{MARQUE}</span></a>
    <nav class="hidden md:flex items-center gap-9 text-sm text-white/85">
      <a href="#services" data-sg-path="nav[0]" class="hover:text-white transition-colors">Services</a>
      <a href="#about" data-sg-path="nav[1]" class="hover:text-white transition-colors">À propos</a>
    </nav>
    <a href="#contact" data-sg-path="nav.cta" class="bg-accent text-ink font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-95 transition-all">{CTA_NAV}</a>
  </div>
</header>
```

### 3b. HERO — bleu plein, titre Outfit 3 lignes, badge, photo

```html
<section class="relative bg-primary overflow-hidden min-h-[640px] flex items-center">
  <div class="max-w-7xl mx-auto w-full px-6 pt-32 pb-16 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <!-- Badge de note -->
      <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
        <span class="text-accent">★★★★★</span>
        <span data-sg-path="hero.badge" class="text-white text-sm">{NOTE}</span>
      </div>
      <h1 class="text-white font-display font-semibold leading-[1.04] text-5xl md:text-6xl lg:text-7xl mb-6">
        <span data-sg-path="hero.titleA">{LIGNE 1}</span><br/>
        <span data-sg-path="hero.titleB">{LIGNE 2}</span><br/>
        <span data-sg-path="hero.titleC">{LIGNE 3}</span>
      </h1>
      <p data-sg-path="hero.tagline" class="text-white/80 text-lg mb-8 max-w-md">{ACCROCHE}</p>
      <a href="#contact" data-sg-path="hero.cta" class="inline-block bg-accent text-ink font-semibold px-7 py-3.5 rounded-full hover:brightness-95 transition-all">{CTA}</a>
    </div>
    <!-- Photo à droite -->
    <div class="relative rounded-3xl overflow-hidden"><img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-[420px] md:h-[500px] object-cover" /></div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero entièrement bleu `#1681FF`** (pas de photo de fond — couleur pleine),
   photo dans une carte arrondie à droite.
2. **Titre Outfit** `font-display font-semibold leading-[1.04] text-5xl …
   lg:text-7xl` sur **3 lignes**.
3. Accent **jaune `#FDBC0D`** : CTA en **pilule jaune** (texte marine).
4. **Badge de note** (étoiles jaunes) au-dessus du titre. Corps clair `bg` #F5F7FA.

## 4. Sections du corps

Fond clair `bg`, cartes `rounded-2xl border border-line`, `py-20`. Sections :
SERVICES (grille plomberie), POURQUOI NOUS, PROCESS, TARIFS, TÉMOIGNAGES, FAQ,
CONTACT (CTA jaune). Titres Outfit. FOOTER bleu ou marine `ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français clair, moderne, pro. Titre = 3 lignes (tous types / services de
plomberie / pour votre domicile). Mentions de note/confiance. Accroches
accessibles. Net et rassurant.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services, le nom, retirer
une section sans matière.

**VERROUILLÉ** : tokens (§2, bleu plein + jaune + Outfit), structure du header
(hero bleu plein + titre Outfit 3 lignes + photo carte arrondie), accent jaune.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en bleu + jaune + Outfit ; jamais une couleur hors palette.
