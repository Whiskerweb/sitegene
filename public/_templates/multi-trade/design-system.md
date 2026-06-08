# Design System — multi-trade (multi-services bâtiment, teal & orange)

## 1. ADN

Site d'**entreprise multi-services bâtiment (élec/plomberie/chauffage), sérieux et
technique** : hero **bleu canard profond** (#0B212D) avec accent **orange**
(#EF7615), puis sections **claires** (bleu-gris pâle #F0F5F9). Photo de technicien
plein cadre, **pilules de réassurance** (24/7, certifié, transparent). Typo
Manrope extra-bold. Ton fiabilité, urgence, professionnalisme. À l'opposé du
ménage (jaune) : ici **teal + orange, technique, multi-corps de métier**.

## 2. Tokens (verrouillés)

Police : **Manrope** (400–800).

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#EF7615', ink:'#0B212D', ink2:'#0F2A38', bg:'#F0F5F9', muted:'#5A6B74', border:'#E2E9EE', white:'#FFFFFF' },
  fontFamily: { sans:['"Manrope"','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Manrope',sans-serif; background:#fff; color:#0B212D; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV

`absolute top-0` sur le hero teal. Marque extrabold blanche, liens, CTA orange.

```html
<nav class="absolute top-0 inset-x-0 z-50">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2"><span class="text-white font-extrabold text-xl tracking-tight" data-sg-path="brand">{MARQUE}</span></a>
    <div class="hidden md:flex items-center gap-8 text-sm text-white/80">
      <a href="#services" data-sg-path="nav[0]" class="hover:text-white transition-colors">Services</a>
      <a href="#about" data-sg-path="nav[1]" class="hover:text-white transition-colors">À propos</a>
    </div>
    <a href="#contact" data-sg-path="nav.cta" class="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-105 transition-all">{CTA_NAV}</a>
  </div>
</nav>
```

### 3b. HERO — teal, photo plein cadre, contenu en bas, pilules

```html
<section class="relative bg-ink overflow-hidden min-h-[640px] flex items-end">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-70" />
  <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent"></div>
  <div class="relative w-full max-w-7xl mx-auto px-6 pb-16 pt-40 grid lg:grid-cols-2 gap-10 items-end">
    <div>
      <h1 data-sg-path="hero.title" class="text-white font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6 max-w-xl">{TITRE}</h1>
      <p data-sg-path="hero.tagline" class="text-white/70 text-lg mb-8 max-w-md">{ACCROCHE}</p>
      <a href="#contact" data-sg-path="hero.cta" class="inline-block bg-primary text-white font-semibold px-7 py-3.5 rounded-full hover:brightness-105 transition-all">{CTA}</a>
    </div>
    <!-- Pilules de réassurance (point orange + texte) -->
    <div class="flex flex-col gap-3 lg:items-end">
      <span class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2"><span class="w-2 h-2 rounded-full bg-primary"></span><span data-sg-path="hero.pills[0]" class="text-white text-sm font-medium">{PILULE 1}</span></span>
      <span class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2"><span class="w-2 h-2 rounded-full bg-primary"></span><span data-sg-path="hero.pills[1]" class="text-white text-sm font-medium">{PILULE 2}</span></span>
      <span class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2"><span class="w-2 h-2 rounded-full bg-primary"></span><span data-sg-path="hero.pills[2]" class="text-white text-sm font-medium">{PILULE 3}</span></span>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero bleu canard `#0B212D`** avec photo de technicien plein cadre + dégradé
   bas, contenu **ancré en bas** (`items-end`).
2. Accent **orange `#EF7615`** : CTA en **pilule orange**, points des pilules de
   réassurance.
3. **Pilules de réassurance** (24/7, certifié, transparent) à droite du hero.
4. Titre Manrope **extra-bold** `text-4xl … lg:text-6xl leading-[1.05]`.
5. Sections du corps **claires** (`bg` #F0F5F9).

## 4. Sections du corps

Fond clair `bg`, cartes `rounded-2xl border border-border`, `py-20`. Sections :
SERVICES (grille élec/plomberie/chauffage avec icônes orange), PROCESS (étapes),
POURQUOI NOUS, TÉMOIGNAGES, ZONE D'INTERVENTION, CONTACT/DEVIS (CTA orange).
FOOTER `ink` teal sombre, « Propulsé par Akyra ».

## 5. Ton éditorial

Français pro, rassurant, technique. Titre orienté solutions multi-métiers.
Mentions de confiance (urgence 24/7, certifié, assuré, transparent). Accroches
concrètes (intervention rapide, devis). Sérieux et fiable.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services/pilules, le nom,
retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, teal + orange + bg clair), structure du header (hero
teal photo + contenu bas + pilules de réassurance), accent orange, corps clair.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en teal + orange + clair ; jamais une couleur hors palette.
