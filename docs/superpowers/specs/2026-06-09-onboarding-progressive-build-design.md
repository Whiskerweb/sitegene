# Onboarding « le site se construit en parlant » — Design

**Date :** 2026-06-09
**Branche cible :** `feat/onboarding-ai-generation` (continuité)
**Statut :** validé pour implémentation

---

## 1. Intention

Aujourd'hui le tunnel onboarding génère le site **après** le chat, en tâche de fond, hors écran : le « wow » (voir SON site complet) arrive dans un mail / sur le dashboard, après le paywall. Diagnostic S&S (Activation) : le pic émotionnel est hors tunnel, donc la conversion et la rétention laissent de la dopamine sur la table.

**Nouveau principe directeur : l'ordre du chat = l'ordre de la page.** Chaque réponse du client remplit **une section**, qui se **génère et apparaît en direct** dans une preview à côté du chat. Quand le chat se termine, le site est **déjà construit** → reveal plein écran + confettis **dans le tunnel**, avant le paywall. La latence Mistral (~50-120 s pour un site complet) est **absorbée** par le temps que le client passe à répondre aux questions suivantes : on ne génère jamais « le site » d'un bloc, on génère 5 petits fragments pendant qu'il parle.

Ajouts : **dictée vocale** (micro → Whisper serveur) pour réduire la friction de saisie.

## 2. Contraintes de cohérence (non négociables)

### 2.1 DA — cohérence avec le dashboard (DA « Cloud »)
Le split-screen et le reveal réutilisent la DA existante (cf. `app/dashboard/page.tsx`, `app/onboarding/AiOnboardingClient.tsx`) :
- Fond `bg-gradient-to-b from-sky-50 to-white`, accents **sky-600 / violet / indigo / emerald**.
- Cartes `rounded-xl`/`rounded-2xl` + `ring-1 ring-slate-200` (ou `border border-gray-200 bg-white`), `card-hover`.
- Titres en `var(--font-display)`. Icônes **lucide-react**. `Spinner`, `Button`, `Card`, `StatusPill` existants.
- Statuts de section repris des tons du dashboard : **violet** (en cours), **emerald** (fait), **amber** (souci), **gray** (à venir).
- Le reveal s'inspire du `HeroBanner` sombre du dashboard (continuité visuelle entre tunnel et espace client).

