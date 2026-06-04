# Spec — Nouveau tunnel client : lien perso → template → chatbot → dashboard verrouillé → essai 3 jours

Date : 2026-06-04
Statut : validé par Lucas

## Objectif

Remplacer le parcours « reveal agressif » (bannière de paiement + watermark sur le site en aperçu)
par un tunnel doux et impliquant : le client voit son site comme s'il était déjà à lui, choisit sa
template, affine le contenu via un chatbot scripté, atterrit sur le dashboard, et chaque action
verrouillée ouvre un popup élégant proposant un essai gratuit de 3 jours avec débit automatique
de 50 € à J+3. L'implication progressive (choix + réponses) maximise la conversion.

## Contexte existant

- Tunnel self-serve gamifié existant : `app/onboarding/` (composer → reveal multi-DA → paywall).
  Il reste en place tel quel ; ce spec ajoute un tunnel outreach parallèle.
- Bannière + watermark injectés par `injectRevealChrome()` dans `app/r/[token]/[[...path]]/route.ts`.
- Paiement : Stripe Checkout `mode: "payment"` 50 € (`LAUNCH_PRICE_CENTS`), webhook
  `checkout.session.completed` → `lib/fulfill.ts` → `goLive()`.
- Statuts site : `draft` → `revealed` → `live` ; routes `/r/<token>` (privé) et `/s/<slug>` (public).
- Intake : `site_onboarding.intake` (JSONB), questions déclaratives dans `lib/onboarding-config.ts`.
- DA : tokens ciel/glass/bleu dans `app/globals.css`, logo `components/ui/Logo.tsx`.
- Infra cron existante (outreach).

## Décisions actées

1. **Entrée** : lien personnalisé outreach. Lucas pré-remplit le contenu (photos, textes, tél,
   email…) d'un prospect via l'admin/CRM → lien unique `/start/<token>` (réutilise `prospect_codes`).
