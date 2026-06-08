# Design System — plumber-emergency (plombier urgence, bleu blueprint)

## 1. ADN

Plombier **urgence 24/7, réactif et rassurant** : hero **bleu** (#1B7BE9) avec un
**motif blueprint** (grille technique en filigrane), accent **jaune** (#FFE227)
pour le CTA d'appel, puis sections **claires**. Une **carte avis client** posée
sur la photo. Typo Montserrat bold. Ton intervention rapide, dépannage, confiance.
À l'opposé des plombiers « pro/modern » : ici **bleu blueprint + jaune, urgence,
appel direct**.

## 2. Tokens (verrouillés)

Polices : **Montserrat** (titres, 400–800) + **Inter** (corps).

```js
tailwind.config = { theme: { extend: {
  colors: { primary:'#1B7BE9', sky:'#03ADFF', accent:'#FFE227', ink:'#000000', bg:'#F6F7F9', muted:'#3B3B3B', border:'#E5E8EC', white:'#FFFFFF' },
  fontFamily: { sans:['Montserrat','sans-serif'], inter:['Inter','sans-serif'] },
  borderRadius: { xl2:'16px' },
}}};
```

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family:'Montserrat',sans-serif; background:#fff; color:#000; margin:0; }
.font-inter { font-family:'Inter',sans-serif; }
/* Motif blueprint : grille technique blanche en filigrane sur le bleu */
.blueprint { background-color:#1B7BE9; background-image:
  linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size:64px 64px; }
```

## 3. HEADER — signature

### 3a. NAV — blanche, CTA

```html
<nav class="bg-white sticky top-0 z-50 border-b border-border/70">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="flex items-center gap-2"><span data-sg-path="brand" class="text-ink font-bold text-xl tracking-tight">{MARQUE}</span></a>
    <div class="hidden md:flex items-center gap-8 text-sm text-muted">
      <a href="#services" data-sg-path="nav[0]" class="hover:text-ink transition-colors">Services</a>
      <a href="#about" data-sg-path="nav[1]" class="hover:text-ink transition-colors">À propos</a>
    </div>
    <a href="#contact" data-sg-path="nav.cta" class="bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition-all">{CTA_NAV}</a>
  </div>
</nav>
```

### 3b. HERO — bleu blueprint, CTA jaune (appel), carte avis sur la photo

```html
<section class="blueprint relative overflow-hidden px-6 pt-12 pb-20">
  <div class="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
    <div>
      <h1 data-sg-path="hero.title" class="text-white font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">{TITRE}</h1>
      <p data-sg-path="hero.tagline" class="text-white/80 text-lg mb-8 max-w-md font-inter">{ACCROCHE}</p>
      <a href="tel:" data-sg-path="hero.cta" class="inline-block bg-accent text-ink font-bold px-7 py-3.5 rounded-full hover:brightness-95 transition-all">{CTA — appeler + numéro}</a>
      <p data-sg-path="hero.availability" class="text-white/70 text-xs mt-4">{DISPONIBILITÉ — ex. 24/7}</p>
    </div>
    <!-- Photo + carte avis flottante -->
    <div class="relative rounded-xl2 overflow-hidden">
      <img data-sg-img="hero.image" src="{PHOTO}" alt="" class="w-full h-[420px] object-cover" />
      <div class="absolute bottom-6 left-6 bg-white rounded-xl2 shadow-xl px-5 py-3 flex items-center gap-3">
        <span class="text-accent">★★★★★</span>
        <div>
          <div data-sg-path="hero.customerName" class="font-bold text-ink text-sm">{NOM CLIENT}</div>
          <div data-sg-path="hero.customerRole" class="text-muted text-xs">{RÔLE/VILLE}</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3c. Signature à ne jamais perdre

1. **Hero bleu `#1B7BE9` avec motif blueprint** (grille technique blanche
   `.blueprint`, `background-size:64px`) — la signature « plan technique ».
2. **CTA jaune `#FFE227`** d'appel (pilule jaune texte noir) + mention de
   disponibilité 24/7.
3. **Carte avis client** (étoiles jaunes + nom + ville) posée sur la photo du hero.
4. Sections du corps **claires** (`bg` #F6F7F9). Typo Montserrat bold.

## 4. Sections du corps

Fond clair `bg`, cartes `rounded-xl2 border border-border`, `py-20`. Sections :
SERVICES (grille de dépannages avec icônes bleues), URGENCE (bandeau bleu/jaune),
POURQUOI NOUS, PROCESS, TÉMOIGNAGES (étoiles), ZONE, CONTACT (CTA jaune). FOOTER
bleu ou ink, « Propulsé par Akyra ».

## 5. Ton éditorial

Français urgent et rassurant, registre dépannage plomberie. Titre orienté
rapidité/urgence. CTA = appel direct avec numéro. Mentions 24/7, intervention
rapide, devis. Concret et fiable.

## 6. Règles d'adaptation & verrous

**TU PEUX adapter** : tous les textes, photos, nombre de services, le nom, retirer
une section sans matière.

**VERROUILLÉ** : tokens (§2, bleu + jaune + blueprint), structure du header (hero
blueprint + CTA jaune appel + carte avis), le motif blueprint, le corps clair.

**Édition (obligatoire)** : `data-sg-path` sur chaque texte, `data-sg-img` sur
chaque image, pour l'éditeur WYSIWYG.

**Hors-cadre** : intégrer en bleu + jaune + blueprint ; jamais une couleur hors palette.
