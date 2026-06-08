# Design System — potozon (photographe pop, stickers & ruban)

## 1. ADN

Photographe **pop, ludique et énergique** : fond **noir** (#111111), texte
ivoire, deux accents vifs — **jaune** (#ffc400) et **violet** (#8b7cf6). La
signature : un **gros titre sur 2 lignes** (Plus Jakarta Sans extra-bold,
`tracking-tight`) accompagné d'un **sticker** (badge rond incliné) et d'un **ruban**
(« Sublime ») coloré. Ambiance créative, décalée, joyeuse. À l'opposé d'alice-r
(éditorial chaud) : ici **noir + jaune/violet, stickers, pop**.

## 2. Tokens (verrouillés)

Police : **Plus Jakarta Sans** (400–800).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#111111', paper:'#fcfcfc', yellow:'#ffc400', violet:'#8b7cf6', muted:'#9ca3af', line:'#e5e7eb' },
  fontFamily: { sans:['"Plus Jakarta Sans"','sans-serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Plus Jakarta Sans',sans-serif; background:#111111; color:#fcfcfc; margin:0; }
/* Sticker rond incliné qui flotte */
.sticker { display:inline-flex; align-items:center; justify-content:center; border-radius:9999px; transform:rotate(-12deg); }
@keyframes spin-slow { to { transform:rotate(360deg); } }
.sticker-spin { animation:spin-slow 18s linear infinite; }
/* Ruban incliné */
.ribbon { display:inline-block; transform:rotate(-3deg); }
@media (prefers-reduced-motion:reduce){ .sticker-spin{animation:none} }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0` transparente. Marque + liens ivoire, CTA **pilule jaune**.

```html
<header class="fixed top-0 inset-x-0 z-50">
  <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between text-paper">
    <a href="#top" data-sg-path="brand" class="text-lg font-bold tracking-tight">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-8 text-sm text-paper/80">
      <li><a href="#services" data-sg-path="nav[0]" class="hover:text-paper transition-colors">Services</a></li>
      <li><a href="#works" data-sg-path="nav[1]" class="hover:text-paper transition-colors">Galerie</a></li>
    </ul>
    <a href="#contact" data-sg-path="nav.cta" class="rounded-full bg-yellow text-ink text-sm font-bold px-5 py-2.5 hover:brightness-95 transition-all">{CTA_NAV}</a>
  </nav>
</header>
```

### 3b. HERO — titre 2 lignes + sticker + ruban

```html
<section id="top" class="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 pt-20">
  <!-- Sticker rond incliné (jaune ou violet), en haut -->
  <span data-sg-path="hero.sticker" class="sticker sticker-spin bg-violet text-ink text-[11px] font-bold uppercase tracking-wide w-28 h-28 mb-6">{STICKER}</span>
  <!-- Gros titre 2 lignes -->
  <h1 class="font-bold tracking-tight leading-[0.95] text-5xl sm:text-6xl md:text-7xl">
    <span class="block" data-sg-path="hero.line1">{LIGNE 1}</span>
    <span class="block" data-sg-path="hero.line2">{LIGNE 2}
      <!-- Ruban coloré sur un mot -->
      <span data-sg-path="hero.ribbon" class="ribbon bg-yellow text-ink px-3">{RUBAN}</span>
    </span>
  </h1>
  <p data-sg-path="hero.subtitle" class="mt-6 text-paper/70 text-base md:text-lg max-w-lg">{ACCROCHE}</p>
  <a href="#contact" data-sg-path="hero.cta" class="inline-block mt-8 rounded-full bg-yellow text-ink font-bold px-7 py-3.5 hover:brightness-95 transition-all">{CTA}</a>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Gros titre 2 lignes** Plus Jakarta Sans **extra-bold `tracking-tight`**
   `text-5xl … md:text-7xl`, avec un mot **surligné par un ruban coloré**.
2. **Sticker rond incliné** (`.sticker`, badge jaune/violet, peut tourner lentement).
3. Fond **noir**, double accent **jaune `#ffc400` + violet `#8b7cf6`**.
4. CTA en **pilule jaune** (texte noir). Ambiance pop et ludique.

## 4. Sections du corps

Fond `ink`, accents jaune/violet, `py-24 md:py-32`. Sections : INTRO (textes
gauche/droite), CARTES, CITATION, SERVICES, COLLABORATIONS, RÉALISATIONS/WORKS,
TÉMOIGNAGES, FAQ. Stickers et rubans ponctuels. Titres Plus Jakarta bold. FOOTER
`ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français créatif, décalé, joyeux. Titre = accroche en 2 lignes (« La photographie
autrement »). Stickers courts et punchy. Accroches sur la créativité, la
différence, l'énergie. Pop, jamais corporate.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services, le nom, les
stickers/rubans, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + jaune/violet + Plus Jakarta), structure du
header (gros titre 2 lignes + sticker + ruban), les deux accents vifs, le ton pop.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + jaune/violet + stickers ; jamais une palette
terne ou un style figé.
