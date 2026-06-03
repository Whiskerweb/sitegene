# Resend — emails transactionnels + moteur de prospection

Date : 2026-06-03
Statut : design validé (délégation « débrouille-toi »), à relire à froid.

## Objectif

Brancher Resend pour deux usages distincts, en isolant proprement les deux :

1. **Transactionnel** — emails système d'Akyra brandés sur `akyra.io`.
   - Emails d'**auth** (magic link / inscription) : **aucun code**, Resend déclaré
     comme **SMTP custom dans Supabase Auth** (config dashboard + DNS).
   - **Reçu / bienvenue après paiement** : envoyé depuis l'app via l'API Resend.
2. **Prospection à froid** — séquence automatisée (email initial + 2 relances)
   envoyée aux photographes déjà en base, pilotée par un **worker cron**, sur un
   **domaine d'envoi séparé** pour protéger la délivrabilité du transactionnel.

## Décisions

| Sujet | Choix |
|---|---|
| Emails d'auth | SMTP custom Supabase (Resend), pas de code applicatif |
| Transac codé | Uniquement « reçu / bienvenue après paiement » |
| Déclencheur prospection | Worker cron (poll Supabase, comme `scripts/worker.mjs`) |
| Relances | Séquence de 3 étapes : initial + relance J+3 + relance J+7 |
| Stop séquence | Reveal vu (`prospect_codes='opened'`) **ou** payé, + bounce/désinscription |
| Domaines | `noreply@akyra.io` (transac) / `go.akyra.io` (prospection) — **séparés** |
| Sourcing | Prospects déjà en base (`prospects` + `prospect_codes`) |
| Rendu templates | Builder HTML typé (layout partagé), pas de React Email — marche en worker `.mjs` et en route handler |

## Variables d'environnement (ajoutées)

```
RESEND_API_KEY=
RESEND_FROM_TRANSACTIONAL="Akyra Team <noreply@akyra.io>"
RESEND_FROM_OUTREACH="Lucas — Akyra <lucas@go.akyra.io>"
RESEND_OUTREACH_REPLY_TO=lucas@akyra.io
RESEND_WEBHOOK_SECRET=
```

## Configuration SMTP Supabase (runbook, hors code)

À saisir dans Supabase → Auth → SMTP Settings :

- Sender email : `noreply@akyra.io`
- Sender name : `Akyra Team`
- Host : `smtp.resend.com`
- Port : `465`
- **Username : `resend`** (littéral — pas « Akyra »)
- **Password : la clé API Resend `re_...`** (pas un mot de passe perso)
- Minimum interval per user : `60`

Prérequis : domaine `akyra.io` **vérifié dans Resend** (SPF + DKIM dans le DNS).

## Schéma (migration `0010_outreach.sql`)

### `public.outreach` — état de séquence (1 ligne par prospect enrôlé)

| col | type | rôle |
|---|---|---|
| id | uuid pk | |
| prospect_id | uuid fk prospects, unique | un seul enrôlement par prospect |
| status | text | `queued`/`active`/`completed`/`converted`/`engaged`/`unsubscribed`/`bounced`/`paused`/`failed` |
| step | int default 0 | nb d'emails déjà envoyés |
| max_steps | int default 3 | initial + 2 relances |
| next_run_at | timestamptz | quand envoyer la prochaine étape |
| last_sent_at | timestamptz | |
| reveal_token | text | snapshot du token `/r/{token}` injecté dans l'email |
| unsub_token | text unique | token du lien de désinscription |
| error | text | |
| created_at / updated_at | timestamptz | |

Index partiel `idx_outreach_due (next_run_at) where status in ('queued','active')`.

### `public.email_events` — journal (transac + prospection)

| col | type | rôle |
|---|---|---|
| id | uuid pk | |
| outreach_id | uuid fk null | |
| prospect_id | uuid fk null | |
| to_email | text | |
| kind | text | `outreach_step` / `receipt` |
| step | int null | |
| provider_id | text | id message Resend (corrélation webhook) |
| event | text | `sent`/`delivered`/`opened`/`clicked`/`bounced`/`complained`/`unsubscribed`/`failed` |
| meta | jsonb | |
| created_at | timestamptz | |

Index sur `provider_id` et `prospect_id`.

## Module `lib/email/`

- `client.ts` — singleton Resend (server-only) + `sendRaw()` bas niveau.
- `layout.ts` — layout HTML partagé (header logo Akyra, footer identité +
  lien désinscription pour la prospection), helper bouton.
- `templates.ts` — fonctions pures `{subject, html, text}` :
  - `receiptEmail({ firstName, dashboardUrl })`
  - `outreachEmail(step, { firstName, revealUrl, unsubUrl })` (3 variantes de copy)
