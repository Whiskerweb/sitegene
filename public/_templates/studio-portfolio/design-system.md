# Design System — studio-portfolio (studio créatif, brutaliste minimal)

## 1. ADN

Site de **studio de design / direction artistique, brutaliste-minimal** : fond
**noir**, texte blanc, accent **bleu électrique** (#0000ee) et un bleu ciel
secondaire. Typographie **Inter** très grande et serrée (jusqu'à un **wordmark
de 236px**), micro-labels en capitales espacées, et une **horloge live** dans la
nav (« LOCAL / HH:MM:SS »). Grilles franches, filets nets, ton « agence ». À
l'opposé du SaaS (clair, dégradés, pilules) : ici **noir, brut, typographique,
mega-échelle**.

## 2. Tokens (verrouillés)

Police : **Inter** (variable). Tailles custom géantes.

```js
tailwind.config = { theme: { extend: {
  colors: {
    ink:'#000000', paper:'#ffffff', electric:'#0000ee', sky:'#0099ff',
    mute:'#999999', dim:'#666666', faint:'#bbbbbb', line:'#222222',
  },
  fontFamily: { sans:['Inter','sans-serif'] },
  fontSize: {
    mega: ['clamp(72px,17vw,236px)', { lineHeight:'0.82', letterSpacing:'-0.03em' }],
    huge: ['clamp(40px,7vw,80px)',   { lineHeight:'1.0',  letterSpacing:'-0.03em' }],
    big:  ['clamp(28px,4.4vw,49px)', { lineHeight:'1.08', letterSpacing:'-0.02em' }],
    price:['clamp(48px,6vw,79px)',   { lineHeight:'1.0',  letterSpacing:'-0.03em' }],
  },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Inter',sans-serif; background:#000; color:#fff; margin:0; }
```

## 3. HEADER — signature

### 3a. NAV — labels espacés + HORLOGE LIVE

`fixed top-0`, transparente. Marque minuscule en capitales très espacées, liens
minuscules, et une **horloge live** `tabular-nums` mise à jour chaque seconde.

```html
<nav class="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-6">
  <a href="#" data-sg-path="brand" class="text-[13px] font-bold tracking-[0.14em] uppercase">{MARQUE}</a>
  <ul class="hidden md:flex gap-8 list-none text-[13px] tracking-[0.04em]">
    <li><a href="#work" data-sg-path="nav[0]" class="hover:opacity-60 transition-opacity">Travaux</a></li>
    <li><a href="#about" data-sg-path="nav[1]" class="hover:opacity-60 transition-opacity">Studio</a></li>
    <li><a href="#contact" data-sg-path="nav[2]" class="hover:opacity-60 transition-opacity">Contact</a></li>
  </ul>
  <div class="text-[12px] tracking-[0.08em] tabular-nums opacity-70" id="nav-clock">LOCAL / 00:00:00</div>
</nav>
<script>
(function(){
  function tick(){ var n=new Date(), p=function(x){return String(x).padStart(2,'0')}, el=document.getElementById('nav-clock');
    if(el) el.textContent='LOCAL / '+p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds()); }
  tick(); setInterval(tick,1000);
})();
</script>
```

### 3b. HERO — phrase géante + grille de tags + wordmark mega

```html
<section class="relative px-6 md:px-10 pt-40 md:pt-44 pb-0">
  <!-- Titre-phrase, taille big -->
  <h1 data-sg-path="hero.headline" class="max-w-[680px] text-big font-medium text-white">{PHRASE — positionnement du studio}</h1>
  <!-- Grille de TAGS (services), bloc blanc sur noir -->
  <div class="mt-10 bg-white text-black grid grid-cols-1 md:grid-cols-3 max-w-[1000px]">
    <div data-sg-path="hero.tags[0]" class="px-2 py-2.5 text-[15px] font-medium border-b md:border-b-0 md:border-r border-black/10">{TAG1}</div>
    <div data-sg-path="hero.tags[1]" class="px-2 py-2.5 text-[15px] font-medium border-b md:border-b-0 md:border-r border-black/10 text-center">{TAG2}</div>
    <div data-sg-path="hero.tags[2]" class="px-2 py-2.5 text-[15px] font-medium">{TAG3}</div>
  </div>
  <!-- WORDMARK GÉANT (nom du studio), clamp jusqu'à 236px -->
  <div class="mt-16 md:mt-24">
    <span class="text-mega font-semibold tracking-[-0.04em] text-white whitespace-nowrap">
      <span data-sg-path="wordmark">{MARQUE}</span><span class="align-super text-[0.22em] font-medium">™</span>
    </span>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Horloge live** `LOCAL / HH:MM:SS` dans la nav (`tabular-nums`, JS chaque sec).
2. **Wordmark mega** du studio en bas du hero : `text-mega` (clamp jusqu'à 236px,
   `leading-[0.82]`), suivi d'un **™** en exposant.
3. Titre-phrase `text-big` (Inter, tracking négatif) max-w-[680px].
4. **Grille de tags** blanc-sur-noir (services), bordures `border-black/10`.
5. Palette **noir/blanc** + bleu électrique `#0000ee` rare ; échelle typographique
   brutale (mega/huge/big), filets `border-line`.

## 4. Sections du corps

Fond noir, sections `px-6 md:px-10 py-24 md:py-32`. WORK (grille de projets,
grandes vignettes + titres `huge`), STUDIO/À PROPOS (texte + infos), SERVICES,
CONTACT (gros titre `huge`, email géant). Beaucoup de filets `border-line`, labels
capitales espacées, numérotation. FOOTER noir minimal avec horloge/coordonnées,
« Propulsé par Akyra ».

## 5. Ton éditorial

Français d'agence créative : affirmé, conceptuel, concis. Le titre = un
positionnement (ce que fait le studio). Tags = disciplines (Direction artistique,
Branding, Stratégie…). Wordmark = le nom. Labels courts en capitales. Pas de
remplissage ; chaque mot compte.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, le nombre de projets/tags, le nom du studio
(titre + wordmark), retirer une section sans matière.

**VERROUILLÉ** : tokens (§2, noir/blanc + Inter + tailles mega), structure du
header (horloge live + wordmark mega + grille de tags), l'échelle typographique
brutale, le bleu électrique rare.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en noir/blanc + Inter + mega-échelle ; jamais une
couleur hors palette ou un style « doux ».
