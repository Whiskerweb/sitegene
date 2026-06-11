# Spec — Moteur de Directions Artistiques enrichi + matching onboarding

Date : 2026-06-11
Projet : `sitegene/` (fonderie Akyra)
Statut : design validé (visuel + comportement), prêt pour plan d'implémentation.

> ⚠️ Next.js 16 / Turbopack modifié — lire `node_modules/next/dist/docs/` avant tout code Next.

## 1. Problème

Une « direction artistique » (vibe) ne porte aujourd'hui que **6 couleurs + 2 polices + 3 rayons** (`lib/foundry/types.ts` → `Vibe`, `lib/foundry/vibes.ts`). Les ~60 composants sont agnostiques (pilotés par CSS vars). Conséquence : deux DA ne peuvent différer **que par la couleur d'accent**. Les 6 vibes sont toutes « surface claire + serif/sans » → aucune sombre, aucune brutaliste, aucune éditoriale extrême. D'où « elles se ressemblent toutes ». Confirmé visuellement avec l'utilisateur.

La couche de matching onboarding existe déjà (`lib/foundry/suggest.ts` : `detectTrade(brief)` → vibes ordonnées) mais ne pointe que vers les 6 vibes claires.

## 2. Décision d'architecture

**Option B** (choix utilisateur) = tokens enrichis + dials (taste-skill) **+ traitements de section par DA**. Socle A (tout le catalogue profite des nouveaux tokens) PUIS traitements ciblés par DA, hero d'abord. Pas de composants bespoke par DA (option C — ne passe pas à l'échelle ; cf. lignées Jazz/Luxury orphelines).

