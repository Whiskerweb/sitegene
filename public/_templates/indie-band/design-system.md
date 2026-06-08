# Design System — indie-band (groupe indie, typographie fil de fer)

## 1. ADN

Site de **groupe indie / alternatif, brut et nocturne** : fond **noir**, texte
ivoire, accent **bleu électrique** (#0000ee). La signature : le nom du groupe en
**Bungee Hairline** (display ultra-fine, capitales, interlettrage), un **bandeau
marquee** (texte défilant) en haut, des labels monospace, et des **boutons
carrés** qui passent au bleu au survol. Ton DIY, concert, vinyle. À l'opposé du
hip-hop (Big Shoulders épais) : ici **noir, fil de fer fin, marquee, bleu**.

## 2. Tokens (verrouillés)

Polices : **Bungee Hairline** (`.font-display`, fil de fer) + **Inter** + **Karla**.

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#000000', paper:'#fafafa', soft:'#f1f1f1', accent:'#0000ee', panel:'#0f0f0f', line:'#1a1a1a', muted:'#a1a1a1', dim:'#6f6e6e' },
  fontFamily: { display:['"Bungee Hairline"','sans-serif'], sans:['Inter','sans-serif'], mono:['Karla','monospace'] },
  letterSpacing: { label:'0.18em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#000; color:#fafafa; margin:0; }
.font-display { font-family:'"Bungee Hairline"',sans-serif; }
.display-title { letter-spacing:0.14em; }
/* Bandeau défilant (marquee) */
@keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
.marquee-track { display:inline-flex; white-space:nowrap; animation:marquee 22s linear infinite; }
@media (prefers-reduced-motion:reduce){ .marquee-track{animation:none} }
```

## 3. HEADER — signature

### 3a. HEADER — marquee + nav centrée

`fixed top-0 border-b border-line bg-ink/70 backdrop-blur-sm`. Un **bandeau
marquee** (texte défilant, mono, séparateurs bleus) PUIS une **nav centrée** (mono).

```html
<header class="fixed top-0 inset-x-0 z-50 border-b border-line bg-ink/70 backdrop-blur-sm overflow-hidden">
  <div class="overflow-hidden border-b border-line py-1.5">
    <div class="marquee-track font-mono text-[11px] tracking-label uppercase text-muted">
      <span class="px-4" data-sg-path="ticker[0]">{TICKER 1}</span><span class="text-accent">·</span>
      <span class="px-4" data-sg-path="ticker[1]">{TICKER 2}</span><span class="text-accent">·</span>
      <!-- répéter le contenu une 2e fois pour la boucle continue -->
    </div>
  </div>
  <nav class="h-11 flex items-center justify-center gap-6 sm:gap-10 font-mono text-[11px] tracking-label uppercase">
    <a href="#top" data-sg-path="nav[0]" class="text-paper hover:text-accent transition-colors">Accueil</a>
    <a href="#tour" data-sg-path="nav[1]" class="text-muted hover:text-accent transition-colors">Tournée</a>
    <a href="#releases" data-sg-path="nav[2]" class="text-muted hover:text-accent transition-colors">Écouter</a>
  </nav>
</header>
```

### 3b. HERO — nom du groupe en Bungee Hairline géant

Le hero est `min-h-screen flex flex-col justify-between` : le **nom + tagline en
HAUT**, les **3 boutons en BAS à DROITE** (l'espace vertical les sépare).

```html
<section id="top" class="relative min-h-screen flex flex-col justify-between overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink"></div>
  <!-- HAUT : nom du groupe + tagline -->
  <div class="relative z-10 pt-24 px-6 md:px-10">
    <h1 data-sg-path="brand" class="font-display display-title uppercase text-paper text-5xl sm:text-7xl md:text-8xl lg:text-[120px] leading-none">{NOM DU GROUPE}</h1>
    <p data-sg-path="hero.tagline" class="mt-4 font-mono text-xs md:text-sm tracking-wide uppercase text-paper/80 max-w-md">{ACCROCHE}</p>
  </div>
  <!-- BAS DROITE : 3 boutons carrés -->
  <div class="relative z-10 pb-12 px-6 md:px-10 flex justify-end">
    <div class="flex flex-wrap gap-3">
      <a href="#band" data-sg-path="heroCtas[0]" class="bg-paper text-ink font-mono text-[11px] tracking-label uppercase px-6 py-3 hover:bg-accent hover:text-white transition-colors">{CTA1}</a>
      <a href="#tour" data-sg-path="heroCtas[1]" class="bg-paper text-ink font-mono text-[11px] tracking-label uppercase px-6 py-3 hover:bg-accent hover:text-white transition-colors">{CTA2}</a>
      <a href="#releases" data-sg-path="heroCtas[2]" class="bg-paper text-ink font-mono text-[11px] tracking-label uppercase px-6 py-3 hover:bg-accent hover:text-white transition-colors">{CTA3}</a>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Nom du groupe en Bungee Hairline géant** `.font-display .display-title
   uppercase text-5xl … lg:text-[120px] leading-none` — la finesse fil de fer à
   grande taille fait l'indé.
2. **Bandeau marquee** (texte défilant mono, séparateurs bleus) en haut du header.
3. **Boutons carrés** `bg-paper text-ink font-mono` qui passent au **bleu**
   (`hover:bg-accent hover:text-white`) au survol.
4. Fond **noir**, labels monospace `tracking-label`, accent bleu `#0000ee`.

## 4. Sections du corps

Fond noir/`panel`, filets `border-line`, `py-28 md:py-40`. Sections : LE GROUPE
(texte + photo), TOURNÉE/DATES (liste de concerts), RELEASES/DISCOGRAPHIE (cartes),
GALERIE, ÉCOUTER/CONTACT (accent bleu). Titres Bungee Hairline. FOOTER noir,
« Propulsé par Akyra ».

## 5. Ton éditorial

Français indé, minuscules/capitales tranchées, registre concert/vinyle. Le hero =
le nom du groupe. Tickers courts (réservations, setlist, merch). Accroches brutes
sur le son, les dates, l'album. DIY et sincère.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de dates/releases, le nom
du groupe, retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + Bungee Hairline + bleu), structure du header
(marquee + nav centrée + nom fil-de-fer géant), boutons carrés hover bleu, fond noir.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + Bungee Hairline + bleu ; jamais une couleur
hors palette ou une typo épaisse.
