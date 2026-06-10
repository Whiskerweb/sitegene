# Audit production — dashboard, tunnels, backend (10 juin 2026)

> Commande : « une version digne de la production, fidèle à notre ADN : un assembleur de
> sites. Ici on ne code pas, on assemble des composants common/rare/epic, dirigés par une
> direction artistique proposée à l'onboarding. Mistral agence (architecte), le client
> achète des composants avec preview sur SON site. Onboarding gamifié et rapide, dashboard
> plug-and-play ultra simple, backend qui marche du premier coup. »

## Verdict global

Le produit actuel est une **transition inachevée entre deux mondes** :

- **Ancien monde (templates)** : 30+ templates modifiables, éditeur data-sg, marketplace
  de « peaux » à 15 ✦, 4 tunnels d'onboarding accumulés (outreach, self-serve v3, chat IA
  temps réel, trial 3 j). Il fait tourner les ~50 sites prod — on ne le casse pas.
- **Nouveau monde (fonderie)** : socle posé (13 composants, vibes, recettes validées,
  catalogue dashboard) mais **pas branché** : pas d'agenceur IA, pas de persistance des
  recettes, pas de rendu public, pas d'achat de composants, 1 seule vibe.

L'ADN demandé est exactement le nouveau monde. L'audit ci-dessous justifie la refonte
livrée dans ce commit (voir « Refonte livrée » en fin de document).

---

## 1. Dashboard (app/dashboard/**, ~2 285 LOC)

### Constats
- **Marketplace vs Bibliothèque = doublon structurel.** `marketplace/MarketplaceClient.tsx`
  (859 LOC, ~26 hooks, 4 modales) et `bibliotheque/LibraryTabs.tsx` (355 LOC) listent les
  mêmes objets (templates + effets) avec deux UX d'achat/activation différentes. L'utilisateur
  ne sait pas où acheter ni où gérer.
- **État client tentaculaire** : 10 useState dans MarketplaceClient (balance, owned ×2,
  modal, filtres…) = sources de vérité locales désynchronisables après achat.
- **Pas de middleware auth** : chaque RSC refait `requireUser()` ; acceptable mais aucune
  interception centralisée.
- **Incohérence de tokens** : moitié Tailwind (`text-night`, `bg-surface`), moitié CSS vars
  (`rgb(var(--m-ink))`) ; 6+ variantes d'ombres ; radius non centralisés.
- **`/dashboard/settings`** : 89 LOC pour 2 infos en lecture seule.
- L'onglet Photos de la bibliothèque est orphelin (l'usage réel est dans l'éditeur).

### Décisions
- Le dashboard devient **bimodal** : un compte dont le site principal est un site
  **assemblé** (`template_id='foundry'`) voit la nav courte (Mon site, Composants, Crédits,
  Réglages) et un accueil « sections de mon site » ; les comptes templates existants gardent
  l'UI actuelle à l'identique (zéro régression sur les 50 sites prod).
- Marketplace/Bibliothèque ne sont **pas refondues** dans ce lot (legacy en sursis) ; la page
  Composants devient la vraie boutique pour le nouveau monde.

## 2. Tunnels d'onboarding (4 parallèles)

| Tunnel | Entrée | Étapes | Verdict |
|---|---|---|---|
| Chat IA temps réel | `/onboarding` | ~21-28 échanges, 4 phases | Riche mais LONG (5-10 min) ; reste pour l'offre « sur-mesure » |
| Self-serve v3 scripté | `OnboardingClient.tsx` | ~20 clics, 6 écrans | Legacy, à fusionner/supprimer (hors lot) |
| Outreach reveal | `/start/[token]` | 1 clic + claim | Garde (prospection) |
| Trial 3 j | PaywallModal → `/api/trial/start` | 1 clic | Garde tel quel (sert le nouveau tunnel) |

