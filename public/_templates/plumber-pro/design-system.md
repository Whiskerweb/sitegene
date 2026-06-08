# Design System — plumber-pro (plombier certifié, navy & rouge)

## 1. ADN

Plombier **professionnel certifié, sérieux** : hero **bleu marine très sombre**
(#010A11) avec photo plein cadre, accent **bleu** (#0059A9) et un **CTA rouge**
(#F2181E) qui tranche, puis sections **claires**. Éyebrow en pilule, statistique
d'avis. Typo Manrope extra-bold. Ton expertise, certification, confiance. À
l'opposé du « modern » (bleu lumineux) : ici **navy sombre + rouge, certifié,
premium**.

## 2. Tokens (verrouillés)

Police : **Manrope** (400–800).

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#0059A9', blue2:'#2672B6', ink:'#010A11', bg:'#F2F5F9', muted:'#5B5E66', border:'#E4E8EE', white:'#FFFFFF', danger:'#F2181E' },
  fontFamily: { sans:['Manrope','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Manrope',sans-serif; background:#fff; color:#010A11; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV — blanche, marque extrabold

```html
<nav class="bg-white sticky top-0 z-50 border-b border-border">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#"><span data-sg-path="brand" class="text-ink font-extrabold text-xl tracking-tight">{MARQUE}</span></a>
    <div class="hidden md:flex items-center gap-8 text-sm text-muted">
      <a href="#services" data-sg-path="nav[0]" class="hover:text-ink transition-colors">Services</a>
      <a href="#about" data-sg-path="nav[1]" class="hover:text-ink transition-colors">À propos</a>
    </div>
    <a href="#contact" data-sg-path="nav.cta" class="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition-all">{CTA_NAV}</a>
  </div>
</nav>
```

### 3b. HERO — navy sombre, photo, éyebrow pilule, CTA rouge, stat avis

```html
<section class="relative bg-ink overflow-hidden" style="min-height:560px;">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-60" />
  <div class="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent"></div>
  <div class="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <span data-sg-path="hero.eyebrow" class="inline-block border border-white/25 text-white/80 text-[11px] uppercase tracking-wider font-semibold px-4 py-1.5 rounded-full mb-6">{ÉYEBROW}</span>
      <h1 data-sg-path="hero.title" class="text-white font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">{TITRE}</h1>
      <p data-sg-path="hero.tagline" class="text-white/70 text-lg mb-8 max-w-md">{ACCROCHE}</p>
      <div class="flex items-center gap-6">
        <a href="#contact" data-sg-path="hero.cta" class="inline-flex items-center gap-2 bg-danger text-white font-semibold px-6 py-3.5 rounded-full hover:brightness-110 transition-all text-sm">{CTA}</a>
        <!-- Stat avis -->
        <div class="flex items-center gap-2">
          <span data-sg-path="hero.reviews" class="text-white font-extrabold text-2xl">{NOMBRE}</span>
          <span data-sg-path="hero.reviewsLabel" class="text-white/60 text-sm">{LIBELLÉ avis}</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero bleu marine très sombre `#010A11`** avec photo `opacity-60` + dégradé
   latéral, contenu à gauche.
2. **Éyebrow en pilule à filet** (capitales) au-dessus du titre.
3. **CTA rouge `#F2181E`** (pilule rouge) — le rouge tranche sur le navy, c'est
   l'accent qui appelle à l'action.
4. **Statistique d'avis** (gros nombre + libellé) à côté du CTA. Titre Manrope
   extra-bold. Corps clair `bg`.

## 4. Sections du corps

Fond clair `bg`, cartes `rounded-2xl border border-border`, `py-20`. Sections :
SERVICES (grille plomberie, icônes bleues), POURQUOI NOUS (certifications),
PROCESS, TARIFS, TÉMOIGNAGES, CONTACT (CTA rouge ou bleu). Titres Manrope.
FOOTER navy `ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français pro, expert, rassurant. Titre orienté expertise/certification. Éyebrow
« spécialistes certifiés ». Mentions d'avis, d'assurance, de garantie. Premium et
fiable.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services, le nom, retirer
une section sans matière.

**VERROUILLÉ** : tokens (§2, navy + bleu + rouge), structure du header (hero navy
photo + éyebrow pilule + CTA rouge + stat avis), le CTA rouge tranchant, corps clair.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en navy + bleu + rouge ; jamais une couleur hors palette.