- `send.ts` — haut niveau, prend un client admin Supabase en paramètre :
  - `sendReceipt(admin, { to, firstName })`
  - `sendOutreachStep(admin, outreachRow)` → envoie l'étape courante, journalise
    dans `email_events`, renvoie le `provider_id`.
- `suppress.ts` — `isSuppressed(admin, email)` (déjà désinscrit / bounce dur).

Les fonctions `send.ts` reçoivent le client admin → réutilisables par les route
handlers Next (`createAdminClient()`) **et** par le worker `.mjs` (son propre client).

## Transactionnel : reçu après paiement

Accroché dans `lib/fulfill.ts → fulfillPayment()`, juste après l'insert `payments`
(kind `initial_50`) et `grantCredits`. Enveloppé dans `try/catch` : un échec Resend
**ne bloque jamais** le fulfillment. Lien vers `${NEXT_PUBLIC_APP_URL}/dashboard`.
Idempotent par construction (fulfillPayment sort tôt si paiement déjà enregistré).

## Moteur de prospection

### Enrôlement — `scripts/outreach-enroll.mjs`
Insère une ligne `outreach` (status `queued`, `next_run_at = now()`,
`reveal_token` = token du `prospect_code` le plus récent) pour chaque prospect
éligible : a un email **et** un `prospect_code` actif (status `sent`), pas déjà enrôlé.
Skip ceux dont l'email est suppressé.

### Worker — `scripts/outreach-worker.mjs` (`--once` ou boucle)
Même pattern que `worker.mjs`. À chaque tick :
1. Sélectionne les lignes `due` : `status in ('queued','active') and next_run_at <= now()`,
   triées, **limitées à `BATCH_PER_TICK`** (warmup délivrabilité).
2. Pour chacune : **re-vérifie le stop** (prospect_code passé `opened`/`paid`/`expired`,
   ou email suppressé) → met `status` adéquat (`engaged`/`converted`/…) et skip.
3. Sinon `sendOutreachStep()`, puis :
   - `step += 1`, `last_sent_at = now()`.
   - si `step >= max_steps` → `status = 'completed'`.
   - sinon `status = 'active'`, `next_run_at = now() + FOLLOWUP_GAPS[step-1]`
     (gaps : J+3 après l'initial, J+7 = +4 j après la relance 1).
4. Throttle : pause inter-envoi + jitter ; cap quotidien `DAILY_CAP`.

Constantes en tête de fichier : `BATCH_PER_TICK`, `FOLLOWUP_GAPS=[3,4]`,
`DAILY_CAP`, `SEND_SPACING_MS`.

### Webhook Resend — `app/api/email/webhook/route.ts`
Vérifie la signature (Svix, `RESEND_WEBHOOK_SECRET`). Mappe les events Resend
(`email.delivered/opened/clicked/bounced/complained`) → `email_events`. Sur
`bounced` (dur) / `complained` → `outreach.status = 'bounced'` et suppression.
Les opens email ne stoppent **pas** la séquence (signal trop bruité) — seul le
reveal vu / paiement stoppe.

### Désinscription — `app/api/email/unsubscribe/route.ts`
`GET ?token={unsub_token}` → `outreach.status = 'unsubscribed'`, journalise,
page de confirmation simple. En-tête `List-Unsubscribe` + lien visible dans le
footer des emails de prospection (conformité B2B EU).

## Conformité cold-email (EU/B2B)

- Identité expéditeur réelle + adresse dans le footer.
- Lien de désinscription fonctionnel + en-tête `List-Unsubscribe`.
- `reply-to` = boîte réelle surveillée.
- Ciblage B2B (intérêt légitime : photographes pros), pas de B2C.

## Dépendances ajoutées

- `resend` (SDK officiel)
- `svix` (vérif signature webhook)

## Hors périmètre (YAGNI)

- UI admin d'envoi (le déclencheur est le worker cron + script d'enrôlement).
- A/B testing du copy, scoring, sourcing/scraping de nouveaux prospects.
- Emails transac autres que le reçu (reveal prêt, go-live, relance panier) —
  ajoutables plus tard via le même module.

## Plan de tests

- Unitaire : `templates.ts` (subject/html/text non vides, URLs bien injectées,
  footer + unsub présents sur outreach et absents sur receipt).
- Unitaire : calcul `next_run_at` / transitions de statut du worker (fonction pure extraite).
- Manuel : `outreach:enroll` + `outreach:worker --once` en mode dry-run (`DRY_RUN=1`
  → log au lieu d'envoyer) ; un vrai envoi de test vers une adresse perso.