### Frictions principales (audit complet en annexe des agents)
1. Deux onboardings self-serve coexistent (v3 + chat IA).
2. ~10-12 champs avant de voir quoi que ce soit ; la DA n'est jamais montrée ni choisie.
3. Paywall découvert seulement après le reveal.
4. Poll 2,5 s pour l'état de build (latence perçue).
5. Aucun moment « waouh » avant la fin.

### Décision
Nouveau tunnel **`/creer`** aligné sur l'ADN, 3 écrans, ~60-90 s :
**pitch (1 champ + nom) → choix de DA (3 cartes palette façon Stitch, reroll) → assemblage
façon ouverture de booster (les sections tombent avec leur rareté) → reveal**. Compte créé
au moment de l'assemblage (AuthGate existant), essai 3 j existant pour publier.

## 3. Backend / données

### Solide (on s'appuie dessus)
- RLS activée partout, service-role jamais côté client, secrets en env.
- Idempotence : webhooks Stripe (`webhook_events`), achats marketplace
  (`unique(user_id, item_type, item_id)`), trial (`fulfillTrialStart`).
- Modèle « 1 site / N peaux » (`site_content.template_id`, migration 0020) : un snapshot
  versionné par peau, publication atomique via `publishSnapshot`. **C'est la fondation
  parfaite pour les recettes** : un site assemblé = peau `foundry` dont le
  `content_json.__recipe` est la recette.
- Crédits en ledger append-only avec raisons typées (`item_purchase` déjà prévue).

### Manques pour l'ADN (comblés dans ce lot)
- `marketplace_items.item_type` limité à `template|effect` → migration 0023 ajoute
  `component` ; prix par rareté côté serveur (autorité `lib/marketplace.ts`).
- Aucune ligne `templates` pour un site sans template → 0023 insère le pseudo-template
  `foundry` (satisfait la FK `sites.template_id`).
- Client Mistral sans retries ni timeout → l'agenceur encapsule timeout + réparation +
  **fallback déterministe** : la génération ne peut pas échouer (« du premier coup »).
- `/s/[slug]` sert des bundles HTML statiques → les sites assemblés sont des pages React
  hydratées : nouvelle route publique `/a/[slug]`, `/s/` redirige (308) pour ces sites.
- Fonts des vibes jamais chargées (Castoro/Nunito retombaient sur Georgia) → chaque vibe
  porte son URL Google Fonts, l'Assembler injecte le `<link>` (hoisté par React 19).

### Risques relevés à traiter ensuite (hors lot, par gravité)
1. **Worker trial J+3 non déployé** → les essais ne sont jamais facturés.
2. Migrations 0014/0016/0017/0021/0022 : vérifier l'application prod (`0020` ok).
3. Aucun rate limiting sur les routes IA (coûts Mistral non bornés).
4. Concurrence sur le solde de crédits (pas de verrou pessimiste).
5. Pas de logs d'audit structurés ; CSP absente ; tests API inexistants.
6. MarketplaceClient 859 LOC à dégonfler quand le legacy sera déprécié.

---

## Refonte livrée (ce lot)

1. **DA système** : 6 vibes complètes (palette + paire typographique + radius + ambiance),
   suggestion de 3 DA selon le métier détecté dans le pitch (`lib/foundry/suggest.ts`).
2. **Agenceur Mistral** (`lib/foundry/agenceur.ts`) : choisit les composants dans le
   catalogue (manifests), réécrit les textes au métier du client, ne touche jamais à la
   structure des composants ; sortie normalisée, réparée, garantie valide (fallback).
3. **Persistance & rendu** : recette dans `site_content` (peau `foundry`), publication via
   le circuit existant, rendu public `/a/[slug]`, préview propriétaire
   `/site-preview/[siteId]` (avec `?swap=` pour voir un composant SUR son site).
4. **Tunnel `/creer`** gamifié (pitch → DA → booster → reveal).
5. **Dashboard bimodal** : accueil « Mon site » plug-and-play (sections, remplacer/retirer/
   ajouter), Composants = boutique (possession, prix par rareté, aperçu sur son site).
6. **Migration 0023** appliquée (additive, sans risque pour l'existant).
