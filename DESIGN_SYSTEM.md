# Sitegene — Design System

> Source unique de vérité pour la landing Sitegene. Tout choix visuel/copie part d'ici.
> Stack confirmée : **Next.js 16 · React 19 · Tailwind v4 (`@import "tailwindcss"` + `@theme`) · framer-motion 12 · lucide-react**.
>
> Promesse produit : **« Votre site professionnel, déjà construit. En ligne en 30 secondes. »**
> Cible : photographes / créatifs indépendants, peu techniques. Le ton est premium, rapide, sûr de lui, légèrement éditorial — **jamais** une SaaS IA générique.

---

## 0. ADN en une phrase

**Une galerie de nuit.** Un fond presque noir, profond, qui fait ressortir les sites des photographes comme des tirages sous spot. Un seul accent électrique (indigo→violet) pour l'énergie « tech », une touche d'or chaud pour le côté éditorial/artisanal. De grands titres serrés en display, du corps net et sobre, et un rythme rapide : on révèle, on prouve, on rassure. Le mouvement est calme et décidé — pas d'effervescence, pas de néon partout.

C'est le **parent naturel** des 3 templates photographes : `alice-r` (sombre, chaud, brun→noir), `potozon` (clair, pop, accents rouge/jaune/violet), `target` (clair éditorial Geist, accent orange). Sitegene est le studio sombre qui les expose tous.

---

## 1. Positionnement, voix & ton

### 1.1 Positionnement
Sitegene n'est pas un « créateur de site IA ». C'est un **catalogue de sites déjà finis, premium, faits pour les photographes**, que l'on met en ligne instantanément. On ne vend pas un outil. On vend un **résultat livré**.

- Repositionnement clé : *« Pas un éditeur. Un site déjà prêt. »*
- Bénéfice émotionnel : la fierté d'avoir « enfin » un vrai site, sans la honte du template Wix bricolé.
- Preuve : 30 secondes, 50 €, des templates qu'on voit vivre à l'écran.

