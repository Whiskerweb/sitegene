# Playbook — Extraire des sections des sites templates vers la fonderie

> **Destinataire : l'IA qui prend le relai de l'extraction.**
> Ce document explique comment transformer les sections des sites templates
> (`Sitegenerator/sites/…`, repo parent) en composants du catalogue de la
> fonderie Akyra, la logique suivie, les pièges connus, et — le plus
> important — comment les DÉFINIR pour que Mistral (l'agenceur) choisisse les
> bonnes pièces pour le bon client. Le lot pilote `artisans-a` (14 pièces,
> Plumber Pro / Modern / Emergency) est la référence : copie sa structure.

---

## 1. Le modèle mental (à intégrer avant de toucher au code)

La fonderie assemble des sites comme des LEGO :

- Un **site** = une *recette* : `{ vibe, brand, sections: [{ component, content }] }`.
- Un **composant** = une section React **sans aucune personnalité propre** :
  toute la DA (couleurs, typos, rayons) vient de **CSS variables** posées par
  la vibe choisie. Le markup donne la *structure*, les tokens donnent le *style*.
- **Mistral est un AGENCEUR, jamais un créateur** : il pioche dans un catalogue
  fermé, ordonne les sections et rédige les textes. Il ne produit ni HTML ni
  composant. Le catalogue qu'on lui montre est généré mot pour mot depuis les
  manifests (`catalogForPrompt()` dans `lib/foundry/agenceur.ts`) : **écrire un
  manifest, c'est écrire le prompt**.
- Toute sortie IA passe par `normalizeSectionContent()` qui recale le contenu
  sur la **forme du sample** : le sample est un contrat de types, pas une déco.

Extraire une section, c'est donc produire **4 artefacts cohérents** :
le composant React, son manifest, son sample, et le câblage registre.

---

## 2. Architecture cible — où va chaque chose

```
sitegene/
├── components/foundry/
│   ├── components/<PascalCase>.tsx        ← le composant React (1 fichier / pièce)
│   ├── library/<lot>.tsx                  ← map id → composant du lot
│   ├── library/index.ts                   ← agrégateur composants (câblé À LA MAIN)
│   ├── registry.tsx                       ← registre global + garde de parité dev
│   ├── primitives.tsx                     ← Eyebrow, etc. (réutiliser)
│   ├── fx.tsx                             ← Reveal (IntersectionObserver) + useParallax (rAF)
│   ├── SmartNav.tsx                       ← wrapper navbar (masque/révèle au scroll)
│   └── Assembler.tsx                      ← rend une recette ; enrobe le rôle navbar dans SmartNav
├── lib/foundry/
│   ├── library/<lot>.ts                   ← manifests + samples du lot (PAS de JSX ici)
│   ├── library/index.ts                   ← agrégateur manifests/samples (câblé À LA MAIN)
│   ├── manifests.ts                       ← socle CORE + spread LIBRARY_MANIFESTS
│   ├── samples.ts                         ← samples CORE + spread LIBRARY_SAMPLES
│   ├── roles.ts                           ← ROLE_LABEL + ROLE_ORDER (libellés FR éditeur)
│   ├── fields.ts                          ← libellés FR des clés de contenu (panneau Contenu)
│   └── agenceur.ts                        ← prompt, normalisation, réparation, fallback
└── public/_templates/<site>/…             ← banque d'images du site source (copiée du repo parent)
```

**Un lot = un module.** Pour un nouveau lot (ex. `photographers-a`) :
1. `lib/foundry/library/photographers-a.ts` exporte `manifests` + `samples` ;
2. `components/foundry/library/photographers-a.tsx` exporte `COMPONENTS_…` ;
3. on ajoute le module dans les deux `index.ts` **à la main** (les agents
   d'extraction ne touchent pas aux index — ça évite les conflits en parallèle) ;
4. les images du site source vont dans `public/_templates/<site>/`.

En dev, `registry.tsx` loggue un warning si la parité manifest ↔ composant est
rompue : chaque manifest doit avoir son composant et inversement.

---

## 3. La logique d'extraction suivie (et pourquoi)

### 3.1 Quoi extraire d'un site source

Les sites sources sont des apps Vite/React sous `Sitegenerator/sites/<catégorie>/<site>/src/`.
On n'extrait **pas tout** : on extrait ce qui a un **parti pris visuel
identifiable** (un hero à carte client flottante, une topbar d'urgence, des
avis en post-it…). Une section banale qui existe déjà dans le socle
(`intro-split`, `faq-accordion`…) n'apporte rien : la valeur du catalogue,
c'est la **diversité des squelettes**, pas le volume.

Règle de tri : *« est-ce qu'un client reconnaîtrait cette section entre
mille ? »* Si non, ne pas extraire.

### 3.2 Attribuer un RÔLE — décision la plus structurante

Chaque pièce a un `role` (voir `lib/foundry/roles.ts` : navbar, hero, logos,
about, services, process, stats, highlights, reviews, gallery, media, team,
story, statement, pricing, faq, contact, cta, decor, footer). Conséquences :

- **Un seul composant par rôle et par page** (`repairRecipe` déduplique).
  Mal choisir le rôle limite les combinaisons : un bandeau photo classé
  `gallery` empêcherait d'avoir une vraie galerie sur la même page → on a créé
  `media` pour ça.
- Le rôle pilote la position dans l'éditeur (`ROLE_ORDER`), le libellé FR du
  catalogue, et les règles de l'agenceur (hero interdit en sous-page,
  navbar/footer hérités de l'accueil).
- **Créer un nouveau rôle est permis** mais demande : entrée dans `ROLE_LABEL`
  + `ROLE_ORDER` (roles.ts), et libellés de clés dans `fields.ts`. C'est comme
  ça qu'on a ajouté `media`, `team`, `story`, `highlights`.

### 3.3 Nommage

- id kebab-case préfixé par le site source : `plumber-pro-hero`,
  `luxury-wedding-gallery` ; fichier React en PascalCase homonyme.
- Les portages d'effets (ex-marketplace) sont préfixés `fx-` : ce sont des
  sections comme les autres, simplement plus spectaculaires (rareté ↑).

### 3.4 Externaliser le contenu

Tout texte/image en dur dans la source devient une clé de `content`. Le
composant reçoit `{ content, skin }` et ne contient **aucune chaîne en dur**
(hors décor pur : un « ✓ », un guillemet ornemental…). La liste des clés va
dans `contentKeys` du manifest ET dans le sample (voir §5.3 : le sample est le
contrat de forme).

---

## 4. Méthode concrète, pas-à-pas

1. **Lire le site source en entier** (`src/App.tsx`, composants, CSS). Repérer
   les sections candidates, noter leurs dépendances (GSAP ? images ? fonts ?).
2. **Copier les images** utiles dans `sitegene/public/_templates/<site>/` (les
   chemins du sample pointeront dessus).
3. **Porter le composant** dans `components/foundry/components/<Nom>.tsx` :
   - réécrire en Tailwind + style inline sur les tokens (§5.1) ;
   - typer l'interface du content en tête de fichier ;
   - `"use client"` UNIQUEMENT si hooks/interactivité (beaucoup de sections
     sont rendues serveur) ;
   - réutiliser `Eyebrow` (primitives.tsx), `Reveal` et `useParallax` (fx.tsx)
     au lieu de réinventer les entrées au scroll ;
   - commentaire d'en-tête : provenance + description visuelle (convention des
     fichiers existants).
4. **Écrire manifest + sample** dans `lib/foundry/library/<lot>.ts` (modèle :
   `artisans-a.ts`, avec son helper `M()` qui pose `vibes: VIBE_IDS` et
   `allowedSkinKeys`).
5. **Câbler** : map du lot dans `components/foundry/library/<lot>.tsx`, puis
   ajout du module dans les deux `index.ts`.
6. **Vérifier** avec la checklist du §7. La route `/foundry-preview/<id>` rend
   chaque pièce seule avec son sample (vibe warm-serif) — c'est le banc d'essai.

---

## 5. Les pièges — chaque point ci-dessous a déjà mordu

### 5.1 L'adaptation à la DA : tokens, jamais de valeurs en dur

Les composants doivent être beaux dans **les 6 vibes** (`lib/foundry/vibes.ts`)
ET avec un accent personnalisé quelconque (le client choisit un hex libre).
Tokens disponibles :

| Token | Usage |
|---|---|
| `--c-ink` | texte fort, panneaux sombres |
| `--c-surface` | fond de page (toujours CLAIR, garanti par les vibes) |
| `--c-card` | fond de section/carte alternatif |
| `--c-accent` | couleur de marque (⚠️ surchargée par le client) |
| `--c-accent2` | accent secondaire |
| `--c-muted` | texte secondaire |
| `--font-heading` / `--font-body` | paire typographique |
| `--r-card` / `--r-xl` / `--r-pill` | rayons (de 6px éditorial à 24px chaleureux) |

Règles dures :
- **Jamais** de couleur, font-family ou border-radius en dur pour ce qui est
  « de la marque ». Les teintes dérivées se font en
  `color-mix(in srgb, var(--c-ink) 64%, transparent)` — pattern omniprésent.
- Exceptions ASSUMÉES (à commenter dans le code) : le blanc cassé sur photo
  voilée (`#fbf9f5` sur panneau encre), et les couleurs « matérielles » — le
  cadre d'écran `#222` de `fx-container-scroll` est un objet, pas un thème.
- `--c-accent` peut devenir N'IMPORTE QUELLE couleur : ne jamais poser du
  texte accent sur fond accent, ni supposer qu'il est foncé/clair. Pour du
  texte sur accent, utiliser blanc/encre selon le contraste prévu par les
  composants existants (regarder `PricingCards` : bouton accent → texte `#fff`).
- Les radius varient de 6 à 32px selon la vibe : tester qu'un `--r-card` carré
  (éditorial) ne casse pas le design pensé tout-en-rondeurs.

### 5.2 Le scroll : le canvas de L'Atelier n'est PAS la fenêtre

Dans l'éditeur, le site défile dans une **div interne**, pas dans `window`.
L'événement `scroll` ne bouillonne pas → tout listener doit être posé en
**capture** :

```ts
window.addEventListener("scroll", onScroll, { passive: true, capture: true });
// cleanup : removeEventListener(..., { capture: true })
```

Compléments obligatoires : throttle via `requestAnimationFrame`,
`prefers-reduced-motion` (figer l'état final, cf. `FxContainerScroll`),
cleanup complet. `Reveal` (IntersectionObserver) et `useParallax` encapsulent
déjà tout ça — s'en servir. GSAP des sites sources : **ne pas l'importer**,
re-implémenter en CSS/rAF léger.

Pour les navbars : **ne pas implémenter de position fixed/sticky maison**.
L'`Assembler` enrobe automatiquement le rôle `navbar` dans `SmartNav`
(masquée en descente, révélée en remontée). Une navbar extraite est un bloc
statique ; SmartNav s'occupe du comportement.

### 5.3 Le sample est un CONTRAT, pas une démo

`normalizeSectionContent(id, raw)` recale chaque clé de la sortie IA sur le
**type de la valeur du sample**. Conséquences :

- Chaque `contentKey` du manifest DOIT exister dans le sample, avec le bon
  type. Clé absente du sample = silencieusement écrasée.
- Pour les listes d'objets, la forme de référence est l'**union des clés de
  tous les items** du sample ; un item IA est complété par l'item sample de
  même index (modulo). Mettre dans le sample des items représentatifs.
- Bornes appliquées : textes ≤ 600 caractères, listes ≤ 12 items, liens ≤ 8.
- **Le texte des samples FUIT en production** : le fallback déterministe
  (`fallbackRecipe`, `fallbackSubPageSections`) publie les samples quasi tels
  quels quand Mistral est indisponible. Écrire des samples **français,
  soignés, et aussi neutres que possible** (« Nos derniers projets en
  images ») sauf pour les pièces volontairement métier (lot plombiers) — et
  dans ce cas accepter que le fallback parle plomberie.
- Le sample sert aussi d'exemple de TON à Mistral (il est dans le prompt) :
  un sample médiocre = des textes générés médiocres.

### 5.4 Nommer les clés de contenu : les regex font la loi

Trois mécanismes lisent les NOMS de clés ; les nommer hors convention casse
des features invisibles :

- **Images** — `IMAGE_KEY = /image|avatar|photo|logo$/i` : toute clé qui
  matche est verrouillée côté agenceur (l'IA n'invente jamais d'URL, la valeur
  du sample est recopiée) et acceptée côté éditeur (upload client). Une image
  nommée `visual` ou `cover` passerait À TRAVERS cette protection → toujours
  `image`, `image2`, `avatar`, `photo`…
- **Report sémantique** — `adaptContent()` (remplacement de section + try-on)
  transvase le contenu du client d'une pièce à l'autre **par rôle de champ** :
  `title|titleA/B/C|heading` (titres), `eyebrow|badge|label|kicker`,
  `subtitle|tagline|desc|body|text|intro|bio`, `cta|button`. Utiliser ces noms
  pour que le titre du client survive au remplacement. Une clé exotique
  (`punchline`) retomberait sur le sample → le client perd son texte en
  essayant une autre pièce.
- **Libellés éditeur** — chaque clé nouvelle doit avoir son libellé FR dans
  `lib/foundry/fields.ts`, sinon le panneau Contenu affiche le nom brut.
- Cas spécial `links` (navbars) : mélange accepté `string | {label, target}`
  (les `{target}` sont des liens vers les pages du site, posés par
  `addNavLink`). Ne pas renommer cette clé, ne pas changer sa forme : un cas
  dédié de `normalizeValue` la préserve (undo compris) et l'éditeur lui dédie
  `NavLinksField`.

### 5.5 Divers qui coûtent cher

- `lib/**` doit rester **sans JSX** (vitest ne compile que `lib/**/*.test.ts`).
  Manifests/samples en `.ts`, composants en `.tsx` côté `components/`.
- Next 16 / React 19 : lire `node_modules/next/dist/docs/` au moindre doute ;
  `<link precedence="default">` pour les fonts hoistées.
- Pas de `Math.random()`/`Date.now()` dans le rendu (hydratation) : les
  variations pseudo-aléatoires se font sur l'index (cf. `FxFloatingTags`).
- `repairRecipe` injecte hero en tête et footer en queue s'ils manquent, et
  écarte les ids inconnus : une typo d'id dans un plan de fallback ne crashe
  pas, elle DISPARAÎT silencieusement — vérifier visuellement.
- Les sous-pages interdisent hero/navbar/footer (`repairSubPageSections`) :
  une pièce de ces rôles n'apparaîtra jamais en sous-page, c'est voulu.

---

## 6. Définir les pièces pour MISTRAL — le cœur du sujet

Le prompt de l'agenceur contient, pour CHAQUE pièce : `id`, `rôle`, `rareté`,
`description`, `quand l'utiliser`, et le sample JSON. C'est tout ce que
Mistral sait d'elle. Il choisit en croisant le **pitch du client** (métier,
ton, ville) et la **DA choisie** avec ces champs. D'où les règles :

### 6.1 `description` — l'œil de Mistral

Décrire ce qu'on VOIT, en français, concret et visuel : la composition
(« 2 colonnes », « grille de cartes », « bandeau pleine largeur ») + le ou les
détails signatures (« carte client flottante », « pin coloré qui dépasse »,
« citation révélée mot à mot »). Préfixer les pièces de lot par leur site
source : `"(Plumber Pro) Hero plein écran sur panneau encre : …"` — ça aide
Mistral à composer des pages cohérentes (pièces de la même famille) et nous à
tracer la provenance.

Mauvais : « Section témoignages moderne et élégante. » (rien d'identifiable)
Bon : « Avis clients en marquee de “notes épinglées” : cartes blanches
légèrement inclinées avec un pin coloré qui dépasse, sur un fond pinboard. »

### 6.2 `whenToUse` — les critères de sélection

2 à 3 entrées, formulées comme des **situations client**, jamais comme des
caractéristiques techniques. Les axes qui marchent :

- le métier ou la famille de métiers : `"métier d'intervention (plombier,
  électricien…)"`, `"coach / bien-être / marque humaine"` ;
- une condition de contenu : `"au moins 6 avis courts"`, `"3 avis clients
  forts avec PORTRAITS"` (les majuscules sont lues !) ;
- le ton/registre : `"site au ton joueur/créatif"`, `"bloc avis spectaculaire
  et premium"` ;
- la fonction dans la page : `"respiration design sombre entre deux sections
  claires"`, `"moment wow au milieu de la page"`, `"bloc très haut : il lui
  faut de la piste de défilement"` (contrainte de mise en page que Mistral
  respecte).

⚠️ **Leçon apprise** : une pièce décrite trop largement est sur-utilisée.
`quote-spotlight` (« respiration typographique forte ») est aujourd'hui choisi
par Mistral sur presque toutes les sous-pages. Si une pièce doit rester
occasionnelle, l'écrire DANS sa définition (« à n'utiliser qu'une fois », « si
le sujet s'y prête vraiment ») ou resserrer ses critères.

L'adaptation au THÈME du client passe entièrement par là : Mistral reçoit
« MÉTIER DÉTECTÉ : artisan » et « DIRECTION ARTISTIQUE : Corail pop
(énergique, créatif, solaire) » — il rapproche ces mots de vos `whenToUse`.
Mettre dans `whenToUse` les mots que les briefs réels contiennent (métiers,
« urgence », « portfolio », « haut de gamme »…).

### 6.3 `rarity` — économie ET fréquence

`common` (gratuit), `rare`, `epic` (payants, ✦). La rareté est annoncée à
Mistral dans le catalogue ; c'est aussi un signal de dosage : une page
équilibrée mélange un socle common et 1–3 pièces rare/epic. Barème pratique :
- `common` : la version « propre » d'un pattern standard ;
- `rare` : un vrai parti pris visuel ou une interaction notable ;
- `epic` : le spectaculaire (3D, scroll scené) — réservé aux moments wow.

### 6.4 Brancher l'agenceur (sinon la pièce reste orpheline)

Une pièce non référencée par les plans déterministes n'apparaît QUE si
Mistral la choisit. Selon le rôle, penser à :
- `FALLBACK_PLANS` (agenceur.ts) : plans d'accueil par métier ;
- `SUBPAGE_INTENTS` (agenceur.ts) : plans de sous-pages par intention —
  ⚠️ la première section du plan reçoit le titre de la page via
  `adaptContent` : elle doit avoir une clé de titre (leçon : un plan commençant
  par `quote-spotlight` perdait le titre, il n'a pas de `title`) ;
- les `fillers` de `repairRecipe`/`repairSubPageSections` (pages trop maigres) ;
- côté éditeur : les groupes du bouton « Ajouter » (`StudioEditor.tsx`).

---

## 7. Checklist de validation (toutes les cases, à chaque lot)

1. `npx tsc --noEmit` — propre.
2. `npx vitest run` — la suite complète passe (≈ 466 tests au 2026-06-11).
3. `npm run build` — « Compiled successfully ».
4. Pas de warning « parité manifest/composant rompue » en console dev.
5. `GET /foundry-preview/<id>` → 200 pour CHAQUE nouvelle pièce, et contrôle
   VISUEL (pas juste le status) : sample complet, pas de clé rendue vide.
6. Contrôle multi-DA : la pièce dans au moins 2 vibes opposées
   (`warm-serif` ET `mineral-precis` ou `encre-editoriale`) + un accent
   custom criard (vert fluo) → contrastes et radius tiennent.
7. Dans L'Atelier : ajouter la pièce, la remplacer (try-on), éditer chaque
   champ dans le panneau Contenu (libellés FR présents), undo.
8. Test agenceur réel : générer un site avec un brief du métier visé et
   vérifier que Mistral sélectionne la pièce quand c'est pertinent — et ne la
   met PAS partout.
9. Les nouvelles images sont bien sous `public/_templates/<site>/` et chargent
   (pas de 404 réseau).

---

## 8. Référence rapide — fichiers du lot pilote à imiter

| Artefact | Fichier modèle |
|---|---|
| Manifests + samples d'un lot | `lib/foundry/library/artisans-a.ts` |
| Map composants d'un lot | `components/foundry/library/artisans-a.tsx` |
| Agrégateurs (câblage main) | `lib/foundry/library/index.ts`, `components/foundry/library/index.ts` |
| Section serveur simple | `components/foundry/components/PricingCards.tsx` (+ pattern flex centré) |
| Section animée au scroll | `components/foundry/components/FxContainerScroll.tsx` (capture, rAF, reduced-motion) |
| Entrées en cascade / parallaxe | `components/foundry/components/TeamCards.tsx`, `ParallaxStrip.tsx` via `fx.tsx` |
| Définitions catalogue (style) | `lib/foundry/manifests.ts` (sections design + fx commentées) |

Reste à extraire : ~9 lots (~26 sites) sous `Sitegenerator/sites/`
(photographers, musicians, coaching, elearning, electricians, saas,
portfolio…). Procéder lot par lot, un commit par lot, checklist complète à
chaque fois.
