# Design System — hiphop-producer (producteur hip-hop, condensé brut)

## 1. ADN

Site de **producteur / artiste hip-hop, brut et urbain** : fond **noir**, texte
gris clair, accent **bleu électrique** (#0000ee). La signature : un **titre géant
en Big Shoulders Display** (police condensée ultra-grasse, capitales) et une
**marque centrée** dans la nav. Labels en petites capitales espacées. Énergie
street, sortie de projet, booking. À l'opposé du jazz (serif feutré) : ici
**condensé, black, capitales, mixtape**.

## 2. Tokens (verrouillés)

Polices : **Big Shoulders Display** (`.font-display`, condensée, 400–900) + **Inter**.

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#000000', paper:'#cccccc', white2:'#ffffff', accent:'#0000ee', panel:'#0a0a0a', line:'rgba(204,204,204,0.2)' },
  fontFamily: { display:['"Big Shoulders Display"','sans-serif'], sans:['Inter','sans-serif'] },
  letterSpacing: { label:'0.18em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#000; color:#ccc; margin:0; }
.font-display { font-family:'"Big Shoulders Display"',sans-serif; }
```

## 3. HEADER — signature

### 3a. NAV — marque CENTRÉE

`fixed top-0 backdrop-blur-sm bg-ink/50`. La **marque est centrée** (display
extrabold), des liens de chaque côté.

```html
<header class="fixed top-0 inset-x-0 z-50 backdrop-blur-sm bg-ink/50">
  <nav class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between relative">
    <ul class="hidden md:flex items-center gap-7 font-sans text-[11px] font-medium tracking-label uppercase text-paper/70">
      <li><a href="#music" data-sg-path="nav[0]" class="hover:text-white2 transition-colors">Musique</a></li>
      <li><a href="#about" data-sg-path="nav[1]" class="hover:text-white2 transition-colors">À propos</a></li>
    </ul>
    <a href="#top" data-sg-path="brand" class="font-display font-extrabold text-2xl tracking-wider uppercase text-white2 absolute left-1/2 -translate-x-1/2">{MARQUE}</a>
    <ul class="hidden md:flex items-center gap-7 font-sans text-[11px] font-medium tracking-label uppercase text-paper/70">
      <li><a href="#dates" data-sg-path="nav[2]" class="hover:text-white2 transition-colors">Dates</a></li>
      <li><a href="#booking" data-sg-path="nav[3]" class="hover:text-white2 transition-colors">Booking</a></li>
    </ul>
    <a href="#booking" data-sg-path="cta" class="md:hidden font-sans text-[11px] font-medium tracking-label uppercase text-white2">Réserver</a>
  </nav>
</header>
```

### 3b. HERO — badge + titre Big Shoulders géant + bande d'infos

```html
<section id="top" class="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
  <div class="relative z-10 mx-auto max-w-7xl w-full px-6 text-center">
    <span data-sg-path="hero.badge" class="inline-block font-sans text-[10px] font-semibold tracking-label uppercase border border-paper/40 rounded-full px-4 py-1 text-paper mb-8">{BADGE}</span>
    <h1 class="font-display font-black uppercase leading-[0.92] text-white2 text-6xl sm:text-7xl md:text-8xl lg:text-[112px]">
      <span class="block" data-sg-path="hero.titleLine1">{LIGNE 1}</span>
      <span class="block" data-sg-path="hero.titleLine2">{LIGNE 2}</span>
    </h1>
  </div>
  <!-- Bande d'infos 3 colonnes, séparées par des filets -->
  <div class="relative z-10 mx-auto max-w-7xl w-full px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-line border-y border-line">
    <div class="bg-ink p-6"><span data-sg-path="hero.info[0].label" class="font-sans text-[10px] tracking-label uppercase text-paper/60">{LABEL}</span><p data-sg-path="hero.info[0].value" class="font-display text-2xl text-white2 mt-1">{VALEUR}</p></div>
    <!-- … 2 autres … -->
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Titre Big Shoulders Display géant** `font-display font-black uppercase
   leading-[0.92] text-6xl … lg:text-[112px]` — le condensé black capitales fait
   l'identité street.
2. **Marque centrée** dans la nav (`absolute left-1/2 -translate-x-1/2`,
   display extrabold).
3. Fond **noir**, accent **bleu `#0000ee`** rare, labels petites capitales `tracking-label`.
4. **Bande d'infos 3 colonnes** séparées par des filets `bg-line` sous le hero.

## 4. Sections du corps

Fond noir, panneaux `bg-panel`, filets `border-line`, `py-24`. Sections :
MUSIQUE/SORTIES (cartes d'albums/singles), À PROPOS, DATES (concerts), BEATS/
SERVICES, BOOKING/CONTACT (accent bleu). Titres Big Shoulders. FOOTER noir,
« Propulsé par Akyra ».

## 5. Ton éditorial

Français direct, registre rap/prod. Titre = nom de projet/sortie en 2 lignes
capitales. Badge « Nouvelle sortie ». Labels courts. Accroches percutantes
(sorties, prod, collabs, booking). Brut, pas corporate.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de sorties/dates, le nom
d'artiste (marque centrée), retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir + Big Shoulders + bleu rare), structure du header
(marque centrée + titre condensé géant + bande d'infos), fond noir.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir + Big Shoulders + bleu ; jamais une couleur
hors palette ou une typo douce.