### 1.2 Voix & ton (hérité de `DesignSystem/DesignTolt.md` §8)
**On fait :**
- Phrases courtes, verbes directs : « Choisissez. On le met en ligne. »
- Chiffres concrets partout : « 30 secondes », « 50 € », « 3 templates ».
- « Vous » adulte, jamais condescendant. Contractions naturelles (« c'est », « on »).
- Staccato premium : « Un clic. Un site. En ligne. »
- Repositionnement : « Ce n'est pas un éditeur. C'est votre site, déjà fait. »

**On bannit :**
- Mots IA génériques : *unlock, leverage, empower, seamless, ecosystem, elevate, revolutionize, propulsé par l'IA* en headline.
- Promotional boursouflé, rule-of-three artificiel (« simple, rapide, efficace »).
- Abus d'em-dash, négations parallèles « not just X but Y ».
- Le mot « facile ». On dit « rapide » et « déjà fait » — c'est plus fort.

### 1.3 Copie prête à l'emploi

**Hero — headlines candidates (FR) :**
1. **« Votre site de photographe. <span class="accent">En ligne en 30 secondes.</span> »**
2. **« Arrêtez de construire. <span class="accent">Votre site est déjà prêt.</span> »**
3. **« Un clic. Et votre portfolio est en ligne. <span class="accent">Vraiment.</span> »**
   *(alternatives de réserve : « Le site que vous auriez dû avoir hier. » · « Choisissez un design. Le reste est déjà fait. »)*

**Sous-titres (sub) :**
- « Des sites pensés pour les photographes, déjà construits et déjà beaux. Vous choisissez, on publie. Pas de page blanche, pas de code. »
- « Trois designs premium. Votre nom, vos photos. En ligne avant la fin de votre café. »

**Labels de CTA :**
- Primaire : **« Mettre mon site en ligne »** · variantes : « Voir mes 30 secondes », « Choisir mon design ».
- Secondaire : **« Voir les templates »** · « Tester en live ».
- Micro-CTA pricing : « Lancer pour 50 € ».

**Phrases de section (réutilisables) :**
- How it works : « Trois étapes. La dernière, c'est juste regarder. »
- Pricing : « 50 € pour le lancer. Des crédits quand vous voulez le changer. »
- Footer : « Votre prochain client cherche un photographe ce soir. Soyez en ligne. »

---

## 2. Système de couleurs

Base **galerie de nuit** (presque noire, légèrement bleutée) + accent **indigo→violet électrique** (l'ADN « tech rapide », cousin du `#5E0ED7` de fearless-vision et du `#8d54ff` de traaaction) + accent secondaire **or chaud** (l'éditorial/artisanal, cousin de la chaleur d'alice-r). Neutres froids pour le texte.

### 2.1 Palette (HEX exacts)

| Rôle | Token | HEX | Usage |
|---|---|---|---|
| **Base / fond profond** | `ink-900` | `#08080C` | Fond global de la page |
| Fond surélevé (sections) | `ink-800` | `#0E0E14` | Bandes alternées, fonds de section |
| Surface carte | `ink-700` | `#16161F` | Cards, panneaux, navbar pleine |
| Surface carte +1 | `ink-600` | `#1F1F2B` | Hover de carte, inputs |
| Bordure / hairline | `line` | `rgba(255,255,255,0.08)` | Toutes les bordures fines |
| Bordure forte | `line-strong` | `rgba(255,255,255,0.16)` | Bordure de focus / carte active |
| **Accent primaire** | `violet-500` | `#6D4AFF` | CTA, liens, focus, highlight de titre |
| Accent primaire vif | `violet-400` | `#8B6BFF` | Hover, glow, dégradés |
| Accent primaire profond | `violet-600` | `#5226E0` | Bas de dégradé de bouton, ombres teintées |
| **Accent secondaire (or)** | `gold-400` | `#E8B468` | Détails éditoriaux : kickers, chiffres, soulignés manuscrits, badge prix |
| Or doux | `gold-300` | `#F2D2A0` | Texte sur fond doré, micro-accents |
| Live / OK | `mint-400` | `#3DE0A0` | Dot « en ligne », statut, check |
| **Texte principal** | `paper` | `#F5F6FA` | Titres, texte fort sur fond sombre |
| Texte secondaire | `muted` | `#A6A8B8` | Paragraphes, sous-titres |
| Texte faible | `faint` | `#6C6E80` | Légendes, labels, copyright |
| Blanc pur | `white` | `#FFFFFF` | Réservé aux pleins rares (logo mark) |

**Dégradés signature :**
- Bouton primaire : `linear-gradient(180deg, #8B6BFF 0%, #6D4AFF 55%, #5226E0 100%)`.
- Glow d'ambiance (derrière le hero) : `radial-gradient(50% 50% at 50% 0%, rgba(109,74,255,0.22), transparent 70%)`.
- Halo or éditorial (sous un chiffre/kicker) : `radial-gradient(40% 40% at 50% 50%, rgba(232,180,104,0.18), transparent 70%)`.
- Texte titre dégradé (option, comme skyelite) : `linear-gradient(180deg, #F5F6FA 0%, #A6A8B8 100%)` en `background-clip:text`.

### 2.2 Règles d'usage
- **90 % du temps : fond `ink-900`, texte `paper`/`muted`.** Le violet est rare et précieux : CTA, un mot de titre, un underline, un dot. Jamais un fond plein violet sur de grandes surfaces.
- **L'or ne touche jamais le violet de près** (sauf badge prix). Or = humain/éditorial ; violet = tech/action. On les sépare par section.
- Les sites templates exposés gardent **leurs propres couleurs** : on ne les teinte pas. Le fond sombre de Sitegene sert d'écrin neutre (comme une cimaise de galerie).
- Bordures toujours `rgba(255,255,255,0.08)` — jamais de gris plein qui « sale » le noir.
- Le vert mint **uniquement** pour le « live/en ligne » (dot pulsé). Pas de succès générique.

### 2.3 Tokens Tailwind v4 — à coller dans `app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* ---- Base sombre ---- */
  --color-ink-900: #08080c;
  --color-ink-800: #0e0e14;
  --color-ink-700: #16161f;
  --color-ink-600: #1f1f2b;

  /* ---- Accent primaire (violet électrique) ---- */
  --color-violet-400: #8b6bff;
  --color-violet-500: #6d4aff;
  --color-violet-600: #5226e0;

  /* ---- Accent secondaire (or éditorial) ---- */
  --color-gold-300: #f2d2a0;
  --color-gold-400: #e8b468;

  /* ---- Statut ---- */
  --color-mint-400: #3de0a0;

  /* ---- Texte ---- */
  --color-paper: #f5f6fa;
  --color-muted: #a6a8b8;
  --color-faint: #6c6e80;

  /* ---- Polices ---- */
  --font-display: "Clash Display", "Geist", sans-serif; /* via next/font ou @fontsource */
  --font-sans: "Geist", "Inter", sans-serif;
  --font-hand: "Caveat", cursive; /* accents manuscrits, comme kresna-footer */

  /* ---- Rayons ---- */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  /* ---- Easing signature ---- */
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
}

:root {
  --background: var(--color-ink-900);
  --foreground: var(--color-paper);
  /* hairlines réutilisables */
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.16);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Mot accentué dans un titre */
.accent { color: var(--color-violet-400); }
.accent-gold { color: var(--color-gold-400); }
```

---

## 3. Typographie

Pairing **éditorial-premium** aligné sur l'inspiration (traaaction = Geist serré, marquee-hero = Outfit display + Inter, target = Geist+Inter).

- **Display / titres : `Clash Display`** (Fontshare, gratuit) — grotesque géométrique à fort caractère, lettres serrées, très « studio créatif ». C'est le signal « éditorial » qui démarque d'une SaaS générique.
  *Fallback / option 100 % Google Fonts si Clash indisponible : **`Outfit`** (déjà éprouvé dans marquee-hero) ou **`Space Grotesk`**.*
- **Corps & UI : `Geist`** (déjà le défaut du scaffold sitegene, et la police de traaaction) — neutre, net, moderne. `Inter` en fallback.
- **Accent manuscrit : `Caveat`** (Google) — uniquement pour micro-annotations « humaines » (ex. flèche + « 30 sec ⏱ » à la main près du CTA), repris du `kresna-footer`. À doser : 1 à 2 occurrences max sur toute la page.

Chargement : `Geist` via `next/font/google` (déjà en place dans `layout.tsx`), `Clash Display` via `@fontsource-variable/clash-display` ou `<link>` Fontshare ; `Caveat` via `next/font/google`.

### 3.1 Échelle de type

| Élément | Police | Taille (desktop / mobile) | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| Display hero | Clash Display | `72px` / `40px` | 600 | `-0.03em` | `1.02` |
| H2 section | Clash Display | `48px` / `30px` | 600 | `-0.02em` | `1.06` |
| H3 / titre carte | Clash Display | `24px` / `20px` | 500 | `-0.01em` | `1.15` |
| Kicker / eyebrow | Geist | `12px` | 600 | `0.18em` UPPERCASE | `1` |
| Lead / sous-titre | Geist | `18px` / `16px` | 400 | `0` | `1.55` |
| Body | Geist | `16px` | 400 | `0` | `1.6` |
| Small / légende | Geist | `13px` | 500 | `0` | `1.5` |
| Bouton | Geist | `15px` | 600 | `0` | `1` |
| Annotation main | Caveat | `20px` | 600 | `0.02em` | `1.1` |
| Chiffre stat | Clash Display | `56px` / `40px` | 600 | `-0.02em` | `1` |

Règles : titres toujours en `text-balance`, paragraphes en `text-pretty` et `max-w-[60ch]` (lead `max-w-[34rem]`). Les kickers sont en or (`gold-400`) ou en violet selon la section, jamais les deux.

---

## 4. Langage de mouvement

Hérité des sites factory. Deux courbes seulement :
- **`--ease-out-soft` = `cubic-bezier(0.22, 1, 0.36, 1)`** (= `[0.22, 1, 0.36, 1]` en framer-motion) → toutes les entrées, hovers, reveals. C'est l'easing maison (fearless-vision `variants.ts`, arelec `--ease`).
- **`--ease-pop` = `cubic-bezier(0.34, 1.56, 0.64, 1)`** → uniquement les « pop » récompensants (badge prix, check « en ligne », apparition d'un crédit). Repris de `DesignTolt.md` (coinPop / chart-bar).

Principe : **le mouvement raconte la vitesse du produit**. Tout est rapide et net (0.5–0.7 s), rien ne traîne. Respect strict de `prefers-reduced-motion` (les templates le font déjà).

### 4.1 Patterns framer-motion (à réutiliser tels quels)

```ts
// lib/motion.ts
import type { Variants } from "framer-motion";
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_POP = [0.34, 1.56, 0.64, 1] as const;

// Entrée standard au scroll (FadeIn maison, cf. jack-3d-creator)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: EASE },
  }),
};

