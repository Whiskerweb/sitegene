# Design System — wedding-fine-art (mariage fine-art, éditorial serif)

## 1. ADN

Photographe de mariage **fine-art, éditorial et chaleureux** : fond **crème**,
typographie **serif élégante** (Instrument Serif) en très grand, accents italiques
sensibles. Le hero est une **photo plein écran centrée** sous un titre serif
majuscule géant. La nav est en `mix-blend-difference` (s'inverse selon le fond).
Alternance de sections crème claires et de blocs **sombres chauds** (bark/ink).
Émotion : intemporel, romantique, artisanal, « pour les âmes libres ». À l'opposé
de luxury-wedding (froid, monochrome, ultra-fin) : ici c'est **chaud, serif,
crème, sensible**.

## 2. Tokens (verrouillés)

Polices : **Instrument Serif** (`.font-serif`, titres) + **Instrument Sans** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: {
    cream: '#fbf7ef',  /* fond clair principal */
    sand:  '#eee9df',  /* fond intermédiaire / footer */
    ink:   '#141414',  /* texte foncé / fond hero */
    bark:  '#2a2825',  /* fond de section sombre chaud (prestations) */
  },
  fontFamily: {
    serif: ['"Instrument Serif"', 'Georgia', 'serif'],
    sans:  ['"Instrument Sans"', 'sans-serif'],
  },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Instrument Sans', sans-serif; background:#fbf7ef; color:#141414; margin:0; }
.font-serif { font-family: 'Instrument Serif', serif; }
```

## 3. HEADER — signature

### 3a. HEADER (barre)

`absolute top-0`, **`mix-blend-difference`** (le texte s'inverse sur l'image),
réparti : à GAUCHE une icône appareil-photo + liens de nav ; à DROITE la marque
(initiales serif italiques + nom) ; bouton menu.

```html
<header class="flex text-slate-50 mix-blend-difference w-full z-50 px-6 py-8 absolute top-0 items-center justify-between">
  <div class="flex items-center gap-6">
    <a href="#" aria-label="Portfolio" class="hover:opacity-70 transition-opacity">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7v13c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
    </a>
    <nav class="hidden md:flex gap-6 text-sm uppercase tracking-widest font-light">
      <a href="#" data-sg-path="menu.home" class="hover:opacity-70 transition-opacity">Accueil</a>
      <a href="#" data-sg-path="menu.portfolio" class="hover:opacity-70 transition-opacity">Portfolio</a>
      <a href="#" data-sg-path="menu.contact" class="hover:opacity-70 transition-opacity">Contact</a>
    </nav>
  </div>
  <a href="#" class="flex items-center gap-3 uppercase tracking-widest text-slate-50">
    <span data-sg-path="brandInitials" class="text-2xl italic font-serif tracking-tighter">{INITIALES}</span>
    <span data-sg-path="brand" class="text-sm md:text-base font-light tracking-widest pt-1">{MARQUE}</span>
  </a>
  <button class="flex flex-col gap-y-1.5 p-2" aria-label="Menu"><span class="w-6 bg-current block" style="height:1px"></span><span class="w-6 bg-current block" style="height:1px"></span></button>
</header>
```

### 3b. HERO — photo plein écran, titre serif centré

```html
<section class="relative h-screen w-full overflow-hidden flex flex-col justify-center items-center text-center bg-ink">
  <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="object-cover object-center opacity-60 w-full h-full absolute inset-0" />
  <div class="relative z-10 flex flex-col items-center px-4 max-w-5xl mx-auto mt-16">
    <span data-sg-path="hero.region" class="text-xs md:text-sm uppercase tracking-[0.2em] text-white/80 mb-6 md:mb-8 font-light">{RÉGION}</span>
    <h1 class="text-6xl md:text-8xl lg:text-[7rem] leading-[0.9] font-serif tracking-tight text-white mb-6">
      <span data-sg-path="hero.title1">{MOT1}</span><br>
      <span data-sg-path="hero.title2">{MOT2}</span>
    </h1>
    <p data-sg-path="hero.subtitle" class="font-serif italic text-xl md:text-3xl text-white/90 mt-4 tracking-tight">{SOUS-TITRE poétique}</p>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. Hero `h-screen bg-ink`, photo plein écran `opacity-60`, contenu **centré**
   (`justify-center items-center text-center`).
2. Titre **serif géant** `font-serif text-6xl md:text-8xl lg:text-[7rem]
   leading-[0.9] tracking-tight`, en capitales, blanc — la serif à grande taille
   fait le fine-art. Sous-titre **serif italique**.
3. Nav `mix-blend-difference` (s'inverse), liens `uppercase tracking-widest
   font-light`, marque = initiales serif italiques + nom.
4. Palette **crème** chaude + sections sombres `bark`/`ink` ; jamais de couleur vive.
5. Icône appareil-photo en tête de nav.

## 4. Sections du corps

Alternance `bg-cream` (clair) / `bg-bark` ou `bg-ink` (sombre chaud), `py-24
md:py-32`. Titres en `font-serif` grand, textes `font-sans` `font-light`. Typique :
section À PROPOS (crème, photo + texte serif), PRESTATIONS (`bg-bark` sombre,
liste de services `services.items[].title`), GALERIE/PORTFOLIO (images plein
cadre), TÉMOIGNAGES, CONTACT (`bg-ink`), FOOTER `bg-sand` avec « Propulsé par Akyra ».

### Section SÉLECTION — galerie à SCROLL ÉPINGLÉ (interaction signature)

La section « Sélection » des catégories (Couples / Évasions / Mariages
intimistes / Éditorial) est une **galerie à défilement épinglé** : la section
reste fixée à l'écran pendant qu'on défile, et **à chaque cran de scroll la
catégorie active et l'image changent** (sans que la page n'avance visuellement),
jusqu'à avoir parcouru les 4 catégories. INCLURE CE BLOC VERBATIM (markup + JS),
en adaptant seulement les libellés, les chemins d'images et le nombre d'items
(la hauteur `height` = (nombre d'items + 1) × 100vh) :

```html
<section class="sel-pin relative bg-bark text-cream" style="height:500vh">
  <div class="sticky top-0 h-screen flex items-center overflow-hidden">
    <div class="max-w-[100rem] mx-auto px-6 lg:px-12 w-full grid lg:grid-cols-2 gap-16 items-center">
      <!-- Images empilées : seule l'active est visible (crossfade) -->
      <div class="relative w-full max-w-[520px] aspect-[3/4] mx-auto">
        <img data-sg-img="selection.items[0].image" data-sel-img="0" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-100" src="{IMG0}" alt="">
        <img data-sg-img="selection.items[1].image" data-sel-img="1" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0" src="{IMG1}" alt="">
        <img data-sg-img="selection.items[2].image" data-sel-img="2" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0" src="{IMG2}" alt="">
        <img data-sg-img="selection.items[3].image" data-sel-img="3" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0" src="{IMG3}" alt="">
      </div>
      <!-- Liste des catégories : l'active est en pleine opacité, les autres estompées -->
      <div>
        <span data-sg-path="selection.label" class="text-xs uppercase tracking-[0.2em] text-cream/60">Sélection</span>
        <ul class="mt-8 flex flex-col gap-6">
          <li data-sel-item="0" class="flex items-baseline gap-5 transition-all duration-500 opacity-100"><span class="text-sm text-cream/50">01</span><span data-sg-path="selection.items[0].title" class="font-serif text-4xl lg:text-6xl">Couples</span></li>
          <li data-sel-item="1" class="flex items-baseline gap-5 transition-all duration-500 opacity-30"><span class="text-sm text-cream/50">02</span><span data-sg-path="selection.items[1].title" class="font-serif text-4xl lg:text-6xl">Évasions</span></li>
          <li data-sel-item="2" class="flex items-baseline gap-5 transition-all duration-500 opacity-30"><span class="text-sm text-cream/50">03</span><span data-sg-path="selection.items[2].title" class="font-serif text-4xl lg:text-6xl">Mariages intimistes</span></li>
          <li data-sel-item="3" class="flex items-baseline gap-5 transition-all duration-500 opacity-30"><span class="text-sm text-cream/50">04</span><span data-sg-path="selection.items[3].title" class="font-serif text-4xl lg:text-6xl">Éditorial</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>
<script>
(function(){
  var sec=document.querySelector('.sel-pin'); if(!sec) return;
  var imgs=sec.querySelectorAll('[data-sel-img]'), items=sec.querySelectorAll('[data-sel-item]'), n=items.length, cur=-1;
  function update(){
    var top=sec.getBoundingClientRect().top, total=sec.offsetHeight-window.innerHeight;
    if(total<=0) return;
    var prog=Math.min(Math.max(-top/total,0),0.9999), idx=Math.floor(prog*n);
    if(idx===cur) return; cur=idx;
    imgs.forEach(function(im,i){ im.style.opacity=(i===idx)?'1':'0'; });
    items.forEach(function(it,i){ it.style.opacity=(i===idx)?'1':'0.3'; });
  }
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update); update();
})();
</script>
```

Principe : la section mesure `(N+1)×100vh` ; un conteneur `sticky top-0 h-screen`
reste fixé pendant tout ce défilement ; un script calcule la progression du
scroll dans la section et active l'item/l'image correspondants. Aucun
scroll-hijacking dur (accessible) : visuellement le contenu « reste en place » et
seules l'image et la catégorie changent à chaque cran.

## 5. Ton éditorial

Français sensible et littéraire, registre romantique fine-art. Titres en 1-2 mots
serif (« Soulful / Photography » → adapter au client). Sous-titres poétiques en
italique. Pas de jargon commercial ; on évoque l'émotion, l'authenticité, l'instant.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes (ton §5), les photos, le nombre de services/
images, les initiales + nom de marque, retirer une section sans matière (avis
absents → section « approche/philosophie » dans le même style serif, sans faux avis).

**VERROUILLÉ** : tokens (§2, crème + serif), structure du header (mix-blend +
hero centré serif), la serif géante, l'alternance crème/sombre, l'absence de
couleur vive.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image (chemins `hero.image`, `services.items[0].title`…) pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en crème + serif + sensibilité ; jamais un élément gras
ou coloré qui casserait le fine-art.
