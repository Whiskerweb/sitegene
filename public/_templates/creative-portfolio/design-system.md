# Design System — creative-portfolio (créatif / freelance, nom géant)

## 1. ADN

Portfolio de **créatif / freelance, brutaliste typographique** : fond **noir**,
blanc, gris. La signature : le **prénom + nom en TRÈS grand** (clamp jusqu'à
240px, minuscules) dont **une ligne est pleine et l'autre en contour** (texte
outline). Une **horloge live** dans la nav. Inter, échelle massive, filets nets.
Proche d'un studio mais centré sur **la personne** (le nom EST le hero). À
l'opposé du SaaS : ici **noir, mega-nom, outline, perso**.

## 2. Tokens (verrouillés)

Police : **Inter** (variable, 400/700/900 + italique).

```js
tailwind.config = { theme: { extend: {
  colors: { ink:'#000000', paper:'#ffffff', muted:'#b3b3b3', dim:'#5a5a5a', deep:'#1f1f1f' },
  fontFamily: { sans:['"Inter"','sans-serif'] },
  fontSize: {
    'display-xl': ['clamp(80px,12vw,186px)', { lineHeight:'0.9', letterSpacing:'-0.03em' }],
    'display-lg': ['clamp(40px,7vw,80px)',   { lineHeight:'1.0', letterSpacing:'-0.025em' }],
    'display-md': ['clamp(28px,4vw,40px)',   { lineHeight:'1.1', letterSpacing:'-0.02em' }],
  },
}}};
```

CSS custom (recopier — le hero-name et son outline sont la signature) :

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#000; color:#fff; margin:0; }
nav { padding: 20px 24px; display:flex; align-items:center; justify-content:space-between; position:fixed; top:0; left:0; right:0; z-index:50; }
nav .brand-name { font-size:13px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#fff; }
nav .nav-links { display:flex; gap:32px; list-style:none; margin:0; padding:0; }
nav .nav-links a { font-size:13px; color:#fff; text-decoration:none; opacity:.8; }
nav .nav-links a:hover { opacity:1; }
.nav-clock { font-size:12px; letter-spacing:0.08em; color:#fff; opacity:.7; font-variant-numeric:tabular-nums; }
.hero { padding: 0 24px 48px; min-height:100vh; display:flex; flex-direction:column; justify-content:flex-end; }
.hero-name { font-size:clamp(100px,18vw,240px); font-weight:700; line-height:0.85; letter-spacing:-0.04em; text-transform:lowercase; color:#fff; margin:0; }
.hero-name .name-stroke { -webkit-text-stroke:2px #fff; color:transparent; }
.hero-tagline { max-width:480px; font-size:16px; line-height:1.6; color:#b3b3b3; margin-top:32px; }
```

## 3. HEADER — signature

### 3a. NAV — nom + liens + HORLOGE LIVE

```html
<nav>
  <span class="brand-name"><span data-sg-path="brand">{PRÉNOM}</span> <span data-sg-path="brand_last">{NOM}</span></span>
  <ul class="nav-links">
    <li><a href="#projects" data-sg-path="nav[0]">Réalisations</a></li>
    <li><a href="#about" data-sg-path="nav[1]">À propos</a></li>
    <li><a href="#contact" data-sg-path="nav[2]">Contact</a></li>
  </ul>
  <div class="nav-clock" id="nav-clock">LOCAL / 00:00:00</div>
</nav>
<script>
(function(){ function t(){ var n=new Date(), p=function(x){return String(x).padStart(2,'0')}, el=document.getElementById('nav-clock');
  if(el) el.textContent='LOCAL / '+p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds()); } t(); setInterval(t,1000); })();
</script>
```

### 3b. HERO — nom géant (1 ligne pleine + 1 ligne contour)

```html
<section class="hero" id="top">
  <h1 class="hero-name">
    <span data-sg-path="brand">{prénom}</span><br>
    <span class="name-stroke" data-sg-path="brand_last">{nom}</span>
  </h1>
  <p class="hero-tagline" data-sg-path="hero.tagline">{ACCROCHE — métier + positionnement}</p>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Nom géant** `.hero-name` (clamp jusqu'à 240px, minuscules, line-height 0.85)
   ancré en bas du hero plein écran.
2. **Une ligne pleine + une ligne en CONTOUR** (`.name-stroke`,
   `-webkit-text-stroke:2px`, texte transparent) — LE détail signature.
3. **Horloge live** `LOCAL / HH:MM:SS` (`tabular-nums`) dans la nav.
4. Palette **noir/blanc/gris**, Inter, échelle mega.

## 4. Sections du corps

Fond noir, `padding` généreux, filets. Sections : RÉALISATIONS (grille de projets,
grands visuels + titres `display-md`/`display-lg`), À PROPOS (texte + portrait),
RÉSULTATS/TÉMOIGNAGES, CONTACT (gros titre + email). Numérotation, labels
capitales. FOOTER noir, « Propulsé par Akyra ».

## 5. Ton éditorial

Français d'indépendant créatif : affirmé, concis, perso. Le hero = le nom. La
tagline = métier + spécialité. Labels courts en capitales. Chaque mot compte.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, le nombre de projets, le prénom/nom (hero +
nav), retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir/blanc + Inter mega), structure du header (nom
géant 1 ligne pleine + 1 contour + horloge live), l'échelle typographique, le noir.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir/blanc + Inter mega ; jamais une couleur ou un
style « doux ».
