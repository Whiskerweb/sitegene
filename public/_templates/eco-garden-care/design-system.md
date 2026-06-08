# Design System — eco-garden-care (paysagiste / jardin, naturel)

## 1. ADN

Site de **jardinier-paysagiste, naturel et apaisant** : fond **crème chaud**,
encres profondes, accent **vert lime** (#BEDD25) ponctué de **vert forêt**
(#274839). Titres en **Playfair Display serif** (élégance organique), corps Inter.
Boutons en **pilule lime** arrondie. Photos de jardins, ambiance écologique,
verdure. À l'opposé des artisans techniques (électricien/plombier, sombres et
gras) : ici **clair, crème, serif, vert, vivant**.

## 2. Tokens (verrouillés)

Polices : **Inter** (corps) + **Playfair Display** (`.font-display`, titres serif).

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#BEDD25', ink:'#1F1F1F', forest:'#274839', bg:'#F2F1E7', muted:'#606060', white:'#FFFFFF' },
  fontFamily: { sans:['Inter','sans-serif'], display:['"Playfair Display"','serif'] },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#F2F1E7; color:#1F1F1F; margin:0; }
/* Bouton pilule lime */
.btn-primary { display:inline-flex; align-items:center; gap:8px; background:#BEDD25; color:#1F1F1F; font-size:15px; font-weight:600; padding:12px 24px; border-radius:50px; text-decoration:none; transition:.2s; }
.btn-primary:hover { background:#afc91f; transform:translateY(-1px); }
/* Soulignement nav au survol */
.nav-link { position:relative; color:#1F1F1F; text-decoration:none; font-size:15px; }
.nav-link:hover { color:#274839; }
/* Badge-pilule lime à pastille (label de section + badges du hero) */
.section-label { display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:500; color:#1F1F1F; background:rgba(190,221,37,.18); border-radius:50px; padding:6px 14px; }
.section-label::before { content:''; display:inline-block; width:8px; height:8px; border-radius:50%; background:#BEDD25; }
```

## 3. HEADER — signature

### 3a. NAV

`fixed top-0 bg-bg/90 backdrop-blur-sm border-b border-ink/5`. Marque + petite
feuille, liens `.nav-link`, CTA **pilule lime** `.btn-primary`.

```html
<header class="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-ink/5">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2 text-[18px] font-semibold text-ink no-underline">
      <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary"><svg class="w-4 h-4 text-forest" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 6 5 10 5 14a7 7 0 0014 0c0-4-2-8-7-12z"/></svg></span>
      <span data-sg-path="brand">{MARQUE}</span>
    </a>
    <nav class="hidden md:flex items-center gap-8">
      <a href="#about" data-sg-path="nav[0]" class="nav-link">À propos</a>
      <a href="#services" data-sg-path="nav[1]" class="nav-link">Services</a>
      <a href="#" data-sg-path="navContact" class="nav-link">Contact &amp; devis</a>
    </nav>
    <a href="#contact" data-sg-path="navCta" class="btn-primary text-sm hidden md:inline-flex">{CTA_NAV}</a>
  </div>
</header>
```

### 3b. HERO — colonne unique à gauche, photo en FOND fondu à droite

Le hero n'est PAS deux colonnes : c'est un **bloc de texte aligné à gauche**
(`max-w-xl`), posé sur le fond crème, avec la **photo en arrière-plan sur la
moitié droite** qui **se fond dans le crème** via un dégradé (pas de carte, pas
de coins arrondis sur l'image). Au-dessus du titre, **deux badges-pilules**
`.section-label`. Le dernier mot du titre est en **italique** (`<em>`).

```html
<section class="pt-16 min-h-screen flex items-center relative overflow-hidden">
  <!-- Photo en FOND sur la moitié droite, fondue dans le crème -->
  <div class="absolute top-0 right-0 w-full md:w-1/2 h-full">
    <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-l from-transparent to-bg"></div>
  </div>
  <!-- Bloc texte à GAUCHE -->
  <div class="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
    <div class="max-w-xl">
      <!-- Deux badges-pilules lime à pastille -->
      <div class="flex flex-wrap gap-3 mb-8">
        <span data-sg-path="features[0].title" class="section-label text-sm">{BADGE 1}</span>
        <span data-sg-path="features[1].title" class="section-label text-sm">{BADGE 2}</span>
      </div>
      <!-- Titre Playfair, dernier mot en italique -->
      <h1 data-sg-path="hero.tagline" class="text-4xl md:text-[62px] font-medium leading-tight text-ink mb-6" style="font-family:'Playfair Display',serif;">{TITRE — promesse} <em>{mot-clé}</em></h1>
      <p data-sg-path="hero.description" class="text-[18px] text-muted mb-8 leading-relaxed">{ACCROCHE}</p>
      <a href="#contact" data-sg-path="hero.cta" class="btn-primary">{CTA}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Fond **crème `#F2F1E7`**, titres **Playfair Display serif** `text-4xl
   md:text-[62px] font-medium`, **dernier mot en italique** (`<em>`) — la serif
   sur crème fait l'élégance organique.
2. **Hero colonne unique à gauche** (`max-w-xl`), avec la **photo en fond sur la
   moitié droite, fondue dans le crème** (`bg-gradient-to-l from-transparent to-bg`).
   JAMAIS une carte-image arrondie à droite.
3. **Deux badges-pilules `.section-label`** (lime translucide + pastille lime)
   au-dessus du titre.
4. Accent **vert lime `#BEDD25`** : CTA en **pilule lime** `.btn-primary` avec
   **flèche** ; éyebrows/labels en **vert forêt `#274839`**.
5. Logo = pastille lime ronde + petite feuille forêt. Coins très arrondis
   (pilules `50px`).

## 4. Sections du corps

Fond `bg` crème / sections `white`, `py-16`/`py-20`, cartes `rounded-[24px]`.
Sections paysagiste : SERVICES (grille de prestations avec icônes vertes), À
PROPOS (texte serif + photo), RÉALISATIONS (galerie avant/après), POURQUOI NOUS
(engagements écolo), TÉMOIGNAGES, CONTACT/DEVIS (CTA lime). FOOTER vert forêt ou
crème, « Propulsé par Akyra ».

## 5. Ton éditorial

Français doux, naturel, rassurant. Registre jardin/écologie/entretien. Titre =
promesse (transformer/entretenir l'espace extérieur). Éyebrows verts courts.
Accroches concrètes (entretien, création, élagage, écoresponsable). Pas
d'agressivité commerciale ; sérénité et soin.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services/réalisations,
le nom, retirer une section sans matière (avis absents → « nos engagements »).

**VERROUILLÉ** : tokens (§2, crème + lime + forêt + Playfair), structure du header
(serif + pilule lime + 2 colonnes), les coins très arrondis, l'ambiance claire/verte.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en crème + lime/forêt + Playfair ; jamais une couleur
hors palette ou un style sombre/technique.
