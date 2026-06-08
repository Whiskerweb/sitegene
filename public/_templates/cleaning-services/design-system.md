# Design System — cleaning-services (ménage & services, jaune confiance)

## 1. ADN

Site de **société de ménage / services à domicile, net et rassurant** : hero
**sombre** (brun-noir #171206) avec accent **jaune** (#FEBF03), puis sections
**claires** (bleu-gris pâle #F2F7F9). Badge de note (étoiles) pour la preuve
sociale, boutons en **pilule jaune**. Typo Plus Jakarta Sans. Ton confiance,
propreté, réservation simple. À l'opposé des templates sombres éditoriaux : ici
**clair en majorité, jaune, services, rassurant**.

## 2. Tokens (verrouillés)

Polices : **Plus Jakarta Sans** (titres/corps) + **Inter**.

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#FEBF03', ink:'#171206', bg:'#F2F7F9', muted:'#5B5955', border:'#E5EAEC', white:'#FFFFFF', blue:'#2B80F7', danger:'#F02A2B' },
  fontFamily: { sans:['"Plus Jakarta Sans"','sans-serif'], inter:['Inter','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Plus Jakarta Sans',sans-serif; background:#fff; color:#171206; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV — sombre, logo jaune, CTA pilule jaune

```html
<nav class="bg-ink sticky top-0 z-50 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2">
      <span class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-ink" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg></span>
      <span data-sg-path="brand" class="text-white font-bold text-lg tracking-tight">{MARQUE}</span>
    </a>
    <div class="hidden md:flex items-center gap-8 text-sm text-white/80">
      <a href="#services" data-sg-path="nav[0]" class="hover:text-white transition-colors">Services</a>
      <a href="#pricing" data-sg-path="nav[1]" class="hover:text-white transition-colors">Tarifs</a>
    </div>
    <a href="#contact" data-sg-path="nav.cta" class="bg-primary text-ink font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition-all">{CTA_NAV}</a>
  </div>
</nav>
```

### 3b. HERO — sombre, badge note, 2 colonnes

```html
<section class="relative bg-ink overflow-hidden" style="min-height:600px;">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-50" />
  <div class="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <!-- Badge note (étoiles) -->
      <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
        <span class="text-primary">★★★★★</span>
        <span data-sg-path="hero.rating" class="text-white font-bold text-sm">{NOTE}</span>
        <span data-sg-path="hero.ratingText" class="text-white/60 text-xs">{MENTION AVIS}</span>
      </div>
      <h1 data-sg-path="hero.title" class="text-white font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">{TITRE}</h1>
      <p data-sg-path="hero.subtitle" class="text-white/70 text-lg mb-8 max-w-md">{ACCROCHE}</p>
      <a href="#contact" data-sg-path="hero.cta" class="inline-block bg-primary text-ink font-semibold px-7 py-3.5 rounded-full hover:brightness-110 transition-all">{CTA}</a>
    </div>
    <!-- (colonne droite : visuel/carte de réservation optionnelle) -->
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero sombre** `bg-ink` (brun-noir) avec photo `opacity-50`, accent **jaune
   `#FEBF03`**.
2. **Badge de note** (étoiles jaunes + note + mention avis) en pilule translucide
   au-dessus du titre.
3. **Boutons en pilule jaune** (`bg-primary text-ink rounded-full`).
4. Sections du corps **claires** (`bg`/blanc) — contraste avec le hero sombre.
5. Logo = carré jaune arrondi. Typo Plus Jakarta Sans bold.

## 4. Sections du corps

Fond **clair** `bg` (#F2F7F9) / blanc, cartes `rounded-2xl border border-border`,
`py-20`. Sections services : SERVICES (grille de prestations avec icônes/photos),
COMMENT ÇA MARCHE (étapes), POURQUOI NOUS, TARIFS (formules, l'une mise en avant
jaune), TÉMOIGNAGES (étoiles), FAQ, CTA (panneau sombre ou jaune). FOOTER sombre
`bg-ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français rassurant, registre services à domicile/ménage. Titre orienté bénéfice
(maison propre, temps gagné). Mentions de confiance (avis, vérifié, assuré).
Accroches concrètes (réservation simple, équipe fiable). Chaleureux et pro.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services/formules, le
nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, jaune + ink + bg clair), structure du header (hero
sombre + badge note + CTA pilule jaune), l'alternance hero sombre / corps clair,
le jaune accent.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en jaune + ink + clair ; jamais une couleur hors palette.
