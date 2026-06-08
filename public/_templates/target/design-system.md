# Design System — target (photographe éditorial, wordmark géant)

## 1. ADN

Photographe **éditorial primé, net et affirmé** : fond **presque noir**
(#111113), texte blanc, surfaces gris très clair (#f1f1ef), accent **orange vif**
(#ff5a1f). Typo **Geist** (titres) + **Inter**. La signature : un **mot-titre
géant** (« PHOTOGRAPHE », `text-7xl`+) avec un **eyebrow** (« Créatif primé ») et
un **bloc d'infos de contact** (email, téléphone, rôle, lieu) façon carte de
visite éditoriale. Ton studio, prix, rigueur. À l'opposé de potozon (pop) : ici
**sobre, wordmark géant, orange, éditorial**.

## 2. Tokens (verrouillés)

Polices : **Geist** (`.font-display`, titres) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#111113', paper:'#ffffff', surface:'#f1f1ef', orange:'#ff5a1f', muted:'#9ca3af', line:'#e5e7eb' },
  fontFamily: { display:['Geist','sans-serif'], sans:['Inter','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#111113; color:#fff; margin:0; }
.font-display { font-family:'Geist',sans-serif; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0` transparente. Marque + liens, point orange, CTA.

```html
<header class="fixed top-0 inset-x-0 z-50">
  <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between text-white">
    <a href="#top" data-sg-path="hero.brand" class="font-display text-lg font-semibold tracking-tight">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 text-sm text-white/75">
      <li><a href="#works" data-sg-path="nav[0]" class="hover:text-white transition-colors">Réalisations</a></li>
      <li><a href="#services" data-sg-path="nav[1]" class="hover:text-white transition-colors">Services</a></li>
      <li><a href="#contact" data-sg-path="nav[2]" class="hover:text-white transition-colors">Contact</a></li>
    </ul>
    <a href="#contact" data-sg-path="nav.cta" class="rounded-full bg-orange text-white text-sm font-medium px-5 py-2.5 hover:brightness-105 transition-all">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — eyebrow + mot-titre géant + infos contact

```html
<section id="top" class="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-20">
  <div class="max-w-7xl mx-auto w-full">
    <!-- Eyebrow (point orange + label) -->
    <div class="flex items-center gap-2 mb-6">
      <span class="w-2 h-2 rounded-full bg-orange"></span>
      <span data-sg-path="hero.tagline" class="text-sm uppercase tracking-wider text-white/70">{ÉYEBROW}</span>
    </div>
    <!-- Mot-titre GÉANT -->
    <h1 data-sg-path="hero.title" class="font-display font-semibold tracking-tight leading-[0.9] text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">{MOT-TITRE}</h1>
    <p data-sg-path="hero.blurb" class="mt-6 text-white/70 text-base md:text-lg max-w-xl">{ACCROCHE}</p>
    <!-- Bloc infos contact (carte de visite éditoriale) -->
    <div class="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl text-sm">
      <div><div class="text-white/40 text-xs uppercase tracking-wider mb-1">Email</div><span data-sg-path="hero.email" class="text-white">{EMAIL}</span></div>
      <div><div class="text-white/40 text-xs uppercase tracking-wider mb-1">Téléphone</div><span data-sg-path="hero.phone" class="text-white">{TÉL}</span></div>
      <div><div class="text-white/40 text-xs uppercase tracking-wider mb-1">Rôle</div><span data-sg-path="hero.role" class="text-white">{RÔLE}</span></div>
      <div><div class="text-white/40 text-xs uppercase tracking-wider mb-1">Lieu</div><span data-sg-path="hero.location" class="text-white">{LIEU}</span></div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Mot-titre géant** Geist `font-display font-semibold leading-[0.9] text-6xl …
   lg:text-[9rem]` (ex. « PHOTOGRAPHE ») — la masse typographique fait l'éditorial.
2. **Eyebrow** = petit **point orange `#ff5a1f`** + label en capitales.
3. **Bloc d'infos contact** (email / téléphone / rôle / lieu) en grille sous le
   titre, façon carte de visite.
4. Fond **presque noir `#111113`**, accent orange, surfaces `surface` claires en sections.

## 4. Sections du corps

Alternance `ink` sombre / `surface` clair, `py-24 md:py-32`. Sections : CITATION,
INTRO, SERVICES, COLLABORATIONS (labels), RÉALISATIONS/WORKS (grandes photos),
TÉMOIGNAGES, FAQ, GALERIE. Titres Geist. Accent orange sur les CTA/labels. FOOTER
`ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français affirmé, studio, premium. Eyebrow type « Créatif primé ». Titre = un mot
fort (métier). Infos de contact concrètes. Accroches sur l'émotion, la vérité,
l'image. Net et rigoureux.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, le mot-titre, les infos contact, le
nombre de services, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, presque-noir + orange + Geist), structure du header
(eyebrow point orange + mot-titre géant + bloc contact), l'accent orange, la sobriété.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en presque-noir + orange + Geist ; jamais une couleur
hors palette ou un style chargé.
