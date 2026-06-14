# Audit parcours client — tunnel /creer → site en ligne

Date : 2026-06-11 · Périmètre : `/creer` (fonderie), génération Mistral, DA, dashboard, paiement, publication.
Méthode : skill `parcours-client` (cartographie → friction → kill/merge/prefill/defer → plan).

## Synthèse

- **Écrans du tunnel** : 5 phases (pitch → collect → vibe → pack → reveal) + 4 écrans post-reveal (dashboard, paywall/essai, Stripe, Atelier).
- **Champs obligatoires** : 2 seulement (nom + pitch) — excellent.
- **Time-to-reveal mesurable** : ~60–90 s si la génération spéculative aboutit (charte 1 choisie), sinon + 30–75 s d'assemblage.
- **Aucune donnée funnel instrumentée** : tout le scoring est heuristique `[unmeasured]` — voir « Instrumentation » plus bas.

## Corrigé dans cette passe (2026-06-11)

| # | Friction | Fix livré | Commit |
|---|----------|-----------|--------|
| 1 | **Photos mortes sans compte** : `reserveSiteId()` exigeait l'auth → bouton photos grisé à l'infini (« Préparation du dépôt photos… ») pour tout visiteur anonyme, soit le cas majoritaire | Upload anonyme par `draftId` (sessionStorage) vers `site-photos/staging/<draftId>/`, rate-limité IP, bornes 20 photos / 8 Mo | `3ee53da` |
| 2 | **Liens 100 % manuels** alors que `lib/scrape-site.ts` existait (ancien tunnel seulement) | Import « magique » : collez votre site → liens + contacts + réservation pré-remplis (`mergeScrapedIntoCollected`, jamais d'écrasement de saisie). URL sociale/Calendly → rangée directement sans scrape | `3ee53da` |
| 3 | **UX photos pauvre** : upload séquentiel, pas d'aperçu, pas d'ordre, 8 Mo bruts sur mobile | Drag & drop, aperçus locaux instantanés, compression navigateur (1920 px WebP), 3 uploads parallèles, réessai par photo, réordonnancement ←/→, badge « Principale » (la 1ʳᵉ photo alimente le hero via `inject.ts`) | `3ee53da` |
| 4 | **Structure identique pour tous les métiers** : `hero-split-asym` hardcodé dans le prompt ET dans `repairRecipe`, « adapte le TON, pas la structure » | `hero-router.ts` (hero/navbar par métier+DA, blacklists hors-contexte), catalogue filtré, traitements DA transmis à Mistral, fallbacks spécialisés. Rareté = informative uniquement, **aucun quota** | `e27ce36` |
| 5 | **Import de DA impossible** | `ImportCharte` : couleur, clair/sombre, paire typo, coins → réparé par `repairCharte` (WCAG), 4ᵉ carte « Votre identité » | `bd62fb1` |
| 6 | **Bug charte sombre** : `vibeToSpec` perdait `mode` → une charte dark choisie redevenait claire à la génération (tunnel ET Atelier) | `mode` transporté dans `CharteSpec` + test aller-retour | `bd62fb1` |

## Vérifications demandées (état réel)

- **Pertinence des DA par métier** : OK. `detectTrade(brief)` → `TRADE_GUIDANCE` (directive métier injectée dans le prompt charte, ex. musicien rock ⇒ ≥ 2 chartes dark obligatoires) + repli `da-personas.ts` (scoring vibe↔métier/sous-persona). `charte.ts:267`.
- **Changer de DA** : OK à 3 endroits — « Proposer trois autres directions » (étape vibe), « Essayer une autre charte » (reveal), PalettePanel de l'Atelier (édition custom live + presets, persistée re-réparée serveur).
- **Accès de Mistral aux composants** : 82 composants (25 socle + 57 library) tous dans le prompt, filtrés seulement par pertinence métier (plumber-only réservé artisans, heroes hors-contexte exclus). **Aucun quota commun/rare/épique** : la rareté n'est qu'un label marketing dans le prompt et l'UI booster.

## Use cases production (à tester en E2E manuel)

1. **Marie, photographe mariage, mobile, depuis une pub Instagram, pas de compte**
   pitch → colle `instagram.com/marie.photo` (rangé direct) → glisse 10 photos HEIC ?
   ⚠️ **HEIC non accepté** (jpeg/png/webp seulement) — l'iPhone envoie du HEIC si « Plus compatible » n'est pas activé. → voir plan #3.
2. **Karim, plombier, a un site wix.com** → import magique : scrape OK (title, tél, e-mail, Facebook) ; vérifie que `electrician-pro-hero`/`multi-trade-hero` sort bien (pas le hero générique).
3. **Léa, rappeuse** → 2 chartes sombres minimum ; choisit dark → site dark (bug #6 corrigé) ; hero `bold-stack-hero` via override `rap-luxe`.
4. **Hugo, coach, a déjà une charte** (violet #6d28d9, sombre) → ImportCharte → accent désaturé par repairCharte (plafond néon) : vérifier que le rendu reste fidèle à son violet.
5. **Abandon/reprise** : ferme l'onglet en phase vibe → revient → sessionStorage restaure pitch+chartes+collected (photos = URLs staging, donc intactes). OAuth Google au moment d'assembler → état restauré. OK.
6. **Paiement pendant génération** (self-serve) : payer alors que le job tourne → site publié par le worker, mais le client ne voit pas de progression → voir plan #2.

## Frictions restantes — plan d'action priorisé (impact ÷ effort)

| # | Action | Type | Impact | Effort |
|---|--------|------|--------|--------|
| 1 | **Slug : suggérer des alternatives** (`nom-2`, `nom-ville`) au lieu de bloquer sur collision (`/welcome/name`, outreach) | PREFILL | Évite un abandon post-paiement (!) | 0.5 j |
| 2 | **Écran d'attente post-paiement** : si génération en cours au moment du fulfill, le dashboard doit montrer la construction (réutiliser `build-state` poll) au lieu d'un statut figé | UX | Confiance au moment le plus sensible | 0.5 j |
| 3 | **Accepter HEIC/AVIF à l'upload** (conversion via canvas → webp, déjà en place ; il suffit d'élargir `accept` + types serveur si `createImageBitmap` les décode) | KILL friction mobile | iPhone = gros volume | 0.5 j |
| 4 | **« Proposer 3 directions IA » dans l'Atelier** (réutiliser `/api/foundry/charte` avec le brief de la recette) — aujourd'hui le client post-achat n'a que l'édition manuelle/presets | FEATURE | Changement de DA complet post-achat | 1 j |
| 5 | **Nettoyage du staging photos** : cron qui purge `staging/*` > 7 jours non référencés | HYGIÈNE | Coût storage | 0.5 j |
| 6 | **Instrumentation funnel** : événements `creer_pitch / collect / vibe_selected / pack / reveal / dashboard / paid` (table `events` existante) — sans ça, aucune optimisation n'est mesurable | MESURE | Préalable à tout le reste | 0.5 j |
| 7 | **Heroes dédiés manquants** : coach, bien-être, restaurant, beauté, fitness, conseil retombent sur `hero-split-asym` (cf. `TRADE_HERO_OPTIONS`). Extraire/créer ~6 heroes (lot heroes-b) pour finir la différenciation | CONTENU | Le « pas pareil par métier » complet | 2–3 j |
| 8 | **Scrape SPA-blind** : un site 100 % JS rend peu de données ; fallback possible = lire le HTML rendu via un fetch `?_escaped_fragment_`/metadata OG seulement, ou message honnête « on n'a trouvé que X » (déjà fait) | LIMITE | Faible | — |
| 9 | **noindex sur `/a/<slug>`** : décision marketing connue (mémoire GEO) — à lever quand prêt | SEO | Discovery clients | décision |

## Mockup — collect avant/après (livré)

```
AVANT                                   APRÈS
┌──────────────────────────┐            ┌────────────────────────────────────┐
│ Personnalisez votre site │            │ Personnalisez votre site           │
│                          │            │ ┌────────────────────────────────┐ │
│ Instagram  [__________]  │            │ │ ✦ Déjà en ligne quelque part ? │ │
│ Pinterest  [__________]  │            │ │ [votre-site.fr____] [Importer] │ │
│ Behance    [__________]  │            │ │ → 4 liens et 2 contacts ✓      │ │
│ RDV        [__________]  │            │ └────────────────────────────────┘ │
│ E-mail     [__________]  │            │ Instagram  [@marie.photo______] ✓  │
│ Téléphone  [__________]  │            │ E-mail     [marie@photo.fr____] ✓  │
│                          │            │ …                                  │
│ Vos photos        0/20   │            │ Vos photos                  6/20   │
│ [+ Ajouter] (grisé ∞     │            │ ┌────┐┌────┐┌────┐┌────┐ glisser-  │
│  si pas de compte ⚠)     │            │ │★Pri││ ←→ ││ ⟳  ││ +  │ déposer   │
└──────────────────────────┘            └────────────────────────────────────┘
```

## Bottom line

Le tunnel est passé de « formulaire propre » à « le client colle un lien, glisse ses photos, et choisit entre 3 directions calibrées métier ou la sienne ». Les deux chantiers qui débloquent le plus de valeur maintenant : **#6 instrumentation** (rien n'est mesuré) et **#7 heroes manquants** (6 métiers sur 10 n'ont pas encore de hero dédié).
