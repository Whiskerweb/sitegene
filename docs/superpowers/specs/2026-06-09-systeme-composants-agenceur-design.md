# Design — Système « fonderie » : bibliothèque de composants + agenceur Mistral

**Date :** 2026-06-09
**Statut :** validé (brainstorming) → à planifier (Sous-projet 1)

## 1. Contexte & objectif

Aujourd'hui : des templates clonés (Framer) servis tels quels (miroirs) ou régénérés
par Mistral depuis un `design-system.md`. Constats de la session :
- régénérer un template Framer par prompt → **échec visuel** (jamais à la hauteur de l'original) ;
- forker-modifier un miroir → garde la qualité mais c'est **rigide** (1 template = 1 forme) et plein de refs Framer internes.

**Objectif :** des sites de **qualité niveau-template**, **100 % sur-mesure**, **sans imposer
de sections inutiles**, **assemblés automatiquement** par l'IA. Plus de templates modifiables —
juste une **DA proposée** + un **assemblage** de composants.

**Principe directeur :** la qualité vient de **composants hand-built excellents** (payés une fois),
pas de la génération. L'IA **agence**, elle ne crée pas.

## 2. Décisions verrouillées (brainstorming)

1. **Runtime** : UN codebase React unique (la « fonderie »). Un site client = une **recette** (data),
   pas du code. Mistral produit la recette, **jamais du code**.
2. **Adaptation DA** : Mistral n'altère **jamais** la structure d'un composant. Il édite seulement
   la **« peau »** (couleurs, typo, rayons, espacement) **et** le **contenu** (texte, photos).
3. **Latitude** : peau = bloc de style **délimité** par composant ; structure / layout / JSX /
   animations **verrouillés**. Composant **copié tel quel**, jamais réinventé.
4. **DA** : **set curé de 4-6 vibes** premium hand-tunées + **personnalisation bornée** (couleur de
   marque, logo, paire de polices au choix dans la vibe). Chaque composant **testé contre chaque vibe**.
5. **Ordre/hiérarchie** : Mistral **ordonne librement**, guidé par des **principes** inscrits dans
   le skill (pas de squelette figé).

## 3. Architecture — la fonderie & le modèle « recette »

UN codebase React contient : **bibliothèque de composants** + **vibes** (thèmes) + **assembleur**.

Un site client = une recette :
```jsonc
{
  "vibe": "warm-serif",
  "brand": { "primary": "#8d6959", "logo": "...", "fontPair": "castoro-nunito" },
  "sections": [
    { "component": "hero-split-asym", "content": { "title": "...", "image": "/media/hero.jpg", "avatars": ["...","...","..."] }, "skin": { "accent": "#8d6959", "surface": "cream" } },
    { "component": "services-rows",   "content": { ... }, "skin": {} },
    { "component": "faq-accordion",   "content": { ... }, "skin": {} }
  ]
}
```

**Flux :** (1) client remplit ses infos + valide une vibe → (2) Mistral lit le catalogue + infos →
émet la recette → (3) l'assembleur importe chaque composant **réel**, applique vibe + peau, injecte
le contenu → **site React**.

**Conséquences :** améliorer un composant → tous les sites en profitent ; Mistral ne peut pas casser
un composant (il ne touche qu'à la recette : choix + contenu + peau bornée) ; « copier-coller sans
réinventer » = composant **construit une fois** dans la library, réutilisé tel quel par la recette.

## 4. Le contrat de composant

Chaque composant = un dossier auto-décrit :
```
components/<id>/
  Component.tsx        # le composant React RÉEL (verrouillé), copié tel quel
  manifest.json        # ce que Mistral LIT pour décider
  content.schema.ts    # slots de contenu typés (texte + images) + longueurs/nb max
  skin.tokens.ts       # tokens de peau éditables (accent, headingFont, surface, radius…)
  preview.jpg
```

`manifest.json` (court, lisible par Mistral) :
```jsonc
{
  "id": "hero-split-asym",
  "role": "hero",
  "description": "Hero 3 colonnes : accroche + preuve sociale à gauche, grande photo à pastilles au centre, mini-bloc + 2e photo à droite.",
  "whenToUse": ["forte preuve sociale", "métier visuel/humain (coach, photographe, bien-être)", "hero riche premium"],
  "whenToAvoid": ["site très sobre/corporate", "peu de contenu visuel"],
  "vibes": ["warm-serif", "soft-wellness"],
  "contentSlots": 7,
  "media": { "image": "portrait", "avatars": "3 visages" }
}
```

Deux **surfaces éditables** par Mistral, et rien d'autre :
- `content` = tout le texte + toutes les images (remplies avec le contenu client) ;
- `skin` = couleurs + typo (+ rayons/espacement), bornées aux valeurs de la vibe.

`description` + `whenToUse/Avoid` = sélection par Mistral. `vibes` = vibes contre lesquelles le
composant est **testé** (jamais de combinaison cassée).

## 5. Le système de vibes (DA)

Une **vibe** = objet thème complet (pas juste des couleurs) :
```ts
vibe "warm-serif" = {
  palette: { ink:'#0d0503', surface:'#fcfaf7', card:'#f8f3ec', accent:'#8d6959', accent2:'#e1937d', muted:'#70747a' },
  typo:    { heading:'Castoro', body:'Nunito', scale:'editorial', tracking:'tight' },
  radius:  { card:24, pill:999, xl:32 },
  density: 'airy', shadow: 'soft-warm',
  motion:  { reveal:'fade-rise', intensity:'gentle', special:['count-up','marquee'] },
  rhythm:  { bgAlternation:['surface','card'], sectionPad:'generous' },
}
```

- **4-6 vibes curées** (ex. warm-serif, clean-sans, dark-editorial, soft-wellness, bold-pop).
- **Personnalisation bornée** : couleur de marque → slot `accent` (teinte, ne remplace pas toute la
  palette) ; logo ; paire de polices parmi 2-3 autorisées par la vibe.
- **Consommation** : variables CSS (`--c-accent`, `--c-surface`, `--font-heading`, `--radius-card`,
  `--motion-intensity`…). La vibe les pose à la racine ; le `skin` d'une instance ne surcharge qu'un
  **sous-ensemble autorisé**, avec des **valeurs de la vibe** (ex. `surface ∈ {surface, card, ink}`,
  `accent ∈ palette`). → garde-fou anti-« flagrant ».
- **Matrice composant × vibe** testée → jamais de combinaison cassée.

## 6. L'agenceur Mistral (skill runtime)

Skill = **directive d'agencement** (markdown), universelle (tout métier). Rôle cadré :
« agenceur, pas créateur ; jamais de markup/CSS ; choisir, ordonner, remplir, accorder ».

**Entrées :** infos client (métier, objectif, offres, preuves, photos, ton) + vibe validée + catalogue (manifests).
**Sortie :** la **recette** (JSON validé). Rien d'autre.

**Process imposé (6 étapes) :**
1. Comprendre le besoin + **la matière réellement dispo**.
2. Sélectionner (role + whenToUse + compat vibe + matière). **Pas de matière → pas de section.**
3. Ordonner par **principes** (ouvrir fort → preuve tôt → alterner densité/fond → regrouper → CTA final).
4. Rédiger le contenu (ton client, longueurs max, 1 message par section).
5. Accorder la peau (valeurs autorisées).
6. Affecter les images.

**Cœur = bibliothèque de principes** (anti-« blocs empilés ») : hiérarchie de l'info, rythme,
zéro redondance, densité adaptée au métier (repères, pas loi), **auto-contrôle** avant émission.

Côté plateforme : évolution de `lib/design-system-gen.ts` / `api/site/ai` — Mistral émet une **recette**
(plus du HTML) ; le skill remplace le « design-system.md par template » par **une directive universelle**.

## 7. Pipeline d'extraction (build-time) + skill d'extraction

C'est là que vit la qualité. Échec récurrent = **deviner au lieu d'inspecter** → interdit.

**4 principes :** (1) one-shot soigné, par composant, **jamais par Mistral ni par site** ;
(2) piloté par l'**inspection** (valeurs réelles), pas la mémoire ; (3) **gate de vérification**
(diff visuel desktop+mobile vs original **+** rendu sous chaque vibe compatible) ; (4) **paramétrage**
à l'extraction (`content.schema` + `skin.tokens` + structure verrouillée).

**5 étapes :**
1. **Capturer** : servir le clone en local, **injecter une sonde** dump `getComputedStyle` (blueprint
   pixel) + structure DOM + screenshots desktop/mobile + observer animations. *(Méthode prouvée sur
   Sereenity : dump 1460px → valeurs exactes.)*
2. **Reconstruire** : composant React propre **à partir du blueprint** (valeurs exactes, animations comprises).
3. **Paramétrer** : contenu → schema ; style → tokens (lisant la vibe) ; structure verrouillée ; `manifest.json`.
4. **Vérifier (gate)** : tant que ça ne matche pas (vs original + sous chaque vibe) → pas de publication.
5. **Publier** : registre library + `preview.jpg`.

**Honnêtetés :** source React vraie → adaptation directe ; source Framer/compilée → **reconstruction
fidèle obligatoire** (pas de copier-coller magique). Fidélité = **inspection navigateur** (la sonde
+ getComputedStyle suffit ; **Chrome MCP** la rend plus robuste pour screenshots/interactions).

→ **Skill d'extraction** (nous/l'agent, build-time) qui codifie ce pipeline pour qu'il soit reproductible.

## 8. Décomposition en sous-projets (ordre de construction)

Chaque sous-projet aura son propre spec → plan → build.

1. **Socle « fonderie » (tranche verticale) — EN PREMIER.** Contrat formalisé sur 1 composant +
   runtime de vibe (CSS vars) + **1 vibe** (warm-serif) + **assembleur** (recette → site) +
   **3-4 composants seed** (hero, services, témoignages, footer) + une **recette écrite à la main**
   qui rend un vrai site. → prouve la boucle recette→site + théming + contrat, sur du réel.
2. **Skill d'extraction** (build-time) → étoffer la library (10-15 composants depuis les clones), chacun au gate.
3. **Vibes** (largeur) → 4-6, valider la matrice composant × vibe.
4. **Skill agenceur** (Mistral, runtime) → directive + intégration catalogue→recette→assembleur.
5. **Flux client** → choix de vibe + infos → génération auto → aperçu/édition.

**Ordre justifié :** prouver la boucle (1) avant la largeur (2-3) et l'IA (4) ; l'extraction (2) scale
la library ; Mistral (4) n'arrive qu'avec une vraie library + assembleur à cibler.

## 9. Hors-périmètre (YAGNI, pour l'instant)

- Pas d'éditeur WYSIWYG client sur ces sites (l'édition passe par re-génération de recette).
- Pas de génération de DA sur-mesure (set curé only).
- Pas de multi-langue.
- Pas de migration des templates/miroirs existants vers la fonderie (coexistence ; on ne casse rien).
- Pas de pipeline de build par client (le codebase unique rend depuis la recette).

## 10. Critères de succès

- **Socle (SP1)** : une recette écrite à la main rend un vrai site React, beau, sous la vibe warm-serif,
  les 3-4 composants seed s'accordent (peau) et le contenu est injecté — sans toucher au code des composants.
- **Global** : un nouveau site (artisan/coach/photographe) est assemblable depuis une recette ; aucun
  composant cassé sous aucune vibe compatible (matrice verte) ; aucune section sans matière ; flux
  lisible de haut en bas (pas « empilé »).
- **Qualité** : un site assemblé est indiscernable d'un template hand-made sur la vibe choisie.
