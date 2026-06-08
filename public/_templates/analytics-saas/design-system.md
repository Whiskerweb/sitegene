# Design System — analytics-saas (SaaS / produit, dégradés indigo)

## 1. ADN

Site **SaaS produit clair et aérien** : fond blanc cassé/lavande très pâle,
titres en **texte dégradé** (cyan → indigo → violet), une **nav flottante en
pilule** (verre dépoli) centrée en haut. Beaucoup d'espace, typo Manrope
semi-bold, accents indigo/violet doux. Émotion : moderne, tech, rassurant,
« growth ». À l'opposé des artisans/photographes : ici **lumineux, dégradés,
pilules, produit numérique**.

## 2. Tokens (verrouillés)

Polices : **Manrope** (titres) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:'#1e2b3a', muted:'#465478', bg:'#f9fafb', surface:'#ffffff',
    cyan:'#80e5ff', indigo:'#5b63d8', iris:'#7584d6', violet:'#545c9e',
    soft:'#dfe1f5', ribbon:'#7d86f0', line:'#e5e8eb',
  },
  fontFamily: { sans:['Manrope','sans-serif'], body:['Inter','sans-serif'] },
  fontSize: { d1:['5rem',{lineHeight:'1.02'}], d2:['3.5rem',{lineHeight:'1.05'}], d3:['2.5rem',{lineHeight:'1.1'}] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#f9fafb; color:#1e2b3a; margin:0; }
h1,h2,h3 { font-family:'Manrope',sans-serif; }
/* Titre en dégradé (clip texte) */
.grad-title { background:linear-gradient(95deg,#80e5ff 0%,#7584d6 40%,#545c9e 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
/* Fond de hero en dégradé lavande pâle */
.grad-soft { background:linear-gradient(120deg,#eef0fb 0%,#f6f3ff 50%,#f9fafb 100%); }
```

## 3. HEADER — signature

### 3a. NAV flottante en pilule

`fixed top-4`, centrée (`flex justify-center`), une **pilule en verre dépoli** :
`max-w-3xl bg-white/70 backdrop-blur-xl border border-white/60 rounded-full shadow`.

```html
<header class="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
  <nav class="w-full max-w-3xl bg-white/70 backdrop-blur-xl border border-white/60 rounded-full shadow-[0_10px_40px_-12px_rgba(84,92,158,.35)] px-3 py-2 flex items-center justify-between">
    <span data-sg-path="brand" class="font-bold text-lg tracking-tight text-ink pl-3">{MARQUE}</span>
    <div class="hidden md:flex items-center gap-7 text-sm text-muted">
      <a href="#features" data-sg-path="nav[0]" class="hover:text-ink transition-colors">Fonctionnalités</a>
      <a href="#pricing" data-sg-path="nav[1]" class="hover:text-ink transition-colors">Tarifs</a>
    </div>
    <a href="#cta" data-sg-path="nav.cta" class="rounded-full bg-ribbon text-white text-sm font-semibold px-5 py-2">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — titres dégradés centrés sur fond lavande

```html
<section class="relative overflow-hidden pt-36 pb-20 grad-soft text-center">
  <span data-sg-path="hero.kicker" class="text-xs font-semibold uppercase tracking-[0.15em] text-iris">{KICKER}</span>
  <h1 class="font-sans font-semibold text-d2 md:text-d1 tracking-tight mt-5">
    <span class="grad-title" data-sg-path="hero.title_a">{TITRE LIGNE 1 — en dégradé}</span>
  </h1>
  <h1 class="font-sans font-semibold text-d2 md:text-d1 tracking-tight mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
    <span class="text-ink" data-sg-path="hero.title_b">{MOT}</span>
    <!-- mot-clé encapsulé dans une PILULE à bord iris, en dégradé -->
    <span class="inline-flex items-center rounded-full border border-iris/40 bg-white/60 px-5 py-1 grad-title" data-sg-path="hero.title_c">{MOT-CLÉ}</span>
    <span class="text-ink" data-sg-path="hero.title_d">{MOT}</span>
  </h1>
  <p data-sg-path="hero.subtitle" class="mx-auto max-w-xl text-muted text-lg mt-7">{ACCROCHE}</p>
  <div class="mt-9 flex justify-center gap-3">
    <a href="#cta" data-sg-path="hero.cta" class="rounded-full bg-ribbon text-white font-semibold px-7 py-3">{CTA}</a>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Nav flottante en pilule** verre dépoli (`fixed top-4` centrée, `rounded-full
   bg-white/70 backdrop-blur-xl`).
2. **Titres en texte dégradé** `.grad-title` (cyan→iris→violet), taille `text-d1`
   (5rem), Manrope semi-bold ; et un **mot-clé enfermé dans une pilule** au milieu
   du titre.
3. Fond de hero **`.grad-soft`** lavande pâle, contenu **centré**.
4. CTA = **pilule indigo/ribbon** pleine. Palette claire indigo/violet/cyan.

## 4. Sections du corps

Fond `bg` clair, sections aérées (`py-20`/`py-30`), cartes `bg-surface rounded-2xl
border border-line shadow`. Sections SaaS typiques : logos clients, FONCTIONNALITÉS
(grille de cartes avec icônes indigo), capture produit/mockup, statistiques
(gros chiffres dégradés), TARIFS (cartes de plans, l'une mise en avant en
`ribbon`), FAQ, CTA final (panneau dégradé). FOOTER clair, « Propulsé par Akyra ».

## 5. Ton éditorial

Français produit/tech, orienté bénéfice et croissance, clair et confiant.
Kickers en capitales courtes. Titres percutants 2-4 mots avec un mot-clé mis en
pilule. Accroches orientées résultat. Pas de jargon obscur.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, le nombre de features/plans, les couleurs
DANS la gamme indigo/violet/cyan, le nom de produit, retirer une section sans
matière.

**VERROUILLÉ** : tokens (§2), nav pilule flottante, titres dégradés `.grad-title`,
fond `.grad-soft`, CTA pilule, la clarté lavande.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en clair + dégradés indigo + pilules ; jamais un bloc
sombre ou une couleur hors gamme.