2. **Paiement** : essai gratuit 3 jours puis débit automatique de 50 € (paiement unique, pas
   d'abonnement). Carte enregistrée via Stripe Checkout `mode: "setup"`.
3. **Chatbot** : questions scriptées présentées façon chat (pas de LLM), avec « Passer »,
   filtrées par condition `askIf(intake)` — on ne redemande jamais une info déjà connue.
4. **Architecture** : tunnel linéaire en 3 étapes, chatbot AVANT le dashboard
   (lien → ① choix template → gate compte → ② chatbot → ③ dashboard).
5. **Gate compte** : juste après le choix de template (le dashboard exige l'auth).
6. **Wording popup** : prix transparent dès le popup (« 50 € après l'essai, annulable »).

## Parcours

```
Lucas (admin)                         Client
─────────────                         ──────
Pré-remplit intake + photos   →   /start/<token>
                                      ① Choix template (son contenu injecté, prénom en avant)
                                      → gate compte (existant)
                                      ② Chatbot scripté étape 2/3 (mini-aperçu live dessous)
                                      ③ Dashboard : site chargé en grand, statut « Prêt à publier »
                                          └─ toute action → popup essai 3 jours
                                              → Stripe setup (carte, 0 €)
                                              → site publié + modifs débloquées, trial_ends_at = +3 j
                                              → cron J+3 : débit off-session 50 €
```

## Composants

### A. Suppression du chrome reveal

- Retirer la bannière `#sg-bar` et le watermark `#sg-watermark` de `injectRevealChrome()`
  (`app/r/[token]/[[...path]]/route.ts`). Conserver le tracking (`reveal_opened`, etc.).
- Les aperçus `/r/<token>` deviennent 100 % propres.

### B. Pré-remplissage admin

- Depuis l'admin/CRM : formulaire (ou action sur un prospect CRM) pour saisir l'intake
  (brand, eventTypes, about, tél, email, réseaux, photos → Storage) et générer le lien
  `/start/<token>`. Réutilise `site_onboarding` + `prospect_codes` + le pipeline CRM existant.
- Le site est créé en `draft` avec `owner_user_id` null jusqu'au gate compte.

### C. Étape ① — `/start/<token>` : choix de template

- Page DA ciel/glass/bleu, logo Akyra en haut à gauche, prénom du prospect en avant
  (« Marie, votre site est prêt. Choisissez votre style. »). Aucune mention de prix.
- Galerie de templates candidates avec le contenu du prospect injecté dans chaque aperçu
  (réutilise `/api/onboarding/preview` + `candidate_template_ids`).
- Au clic sur une template : `chosen_template_id` enregistré → gate compte (composant existant,
  magic link ou email+mdp) → liaison `owner_user_id` → étape ②.
- Token réutilisable : si le client revient, il reprend où il en était.

### D. Étape ② — Chatbot scripté

- Plein écran, « étape 2/3 », bulles de chat, une question à la fois, boutons de réponse rapide
  + « Passer » systématique. Mini-aperçu du site sous le chat, mis à jour en live
  (runtime postMessage existant pour la lignée HTML ; reload debouncé pour la lignée SPA).
- Questions déclaratives dans `lib/onboarding-config.ts`, nouveau champ `askIf(intake) => boolean`
  par question. Exemples : page tarifs ? réseaux sociaux ? horaires ? ton du texte ?
  Si `contactPhone` déjà présent dans l'intake → question jamais affichée.
- Persistance au fil de l'eau : réponses dans `site_onboarding.intake`, questions passées dans
  `site_onboarding.skipped_questions` (text[]). Reprise possible après fermeture.
- Fin du chat (ou « Tout passer ») → redirection dashboard.

### E. Étape ③ — Dashboard verrouillé

- Atterrissage : le site se charge en grand (aperçu propre), statut « Prêt à publier ».
- Site en `draft` : non public, visible uniquement par son owner.
- Toute action verrouillée (Publier, modifier un texte, changer de template, demander une modif…)
  ouvre un popup glass aligné DA :
  « Essayez Akyra gratuitement 3 jours — publiez votre site maintenant.
  50 € après l'essai, annulable à tout moment. »
- CTA unique du popup → Stripe Checkout `mode: "setup"`.

### F. Essai 3 jours + débit auto

- Retour Checkout setup réussi (webhook `checkout.session.completed`, `mode=setup`) :
  - enregistrer `payment_method` + `stripe_customer_id` (colonne `profiles` existante),
  - publier le site immédiatement (`goLive()` : `live` + slug),
  - `sites.trial_ends_at = now() + interval '3 days'`, statut de facturation `trialing`,
  - débloquer les modifications.
- Bandeau discret dashboard : « Essai gratuit : X jours restants ».
- Cron J+3 (infra cron existante) : PaymentIntent off-session 50 € sur la carte enregistrée →
  ligne `payments` (`kind = 'trial_50'`, `status = 'paid'`) → fin du trial.
- Échec de débit : retries Stripe (J+3, J+4, J+5) + email de relance ; après échec final,
  site dépublié (`live` → `revealed`-équivalent, non public) et retour au paywall.
- Annulation pendant l'essai (lien dans le bandeau / settings) : site dépublié, aucune charge.

### G. Données (nouvelle migration `0015_trial_tunnel.sql`)

- `sites.trial_ends_at timestamptz`, `sites.billing_status text`
  (`none | trialing | paid | canceled | payment_failed`).
- `site_onboarding.skipped_questions text[] default '{}'`.
- `payments.kind` : ajouter `'trial_50'` au CHECK.
- Index sur `trial_ends_at` pour le cron.

## DA / UI

- Tout le tunnel réutilise les tokens de `app/globals.css` (sky, liquid-glass, brand `#2563eb`),
  fond ciel animé, cartes verre. Logo Akyra en haut à gauche sur chaque étape.
- Prénom du client mis en avant dans le header de chaque étape et du dashboard.
- Indicateur d'étape minimal (1/3, 2/3, 3/3). Visuellement minimaliste : une action par écran.
- Popup paywall : carte glass centrée, overlay flouté, un seul CTA primaire, lien secondaire
  discret « Plus tard ».

## Cas limites

- Lien ouvert sans compte puis abandonné : token réutilisable, reprise à l'étape en cours.
- Client déjà titulaire d'un compte : login au gate, liaison du site à son compte.
- Carte refusée au setup : Stripe gère, retour popup avec message doux.
- Double ouverture du lien après paiement : redirection directe dashboard.
- Trial actif + nouvelle action : aucune friction (tout est débloqué pendant l'essai).

## Hors périmètre

- Convergence avec le tunnel self-serve `/onboarding` (plus tard).
- IA conversationnelle dans le chatbot.
- Abonnement récurrent / topup (le système subscriptions existant n'est pas touché).

## Critères de succès

- Plus aucune bannière ni watermark sur les aperçus `/r/`.
- Un prospect avec contenu pré-rempli parcourt lien → template → chat → dashboard sans voir
  de prix avant le premier popup.
- Setup carte → site en ligne en < 10 s, débit 50 € exactement à J+3, idempotent.
- Aucune question du chatbot ne redemande une donnée déjà présente dans l'intake.