// Reveal de titre mot par mot (clip depuis y:110% dans un parent overflow-hidden)
export const headingWord: Variants = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: 0, transition: { delay: 0.1 + i * 0.14, duration: 0.7, ease: EASE },
  }),
};

// Pop récompensant (badge "en ligne", prix)
export const pop: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: EASE_POP } },
};
```

Usage scroll : `whileInView` + `viewport={{ once: true, margin: "-80px" }}`, `staggerChildren: 0.12`.

### 4.2 Animations signature
1. **Title clip-reveal** : titres hero/section montent mot à mot depuis `y:110%` (parent `overflow-hidden`), stagger 0.14 s. La signature visuelle de la marque.
2. **Marquee de logos** : CSS pur, `translateX(0 → -50%)`, liste doublée, `30s linear infinite`, pause au survol, masque `linear-gradient(to right, transparent, black 8%, black 92%, transparent)`. (Repris de `marquee-hero` + `alice-r`.)
3. **Marquee de templates en parallaxe** (option premium) : deux rangées qui glissent en sens inverse au scroll, `translateX = scrollProgress * 0.3` (repris de `jack-3d-creator/MarqueeSection`).
4. **Hover carte** : `-translate-y-1`, ombre teintée violet qui apparaît, bordure `line → line-strong`, 0.3 s `ease-out-soft`. Sur les vignettes de templates : léger `scale-105` de l'aperçu + glow violet révélé (cf. `Marquee.tsx` du marquee-hero).
5. **Dot « en ligne »** : `pulse-soft` 2 s + un `pulse-ring` mint au moment du reveal de la 3ᵉ étape (« en ligne »).
6. **CTA hover** : `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.97 }}` + glow violet qui s'intensifie.
7. **Compteur 30 s** : petit timer/odomètre qui descend 30→00 dans le hero ou la section how-it-works, easing linéaire, pour matérialiser la promesse.

---

## 5. Système de layout

### 5.1 Container & grille
- Container principal : `max-w-[1240px]` centré, padding latéral `px-6` mobile / `px-10` desktop.
- Hero & showcase peuvent aller `max-w-[1400px]` (comme marquee-hero) pour la respiration.
- Grille de base : 12 colonnes, `gap-6` (24px). Templates showcase : 3 colonnes desktop / 1 colonne mobile, `gap-6`.

### 5.2 Échelle d'espacement (4-pt, multiples utiles)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`
- Padding interne carte : `24px` (mobile) → `32px` (desktop).
- **Rythme de section : `py-24` (96px) desktop, `py-16` (64px) mobile.** Les sections respirent — c'est premium.
- Espace titre→contenu : `48px`. Kicker→titre : `16px`.