### 2.2 Marketing — cohérence Activation/Rétention (lentille `marketing-plan`, stage Activation)
Contraintes baked-in dans chaque décision UI :
- **Time-to-first-value court** : le header apparaît **< 20 s** après la 1re réponse (identité). Premier wow tôt.
- **Effet de dotation / effet IKEA** : le client **voit SON site se co-construire** → il s'approprie l'objet (« c'est MON site »), ce qui augmente la complétion et la propension à payer. La copie dit toujours « **votre** site », célèbre la progression.
- **Reveal AVANT le paywall** : on montre le site fini (pic émotionnel) **puis** on demande de payer. Jamais l'inverse.
- **Réduction de friction** : voix, une seule question à la fois, **aucun spinner mort** (toujours une construction visible ou une narration).
- **Brand voice Akyra** : chaleureuse, concise, humaine, encourageante (miroir du SYSTEM prompt de `lib/onboarding-ai.ts`).
- **Loss aversion douce au paywall** : « votre site est prêt » (cadrage possession), pas « achetez un site ».
- **Rétention** : email « votre site est prêt » (déjà en place), dashboard qui met SON site au centre (déjà en place).
- **Graine de Referral (noté, hors scope build)** : un lien d'aperçu public partageable serait le prochain levier — non implémenté ici (YAGNI), tracé pour plus tard.

## 3. Architecture — une couche d'optimisation au-dessus du pipeline robuste

Principe de sûreté : **le streaming par section est une OPTIMISATION** posée au-dessus du pipeline actuel (job `generate_site` + `runSiteGenerationJob`), pas un remplacement. Si le streaming échoue entièrement, on retombe **exactement** sur le comportement d'aujourd'hui (site complet garanti). Aucune régression possible.

```
Q1 identité (métier + ambiance) → pickDesignSystem → generateHeader  → HEADER apparaît (~15s)
Q2 services                     → generateSection('services')        → section pop-in
Q3 tarifs                       → generateSection('pricing'|'approach') → pop-in
Q4 zone / parcours              → generateSection('about')            → pop-in
Q5 contact                      → generateSection('contact')          → pop-in → site complet
fin du chat → assemble → REVEAL plein écran + confettis → « Publier » (paywall inchangé)

Filet : job generate_site (existant) en fin de chat → complète les sections manquantes
        ou régénère le corps en bloc (comportement actuel). Cron Vercel = reprise.
```

### 3.1 Mapping question → slot → section

On **réordonne** le SOCLE de `lib/onboarding-ai.ts` pour que l'identité vienne en premier (header générable au plus tôt), et on **associe chaque slot à une section** :

| Ordre | Slot(s) | Déclenche | Section |
|---|---|---|---|
| 1 | `brand` + `activity` + `tone` (cluster « identité ») | `pickDesignSystem` + `generateHeader` | **header** (nav + hero) |
| 2 | `services` | `generateSection` | **services** |
| 3 | `priceRange` / `wantsPricingPage` | `generateSection` | **pricing** (ou **approach** si `wantsPricingPage===false`) |
| 4 | `area` (+ `about` enrichi) | `generateSection` | **about** (zone / parcours) |
| 5 | `contact` | `generateSection` | **contact + footer** |

Le header se déclenche dès que `categoryId` + `activity` sont connus (`tone` par défaut `chaleureux` si absent ; `brand` dérivé/`"Votre Studio"` si absent). Les sections se déclenchent quand leur slot **passe** de vide à rempli.

L'agent `nextTurn` reste conversationnel mais est **contraint à couvrir le 1er slot manquant** (le socle est déjà ordonné et le prompt liste les manquants dans l'ordre — on durcit l'instruction). Il peut toujours capter de l'info opportuniste en plus.

### 3.2 Génération par section (le vrai morceau)

`lib/design-system-gen.ts` fait aujourd'hui **un seul gros appel** `generateBody` pour tout le corps. On ajoute la génération **par fragment** :

- **`generateSection({ origin, templateId, sectionKey, sectionTitle, sectionBrief, facts, headerDoc, priorSectionsContext, imagePlan, photoUrls, timeoutMs })`** → `{ ok, sectionHtml }`.
  - Nouveau prompt `SYSTEM_SECTION` : « produis UNIQUEMENT le `<section>…</section>` pour `<sectionTitle>`, en réutilisant EXACTEMENT les classes/couleurs/polices du HEADER fourni ; data-sg-path/data-sg-img obligatoires ; data-anim sur chaque bloc ; pas de `<head>`, pas de `<header>`, pas de footer sauf section `contact`. »
  - `priorSectionsContext` = les **balises d'ouverture** (classes/bg) des sections déjà générées (cheap) → permet d'**alterner les fonds** et de garder le rythme vertical (mitigation du risque d'incohérence inter-sections, cf. §7).
  - `sectionBrief` = la matière propre à cette section, dérivée de l'intake (services listés, tarifs, zone…).
- **`assembleProgressive({ origin, templateId, headerDoc, sections: {key,html}[], photoUrls })`** → `{ html, content }` : concatène les sections **dans l'ordre du plan**, insère avant `</body>` du headerDoc, force les photos (`assignPhotosInOrder`), injecte le motion kit, extrait le `content_json` (`extractContentFromShell`). Généralise `assembleSite` (qui devient un cas particulier à 1 fragment).

### 3.3 État des sections (transient, dans l'intake)

On suit le pattern existant `intake.__headerHtml` / `intake.__triedTemplates` (clés préfixées `__` = transient, jamais du contenu) :

```ts
intake.__sections = {
  services: { html: string, status: 'pending'|'streaming'|'done'|'error', title: string },
  pricing:  { ... },
  about:    { ... },
  contact:  { ... },
}
intake.__sectionPlan = ['services','pricing','about','contact']  // ordre, calculé à l'identité
// header reste dans intake.__headerHtml (inchangé)
```

`status` : `pending` (planifiée, pas commencée), `streaming` (appel Mistral en cours), `done` (html prêt), `error` (échec → retriable). Nettoyé en fin de job (`runSiteGenerationJob` supprime déjà `__headerHtml`/`__triedTemplates` ; on ajoute `__sections`/`__sectionPlan`).

### 3.4 Déclenchement asynchrone (ne jamais bloquer le chat)

Un tour de chat doit rester **rapide** (juste la prochaine question). La génération d'une section (~15-30 s) tourne **en arrière-plan** via **`after()`** (Next 16, post-réponse, borné par `maxDuration`) déclenché par la route `/api/onboarding/ai/next` :

- Après extraction de l'intake et sauvegarde, la route détecte les slots **nouvellement remplis** (diff avant/après).
- Si l'identité vient de se compléter → `after(() => ensureHeaderForIntake(origin, siteId))` (réutilise `generateOnboardingHeader`).
- Pour chaque slot de section nouvellement rempli → `after(() => triggerSectionGeneration(origin, siteId, sectionKey))`.
- `triggerSectionGeneration` : passe la section en `streaming`, appelle `generateSection`, écrit `{html,status:'done'}` (ou `error`). Idempotent (ne régénère pas une section `done`/`streaming`).

Concurrence : `after()` est borné par `maxDuration` de la route ; une section tient largement. Les sections se génèrent **séquentiellement au fil des réponses** (une par tour), donc pas de rafale concurrente sur Mistral (respecte le rate-limit du compte testeur).

### 3.5 Filet de sûreté (robustesse)

En fin de chat, la route `/api/onboarding/validate` :
1. Assemble les sections `done` + header → snapshot courant (`saveDraftSnapshot(generated_html)`), pose `sites.template_id`, `step=100`.
2. **Enqueue le job `generate_site`** (existant) **uniquement si des sections manquent** (ou si rien n'a streamé).
3. `runSiteGenerationJob` étendu : si `intake.__sections` couvre tout → `assembleProgressive` (zéro Mistral, instantané) ; si des sections manquent → génère **les manquantes** via `generateSection` ; si aucune section ni header → fallback **`generateBody` complet** (comportement actuel). Cron Vercel = reprise. → **un site complet est toujours garanti.**

## 4. Parcours UI (phases)

`AiOnboardingClient.tsx` — phases : **`loading → chat → reveal → error`** (on supprime les phases `plan` et `header` séparées).

### 4.1 Phase `chat` — split-screen
- **Gauche** : le chat (inchangé dans l'esprit) + composer avec **bouton micro**.
- **Droite** : `LiveBuildPanel` — la preview qui se remplit :
  - `iframe` sur `/api/onboarding/live-preview?siteId=&n=<nonce>` (HTML assemblé des sections `done`).
  - **poll** `/api/onboarding/build-state?siteId=` toutes les ~2.5 s → liste `{key,title,status}` + `templateId` + `allDone`.
  - **Checklist de sections** (`SectionChecklist`) avec badges : ✓ emerald (fait) · ◌ violet animé (en cours) · · gray (à venir).
  - À chaque nouvelle section `done` → **bump du nonce** → l'iframe recharge → la section **apparaît** (animation fade/slide cohérente avec le motion kit).
  - **Skeleton** (réutilise le skeleton animé existant) tant que le header n'est pas prêt.
  - **Dépôt de photos** : affordance persistante (réutilise `compressImages` + `/api/onboarding/photos`) ; `assignPhotosInOrder` réapplique les photos à chaque rendu → elles se substituent **en direct** aux placeholders. Le plan photo (nombre/rôles) est affiché en indice une fois le template choisi (`imagePlanFor`).
- Mobile : la preview passe en **onglet/drawer** sous le chat (le split-screen ne tient pas) — bascule « Discussion / Aperçu ».

### 4.2 Phase `reveal` — le pic
- Déclenchée quand `allDone` (toutes sections `done`). Si le client finit le chat avant que tout soit `done` : écran d'attente **narré** (réutilise le pattern `GenerationWatcher`, messages vivants « je mets en page vos services… » + barre) → bascule auto au reveal quand `allDone`. **Jamais** un spinner nu.
- Preview **plein écran** du site complet + **confettis** (lib légère `canvas-confetti` ou burst CSS maison — au choix de l'implémenteur, gracieux si absent).
- CTA primaire **« Publier mon site »** → `PaywallModal` (inchangé). Secondaire **« Voir mon tableau de bord »** → `/dashboard`.
- Copie : « Votre site est prêt 🎉 » (possession + célébration, brand voice).

### 4.3 Voix
- Bouton micro dans le composer → `MicButton` : `MediaRecorder` capture l'audio (webm/opus), POST multipart `/api/onboarding/transcribe` → texte → **remplit le `textarea`** (le client relit puis envoie ; on n'auto-envoie pas).
- États : idle / enregistrement (pulsation rouge) / transcription (spinner) / erreur (toast discret, fallback clavier).
- Permission micro refusée → bouton masqué/désactivé, le clavier reste.

## 5. Endpoints

| Route | Méthode | Rôle |
|---|---|---|
| `/api/onboarding/ai/next` | POST | **(modifié)** chat turn + détecte slots nouvellement remplis → `after()` header/section |
| `/api/onboarding/live-preview` | GET | **(nouveau)** HTML assemblé (header + sections `done` + motion + photos), owner-gated, `noindex`, `no-store` |
| `/api/onboarding/build-state` | GET | **(nouveau)** `{ templateId, sections:[{key,title,status}], allDone }`, owner-gated |
| `/api/onboarding/validate` | POST | **(modifié)** assemble final + snapshot + step=100 + enqueue job SI sections manquantes ; renvoie `{ ok, redirect? }` ou bascule reveal côté client |
| `/api/onboarding/transcribe` | POST | **(nouveau)** audio (multipart) → `{ text }` via Whisper, owner-gated |
| `/api/generation/run` | POST | **(inchangé)** worker / cron — `runSiteGenerationJob` étendu (sections manquantes) |
| `/api/onboarding/photos` | POST | **(inchangé)** upload photos |

Sécurité : toutes owner-gated via `userOwnsSite`. `transcribe` limite la taille audio (≤ ~10 Mo) et la durée.

## 6. Modèle de données

Aucune migration : tout transite par `site_onboarding.intake` (JSONB) en clés `__`-préfixées (`__sections`, `__sectionPlan`, `__headerHtml` existant). Snapshots via `site_content.generated_html` (migration 0021 déjà en prod). Jobs `generate_site` (0022 déjà en prod). `version` global au site (`nextSiteVersion`, déjà corrigé).

## 7. Risques & mitigations

1. **Incohérence visuelle inter-sections** (le gros appel garantissait le rythme ; des appels isolés peuvent jurer). → `priorSectionsContext` (classes/bg des sections précédentes) + directive d'alternance dans `SYSTEM_SECTION` + le header fixe la grammaire (classes/couleurs/typo). Filet : le job peut régénérer le corps en bloc.
2. **Coût/latence Mistral** (5 petits appels vs 1 gros). → petits appels = `max_tokens` modéré, plus rapides et plus robustes (moins de troncature/429) ; ils sont étalés sur le temps de réponse du client (pas en rafale).
3. **`after()` non garanti** (échec silencieux). → état `error` détecté au poll + filet job/cron en fin de chat. Le site est toujours complété.
4. **Changement de style en cours de route** (« essayer un autre style ») → invalide header + sections (le CSS change). → reset `__sections` au changement de template ; régénère le header puis re-planifie les sections déjà couvertes.
5. **Whisper sans clé** (`OPENAI_API_KEY` absente) → micro masqué proprement, clavier inchangé (dégradation gracieuse, jamais bloquant).
6. **Rate-limit du compte testeur** → génération séquentielle (une section par tour), pas de fan-out.

## 8. Nouveaux fichiers / fichiers modifiés

**Nouveaux :**
- `lib/onboarding-sections.ts` — plan de sections, `sectionPlanForIntake`, `triggerSectionGeneration`, `buildStateForSite`, `ensureHeaderForIntake` (wrapper), `assembleProgressiveSnapshot`.
- `lib/voice/transcribe.ts` — `transcribeAudio(blob): Promise<{text}>` (Whisper OpenAI, swappable Voxtral).
- `app/api/onboarding/live-preview/route.ts`
- `app/api/onboarding/build-state/route.ts`
- `app/api/onboarding/transcribe/route.ts`
- `components/onboarding/LiveBuildPanel.tsx`
- `components/onboarding/SectionChecklist.tsx`
- `components/onboarding/MicButton.tsx`
- `components/onboarding/RevealCelebration.tsx`

**Modifiés :**
- `lib/design-system-gen.ts` — `SYSTEM_SECTION`, `generateSection`, `assembleProgressive` (assembleSite délègue).
- `lib/onboarding-ai.ts` — réordonner `SOCLE` (identité d'abord), durcir « couvre le 1er manquant », exposer un mapping slot→section.
- `lib/onboarding.ts` — `runSiteGenerationJob` étendu (sections manquantes / assemble), reset sections au changement de template.
- `app/api/onboarding/ai/next/route.ts` — diff slots + `after()` header/section.
- `app/api/onboarding/validate/route.ts` — assemble final + enqueue conditionnel.
- `app/onboarding/AiOnboardingClient.tsx` — split-screen, phases `chat`/`reveal`, micro, suppression `plan`/`header`.

**Env :** `OPENAI_API_KEY` (Whisper) — optionnel (micro dégradé si absent).

## 9. Vérification

1. **Identité → header** : Q1 (métier + ambiance) → header fidèle à la DA < 20 s dans le panneau droit.
2. **Sections** : chaque réponse suivante fait **pop-in** la section correspondante ; checklist à jour (✓/◌/·).
3. **Photos live** : déposer des photos remplace les placeholders **sans** régénérer.
4. **Reveal** : fin du chat → site complet plein écran + confettis **avant** paywall ; « Publier » ouvre le paywall.
5. **Latence absorbée** : en finissant le chat normalement, l'attente résiduelle au reveal est ~0 (sections déjà `done`).
6. **Filet** : couper Mistral en cours → sections `error`, le job/cron complète, le site est livré quand même.
7. **Changement de style** → sections reset, rebuild cohérent.
8. **Voix** : micro → transcription FR remplit le champ ; sans `OPENAI_API_KEY`, micro absent, clavier OK.
9. **DA** : split-screen + reveal cohérents avec le dashboard (sky/violet, rounded-xl, font-display, composants partagés).
10. `tsc` + `next build` verts. Aucune fuite de contenu démo.
