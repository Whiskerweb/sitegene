# Design System — health-saas (SaaS santé / e-santé, clair)

## 1. ADN

Site **SaaS de santé / bien-être, clair et rassurant** : fond **blanc**, encres
profondes, surfaces **bleu-vert très pâle** (#f0f5f6) et accent **pêche doux**
(#ffce8a). La signature : un **hero en grande carte arrondie** (`rounded-[40px]`)
contenant une **photo (soignant)** avec le titre blanc et une **statistique**
superposés. Typo Urbanist semi-bold, ronde et moderne. Ton confiance, soin,
technologie au service de la santé. À l'opposé d'analytics-saas (dégradés indigo)
: ici **blanc, carte-image arrondie, pêche, humain**.

## 2. Tokens (verrouillés)

Polices : **Urbanist** (titres) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#0a0a0a', primary:'#0a0a0a', muted:'#3b3b3b', bg:'#ffffff', surface:'#f0f5f6', accent:'#ffce8a' },
  fontFamily: { sans:['Urbanist','ui-sans-serif','system-ui'], inter:['Inter','ui-sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',ui-sans-serif,system-ui; background:#fff; color:#0a0a0a; margin:0; }
h1,h2,h3 { font-family:'Urbanist',sans-serif; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0 bg-white/90 backdrop-blur-sm border-b border-black/5`. Marque + logo,
liens `.nav-link`, CTA (pilule sombre ou accent).

```html
<header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-black/5">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" data-sg-path="brand" class="flex items-center gap-2 font-bold text-xl text-ink">{MARQUE}</a>
    <nav class="hidden md:flex items-center gap-8 text-sm text-muted">
      <a href="#features" data-sg-path="nav[1]" class="hover:text-ink transition-colors">Fonctionnalités</a>
      <a href="#pricing" data-sg-path="nav[2]" class="hover:text-ink transition-colors">Tarifs</a>
      <a href="#testimonials" data-sg-path="nav[3]" class="hover:text-ink transition-colors">Avis</a>
    </nav>
    <a href="#cta" data-sg-path="nav.cta" class="rounded-full bg-ink text-white text-sm font-semibold px-5 py-2.5">{CTA_NAV}</a>
  </div>
</header>
```

### 3b. HERO — grande carte arrondie image + texte + stat

```html
<section class="bg-white pt-6 md:pt-8 pb-16">
  <div class="max-w-7xl mx-auto px-6">
    <div class="relative rounded-[40px] overflow-hidden min-h-[600px] md:min-h-[680px]">
      <!-- Photo de fond (soignant/santé) -->
      <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10"></div>
      <!-- Contenu superposé, en bas -->
      <div class="relative z-10 h-full min-h-[600px] md:min-h-[680px] flex flex-col justify-end p-8 md:p-14 max-w-2xl">
        <span data-sg-path="hero.tagline" class="inline-block self-start text-xs font-semibold uppercase tracking-wider text-ink bg-accent rounded-full px-4 py-1 mb-6">{ÉYEBROW}</span>
        <h1 data-sg-path="hero.title" class="text-white font-semibold text-5xl md:text-7xl leading-[1.02] tracking-tight">{TITRE}</h1>
        <p data-sg-path="hero.subtitle" class="text-white/85 text-base md:text-lg max-w-md mt-5">{ACCROCHE}</p>
        <!-- Statistique -->
        <div class="mt-8 flex items-end gap-3">
          <span data-sg-path="hero.stat_num" class="text-4xl md:text-5xl font-bold text-white">{NOMBRE}</span>
          <span data-sg-path="hero.stat_unit" class="text-xl font-bold pb-1 text-white">{UNITÉ}</span>
          <p data-sg-path="hero.stat_label" class="text-white/75 text-xs max-w-[190px] mb-1">{LIBELLÉ}</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero = grande carte arrondie** `rounded-[40px] min-h-[680px]` contenant une
   **photo** + dégradé sombre + texte blanc superposé en bas.
2. Titre **Urbanist semi-bold** `text-5xl md:text-7xl leading-[1.02] tracking-tight`,
   blanc sur la photo.
3. **Éyebrow en pilule pêche `#ffce8a`** (texte encre), + une **statistique**
   (gros nombre + unité + libellé) dans le hero.
4. Fond **blanc**, surfaces `surface` pâles, accent pêche. CTA = pilule encre.

## 4. Sections du corps

Fond blanc / `surface` pâle, cartes `rounded-[24px]`, `py-20`. Sections SaaS
santé : logos/confiance, FONCTIONNALITÉS (cartes avec icônes), capture produit,
STATS (gros chiffres), TARIFS (plans, l'un mis en avant), TÉMOIGNAGES, FAQ, CTA
final (panneau `surface` ou image arrondie). FOOTER clair, « Propulsé par Akyra ».

## 5. Ton éditorial

Français rassurant, registre e-santé/bien-être, clair et humain. Éyebrows courts.
Titre orienté bénéfice santé. Stat crédible. Accroches sur le soin, le suivi, la
fiabilité. Pas de jargon médical anxiogène ; confiance et simplicité.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de features/plans, la stat,
le nom, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, blanc + pêche + Urbanist), structure du header
(grande carte-image arrondie + texte superposé + stat), accent pêche, la clarté.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en blanc + pêche + Urbanist ; jamais un fond sombre ou
une couleur hors palette.