### 5.3 Rayons
- Boutons & pills : `999px`.
- Cartes / panneaux : `24px` (`--radius-lg`).
- Vignettes de templates / grandes surfaces : `32px` (`--radius-xl`), comme le hero de marquee-hero (`rounded-[48px]` pour les très grands blocs).
- Inputs : `12px`.

### 5.4 Ombres & glass
- **Ombre teintée** (cartes au hover, CTA) : `0 18px 50px -12px rgba(82, 38, 224, 0.45)` (violet) — donne la profondeur « studio sous spot ».
- Ombre neutre douce (cartes au repos sur fond clair de section) : `0 12px 40px rgba(0,0,0,0.4)`.
- **Glass (navbar flottante, badges, footer)** — technique `liquid-glass` validée :
  ```css
  .glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
  ```
  Pour la **bordure dégradée premium** (footer immersif), reprendre le `.liquid-glass::before` masqué (`mask-composite: exclude`) de `elements/liquid-glass-footer/src/index.css`.
- **Grain** : overlay bruit SVG `opacity:0.10–0.14`, `mix-blend-mode: overlay` sur le fond global (repris d'`alice-r`). Subtil — il enlève le côté « digital plat » et donne la texture d'un tirage.

---

## 6. Inventaire des composants (landing)

Ordre de page recommandé : **Navbar → Hero → Social proof marquee → How it works (3 étapes) → Template showcase → Pricing teaser → FAQ → Footer premium.**

### 6.1 Navbar
- **Pill flottante en haut**, centrée, `glass` (cf. marquee-hero navbar) : logo mark Sitegene à gauche, 2-3 liens au centre (`Templates`, `Tarif`, `FAQ`), CTA pill violet à droite (« Mettre en ligne »).
- Sticky avec apparition au scroll (`fadeDown`, delay stagger). Sur fond sombre : texte `muted` → `paper` au hover.
- Mobile : burger → drawer plein écran sombre avec glow violet en coin (pattern `mdrawer` d'arelec).

### 6.2 Hero
- Fond `ink-900` + **glow radial violet** en haut + grain. Optionnel : vidéo/loop d'un site qui « s'allume » en arrière-plan, masquée par un voile sombre (technique vidéo de marquee-hero / liquid-glass).
- Kicker or : « Sites pour photographes ». 
- **Titre en clip-reveal** (un mot accentué violet), `max-w-[16ch]`, Clash Display 72px.
- Sub `muted` 18px, `max-w-[34rem]`.
- Duo de CTA : primaire violet (« Mettre mon site en ligne ») + secondaire `glass` (« Voir les templates »).
- Annotation **Caveat** + flèche dessinée près du CTA : « en 30 secondes ⏱ » (clin d'œil kresna-footer « Feeling lucky? »).
- Sous le hero : mini-rangée de preuve (dot mint « 124 sites en ligne ce mois », ou 3 avatars + « ils ont publié hier »).
- Intent visuel : **page de couverture de magazine**, pas dashboard SaaS.

### 6.3 Social proof — marquee
- Bande de logos/typos (marques que les photographes connaissent : reprendre l'esprit `VOGUE · LEICA · CANON · KINFOLK · AESOP`… déjà dans les templates) en marquee CSS, masqué sur les bords, pause au survol.
- Au-dessus : ligne discrète `faint` : « La qualité de site que ces marques attendent — pour vous, en 30 secondes. »

### 6.4 How it works — 3 étapes : **clic → reveal → en ligne**
- 3 cartes (ou 3 panneaux en bande) `ink-700`, bordure `line`, chiffre or géant `01/02/03`.
  1. **Clic** — « Choisissez un design. » Visuel : curseur qui sélectionne un template.
  2. **Reveal** — « On l'habille de vos infos. » Visuel : le template se « remplit » (placeholder → vraies photos), titre en clip-reveal.
  3. **En ligne** — « C'est publié. » Visuel : dot mint pulsé + badge `pop` « Live » + mini-URL `vous.sitegene.com`.
- Compteur 30 s qui tourne le long de la bande. Stagger d'entrée 0.12 s, `fadeUp`.
- Phrase de section : « Trois étapes. La dernière, c'est juste regarder. »

### 6.5 Template showcase (les 3 sites photographes)
- **Le cœur émotionnel de la page.** 3 grandes vignettes `rounded-[32px]`, fond sombre = cimaise de galerie.
  - `alice-r` — « Sombre & chaud », mood élégant nuit.
  - `potozon` — « Pop & coloré », énergique.
  - `target` — « Éditorial & net », minimal.
- Chaque vignette : aperçu live (iframe/screenshot animé), nom du style, 2-3 tags, bouton « Voir en live ». Hover : `-translate-y-1`, glow violet, léger `scale-105` de l'aperçu (cf. `Marquee.tsx`). Les couleurs propres de chaque template sont préservées (pas de teinte violette dessus).
- Option premium : **parallaxe deux rangées** (jack-3d-creator) si plus de 3 visuels.

### 6.6 Pricing teaser (50 € + crédits)
- Une seule carte mise en avant, `ink-700`, bordure `line-strong`, **badge prix doré** flottant en haut-droite (technique « lucky-cube » du kresna-footer, mais en or : `pop` à l'apparition).
- Prix `50€` en Clash Display 56px ; sous-ligne « pour lancer votre site, une fois ».
- Bloc « crédits » : « Envie de changer de design plus tard ? Des crédits, à la carte. » avec 3 puces (check mint).
- CTA « Lancer pour 50 € ». Pas de tableau 3 colonnes façon SaaS — **une offre, claire**.
- Glow violet doux derrière la carte.

### 6.7 FAQ
- Accordéon natif `<details>` (pattern arelec `.faq-q`), cartes `ink-700`, bordure `line`, icône `+` qui tourne 45° → violet à l'ouverture.
- 5 questions, ton direct : « C'est vraiment 30 secondes ? », « Je peux mettre mon nom de domaine ? », « Et mes photos ? », « Je peux changer de design après ? », « C'est quoi les crédits ? ».
- Titre : « Vos questions, nos réponses. » (formule arelec, déjà éprouvée).

### 6.8 Footer premium
- Reprendre la **composition kresna-footer** adaptée au sombre : grille deux cartes.
  - Carte gauche `ink-700` (ou fond vidéo voilé) : logo Sitegene + tagline + « Restez en contact ! » (Caveat) + icônes sociales (carrés `ink-900`, hover lift).
  - Carte droite : colonnes Navigation / Légal + bloc d'abonnement (input + bouton sombre).
  - **Badge flottant doré** (« On vous met en ligne ? » au lieu de « Feeling lucky? »).
- **Watermark géant `Sitegene`** en bas, `fill: rgba(255,255,255,0.04)`, Clash Display, ajusté au pixel via `getBBox()` (script kresna-footer) — flush aux bords.
- Bordure dégradée `liquid-glass::before` possible sur la carte gauche pour la finition.
- Ligne légale `faint` : « © 2026 Sitegene. Votre site, déjà construit. »

---

## 7. Checklist « anti-générique »

À vérifier avant de livrer. Si un point casse, on n'est plus premium.

- [ ] **Pas de dégradé violet→rose plein écran** ni de « blob » coloré flou par défaut. Le violet reste rare et net.
- [ ] **Pas le fond `#0a0a0a` pur** du scaffold Next : utiliser `#08080C` (légèrement bleuté) + grain. Le noir mat plat = signal « template ».
- [ ] **Aucune icône lucide générique en grille 3×** (la classique « features grid » SaaS avec 6 picto identiques). On montre des **vrais sites**, pas des picto.
- [ ] **Headlines Inter/Geist semibold standard interdites en hero** : le hero passe en Clash Display serré (`-0.03em`). C'est non négociable pour l'effet éditorial.
- [ ] **Pas de tableau de pricing 3 colonnes** « Starter / Pro / Enterprise ». Une offre, un prix, des crédits.
- [ ] **Pas de mention « propulsé par l'IA » / « AI-powered »** en headline. Sitegene vend un résultat livré, pas une techno.
- [ ] **Pas de bordures gris plein** (`#333`) : toujours `rgba(255,255,255,0.08)`.
- [ ] **Pas d'ombre noire dure** par défaut : ombres teintées violet ou douces seulement.
- [ ] **Coins arrondis généreux** partout (≥ 24px sur les cartes, 32px sur les grands blocs) — le `rounded-lg` 8px par défaut fait « bootstrap ».
- [ ] **Mouvement sobre** : pas 15 animations qui rebondissent. Le `pop` (cubic 1.56) **uniquement** sur badge prix et « en ligne ».
- [ ] **Au moins une touche manuscrite** (Caveat) et **une touche or** sur la page — c'est ce qui sépare l'éditorial du SaaS froid. Mais 1 à 2 occurrences chacune, pas plus.
- [ ] **Espacement large** (`py-24`) entre sections. Le serré = cheap.
- [ ] **Respect de `prefers-reduced-motion`** sur marquee, parallaxe et reveals.
- [ ] **`text-balance` sur tous les titres**, `max-w` sur tous les paragraphes — jamais de ligne qui traverse tout l'écran.

---

*Fin du design system. Tout ce qui suit (build de la landing) doit pouvoir se justifier par un point ci-dessus.*