Référentiel de craft : skills `frontend-design` (typo distinctive, pas d'Inter par défaut, couleurs dominantes + accents francs, motion orchestrée, atmosphère/texture, anti-slop) et `/taste-skill` (dials variance/motion/densité).

## 3. Modèle `Vibe` enrichi (périmètre validé)

Nouveau type (rétro-compatible — les 6 champs actuels restent **dérivables**) :

```
Vibe {
  id; label; mood[];
  mode: "light" | "dark";
  palette: { primary, secondary, accent, background, surface, textPrimary, textSecondary, border };
  fonts: { display, body, label };           // label = face mono (ex. JetBrains Mono)
  fontHref;                                    // Google Fonts des 3 faces
  density: { base, gap, cardPadding, sectionPadding };
  shape: { card, control, pill, borderStyle, shadowCard, buttonStyle };
  texture: "none" | "grain" | "grid" | "glow" | "gradient-mesh";
  dials: { variance, motion, density };        // 1..10 (taste-skill)
  personas: Array<{ trade: TradeId; subPersona?: string; weight: number }>;
  treatments?: { hero?: HeroTreatment; /* extensible */ };
}
```

## 4. Compatibilité ascendante (zéro régression)

`vibeToCssVars` émet **deux jeux** de variables :

- **Anciennes (mappées)** : `--c-ink ← textPrimary`, `--c-surface ← background`, `--c-card ← surface`, `--c-accent ← primary`, `--c-accent2 ← secondary|accent`, `--c-muted ← textSecondary`, `--font-heading ← display`, `--font-body ← body`, `--r-card/--r-xl/--r-pill ← shape`.
- **Nouvelles** : `--c-primary, --c-secondary, --c-bg, --c-text, --c-text-2, --c-border, --font-label, --space-base/gap/card/section, --r-control, --shadow-card, --btn-radius, --btn-style`.

Invariant : une DA **sombre** rend correctement sur les composants NON migrés, car `--c-ink`(=textPrimary clair) et `--c-surface`(=background sombre) restent cohérents entre eux. Les 6 vibes actuelles sont ré-exprimées dans le nouveau modèle **sans changement visuel** (test de non-régression).

`brand.primary` (surcharge accent) continue de primer sur `palette.primary` via `vibeToCssVars(vibe, brand)`.

## 5. Migration des composants (socle A) — par lots

1. **Lot 1 — héros + navbars + footers** : remplacer les littéraux (`#fff`, etc.) par les vars sémantiques (`--c-text`, `--c-border`, `--btn-radius`…). Inclut les traitements hero (§6).
2. **Lot 2 — sections de contenu** (services, features, pricing, gallery, stats, faq, cta, about…).
3. **Lot 3 — Fx + finitions**.

Tout composant migré reste piloté par tokens → toute DA s'applique à tout le catalogue.

## 6. Traitements de section par DA (option B)

Une DA peut déclarer un traitement par rôle. Démarrage sur le **hero** :
`HeroTreatment = "split-editorial" | "fullscreen-photo" | "type-giant" | "centered-glow" | "default"`.
Le composant hero lit `vibe.treatments?.hero` et adapte sa structure. Absence de traitement → `default` (pas de régression). Extensible aux autres rôles ensuite.

## 7. Les DA livrées

- Les **6 vibes actuelles** ré-exprimées (mapping 1:1, aucun changement visuel attendu).
- **9 nouvelles DA** validées visuellement (mockups full-page dans `.superpowers/brainstorm/.../content/`) :
  - **SaaS/produit** (specs Neuform, fournies par l'utilisateur) : `mindful-moments` (wellness, vert/or, dark), `lexicon-creators` (créateur, noir/orange, dark, coins nets), `auralis-neural` (tech/IA, clair + panneau glow cyan/indigo), `nexus-transfers` (fintech, crème chaud, bento), `neurosync` (feature, clair net terracotta/slate).
  - **Musicien** : `rock-brutalist` (zine, noir/jaune acide, Anton), `rap-luxe` (chrome+or sur noir, Syne, streaming-first), `contemporain-editorial` (crème intime, Fraunces, paroles).
  - **Verticaux** : `photographe-galerie` (galerie froide image-first, Bricolage Grotesque), `coach-performance` (industriel kinetic, lime, Bebas Neue), `restaurant-nocturne` (braise/or, Cormorant).
- Palettes 8 rôles + 3 polices + densité + forme + texture + dials + personas : détail dans l'historique de conversation (blocs « Prompt context source » Neuform + mockups `da-musiciens.html`, `da-trois.html`, `da-five.html`).

## 8. Matching onboarding (étend l'existant `lib/foundry/suggest.ts`)

Comportement validé : **classement par pertinence** (toutes les DA visibles, triées ; 3-4 premières badge « Recommandé pour vous » ; jamais masqué). Signal : **métier + sous-persona**.

- Étendre `TradeId` (+`musicien`, `fitness`…) et `detectTrade` (mots-clés rock/rap/chanteur/concert → `musicien` + sous-persona ; salle/coach sportif → `fitness`…).
- Remplacer la table statique `SUGGESTIONS` par un **scoring** : pour `(trade, subPersona)`, classer **toutes** les DA via leurs `personas[].weight`. Raison affichable conservée (générée depuis le mood/persona).
- `generateChartes` (Mistral, charte sur mesure) reste, branché sur le schéma enrichi (réparation contraste WCAG sur 8 rôles).

## 9. Séquencement (défaut retenu)

- **Lot 1** : modèle enrichi + `vibeToCssVars` (compat) + migration héros/navbars/footers + traitements hero + 9 DA + matching onboarding. → DA spectaculaires sur le 1er écran + onboarding qui classe.
- **Lot 2/3** : reste des sections, puis Fx.
- **Effets** : Lot 1 en **CSS-only** (grain/grid/glow/gradient — perf safe). **WebGL/Three.js en phase 2**, ciblé sur les DA qui le méritent (Auralis, etc.).

## 10. Non-régression / validation

- `npx tsc --noEmit` vert.
- `npx vitest run lib/foundry/` : 72/72 + nouveaux tests (mapping ancien↔nouveau, scoring matching, chaque DA produit des vars valides + contraste WCAG AA texte/fond).
- Les 6 vibes ré-exprimées : diff visuel nul (snapshot des CSS vars produites).
- Aucune migration DB (le modèle vit dans `content_json.__recipe.customVibe` / `vibe` ; les DA curées sont en code).

## 11. Hors périmètre (YAGNI pour cette passe)

- Composants bespoke par DA (option C).
- Éditeur de DA avancé côté client au-delà du `PalettePanel` existant.
- WebGL en lot 1.
- Enregistrement des lignées orphelines (Jazz/Luxury…) au catalogue — décision séparée.
