# Design System — wedding-warm (mariage chaleureux, crème & or)

## 1. ADN

Photographe de **mariage chaleureux, élégant et lumineux** : hero **photo plein
écran**, titres en **Instrument Serif** (serif fine), fond **crème** (#F5F1EC)
dans le corps, accent **or doux** (#C1A55F). Nav **symétrique** en
`mix-blend-difference` avec la marque serif au centre. Boutons à **filet** qui
s'inversent au survol. Ton intime, doré, romantique. À l'opposé de luxury-wedding
(monochrome froid, ultra-fin) : ici **chaud, doré, serif, lumineux**.

## 2. Tokens (verrouillés)

Polices : **Instrument Serif** (`.font-serif`, titres) + **Archivo** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#050505', black:'#000000', cream:'#F5F1EC', blue:'#0000EE', gold:'#C1A55F', muted:'#5C5C5C' },
  fontFamily: { serif:['"Instrument Serif"','Georgia','serif'], sans:['"Archivo"','Inter','Arial','sans-serif'] },
  letterSpacing: { wide2:'0.2em' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Archivo',Inter,Arial,sans-serif; background:#F5F1EC; color:#050505; margin:0; }
.font-serif { font-family:'"Instrument Serif"',Georgia,serif; }
.btn-line { transition: background-color .4s ease, color .4s ease, border-color .4s ease; }
```

## 3. HEADER — signature

### 3a. NAV — symétrique, marque serif centrée, mix-blend

```html
<nav class="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-6 flex items-center justify-between mix-blend-difference text-white">
  <div class="flex items-center gap-8 text-[11px] tracking-wide2 uppercase font-medium">
    <a href="#services" data-sg-path="nav[0]" class="hover:opacity-70 transition-opacity">Prestations</a>
    <a href="#about" data-sg-path="nav[1]" class="hover:opacity-70 transition-opacity">À propos</a>
  </div>
  <a href="#" data-sg-path="brand" class="font-serif text-2xl md:text-3xl tracking-wide">{MARQUE}</a>
  <div class="flex items-center gap-8 text-[11px] tracking-wide2 uppercase font-medium">
    <a href="#" data-sg-path="nav[2]" class="hover:opacity-70 transition-opacity">Portfolio</a>
    <a href="#contact" data-sg-path="nav[3]" class="hover:opacity-70 transition-opacity">Contact</a>
  </div>
</nav>
```

### 3b. HERO — photo plein écran, titre serif 2 lignes

```html
<header id="home" class="relative h-screen min-h-[640px] w-full overflow-hidden bg-ink">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="absolute inset-0 w-full h-full object-cover" />
  <div class="absolute inset-0 bg-black/25"></div>
  <div class="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-16 md:pb-24 max-w-3xl">
    <h1 class="font-serif text-white leading-[0.95] text-5xl sm:text-7xl md:text-8xl">
      <span class="block" data-sg-path="hero.title1">{LIGNE 1}</span>
      <span class="block" data-sg-path="hero.title2">{LIGNE 2}</span>
    </h1>
    <p data-sg-path="hero.tagline" class="text-white/90 text-sm max-w-xs leading-relaxed mt-6">{ACCROCHE}</p>
    <a href="#services" data-sg-path="hero.cta" class="btn-line self-start mt-6 border border-white/60 text-white text-[11px] tracking-wide2 uppercase px-7 py-4 hover:bg-white hover:text-ink">{CTA}</a>
  </div>
</header>
```

### 3c. Signature à ne jamais perdre

1. **Hero photo plein écran** `h-screen bg-ink` + voile léger, contenu **ancré en
   bas à gauche**.
2. **Titre Instrument Serif** `text-5xl sm:text-7xl md:text-8xl leading-[0.95]`
   sur **2 lignes**, blanc — la serif fine et grande fait l'élégance.
3. **Nav symétrique** : liens gauche/droite autour de la **marque serif centrée**,
   en `mix-blend-difference`.
4. Accent **or `#C1A55F`** ; **bouton à filet** (`btn-line`) qui s'inverse au survol
   (`hover:bg-white hover:text-ink`).
5. Corps en **crème `#F5F1EC`** chaud.

## 4. Sections du corps

Fond crème, `px-6 md:px-12 py-24`, touches or. Sections : PRESTATIONS (liste/
grille serif), À PROPOS (texte serif + photo), GALERIE (photos mariage), PROCESS,
TÉMOIGNAGES, CONTACT (CTA filet ou or). Titres Instrument Serif. FOOTER crème ou
`ink`, « Propulsé par Akyra ».

## 5. Ton éditorial

Français romantique, lumineux, sensible. Titre = 2 lignes serif (capturer/instants).
Accroches sur l'émotion, la lumière, l'intemporel. Chaleureux, doré, jamais froid.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de prestations/images, le
nom, retirer une section sans matière (avis absents → « approche » serif).

**VERROUILLÉ** : tokens (§2, crème + Instrument Serif + or), structure du header
(photo plein écran + titre serif + nav symétrique marque centrée), accent or, btn-line.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en crème + serif + or ; jamais une couleur vive ou un
style froid.
