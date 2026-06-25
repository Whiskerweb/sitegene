@AGENTS.md

# CRM Twenty — synchro Akyra → Twenty

Twenty est un CRM open-source **externe** qu'on **ne modifie pas** : on s'y connecte
par son API REST. La synchro est **à sens unique, Akyra → Twenty** (Akyra reste la
source de vérité). On y qualifie les leads, on suit la relation client, on voit qui
s'est inscrit. Le CRM maison `/admin` reste en place ; Twenty s'y ajoute.

## Modèle d'exécution : Twenty tourne EN LOCAL (pas public)

Twenty et son worker de synchro tournent **sur le PC**, pas en hébergement public.
Ça marche parce que la synchro est en 2 couches :

- **La prod (Vercel)** ne fait qu'**enfiler** les signaux dans la table `twenty_outbox`
  (dans Supabase). Elle n'appelle **jamais** Twenty directement.
- **Le worker local** lit l'outbox dans la prod Supabase (publique) et **pousse** vers
  le Twenty **local** (`http://localhost:3001`). Vercel n'a donc jamais besoin de
  joindre le localhost.

Conséquence : la synchro n'avance **que quand le PC + le worker tournent**. Ce n'est
pas grave — l'outbox **bufferise** tout dans Supabase pendant l'extinction et le
worker **rattrape le retard** au prochain lancement. Rien n'est perdu (pattern outbox).

## Quand lancer Twenty

Au début d'une session de prospection / suivi client, sur le PC :

```bash
# 1. Twenty (dans le dossier Twenty/ contenant le docker-compose.yml)
docker compose up -d            # Twenty + son Postgres + Redis, en local

# 2. Le worker de synchro (dans sitegene/)
npm run twenty:worker           # boucle, draine l'outbox toutes les 20 s
# ou : npm run twenty:worker:once  (un seul passage puis stop)
```

Interface du CRM : `http://localhost:3001`.

> Port : Akyra (`next dev`) tourne sur **3000**, Twenty sur **3001** (réglé dans le
> `docker-compose.yml` de Twenty : `ports: 3001:3000` + `SERVER_URL=http://localhost:3001`).
> Les deux cohabitent ainsi sans conflit.

## Première mise en route (one-shot)

1. `docker compose up -d` → ouvrir `http://localhost:3001`, créer compte + workspace.
2. Générer la clé API : **Settings → API & Webhooks → Create key**.
3. Renseigner les variables d'env (voir ci-dessous), `.env.local` ET Vercel.
4. Appliquer la migration `0029_twenty_sync.sql` en prod (psql pooler).
5. `npm run twenty:setup` → crée les champs custom (idempotent). Noter le stage
   « gagné » (→ `TWENTY_WON_STAGE` si différent de `WON`).
6. `DRY_RUN=1 npm run twenty:backfill` (vérif) puis `npm run twenty:backfill` (réel)
   → pousse tous les prospects/clients existants dans Twenty.

## Variables d'environnement (la config diffère prod vs local)

`TWENTY_API_KEY` n'existe pas d'avance : on la **génère dans Twenty** (étape 2 ci-dessus).

**Sur Vercel (prod)** — l'enfilage doit marcher, mais le cron ne doit PAS tenter de
joindre le localhost :
```
TWENTY_URL=http://localhost:3001     # présent (sinon enqueue n'écrit pas l'outbox)
TWENTY_API_KEY=<clé générée dans Twenty>
TWENTY_SYNC_ENABLED=0                 # neutralise le cron Vercel /api/cron/twenty-sync
```
`enqueue` ne teste que la *présence* de l'URL+clé (il n'appelle jamais Twenty) ; le
`=0` met le cron en veille (il renvoie `{skipped}`).

**Sur le PC (`.env.local`, pointé sur la MÊME Supabase que la prod)** :
```
TWENTY_URL=http://localhost:3001
TWENTY_API_KEY=<clé générée dans Twenty>
TWENTY_SYNC_ENABLED=1                 # ou absent (activé par défaut)
```

## Architecture du code (référence)

- `lib/twenty/client.ts` — client REST/Metadata (Bearer, throttle <100 req/min,
  classification d'erreurs). `pickRecord`/`pickList` = seul point à ajuster si
  l'enveloppe de réponse diffère selon la version de Twenty.
- `lib/twenty/mapping.ts` — traduction prospect → Person/Opportunity (fonctions pures,
  allowlist de propriété des champs). Tests : `lib/twenty/mapping.test.ts`.
- `lib/twenty/sync.ts` — `enqueue` (ne throw jamais), **`syncContact(email)`** (fonction
  pivot v2 : fusionne prospect + profile en UNE fiche par email), `syncProspect` (délègue),
  `appendSignalNote`, `drainOutbox`, `reconcileStaleContacts`.
- Migrations `supabase/migrations/0029_twenty_sync.sql` + `0030_twenty_users.sql`.

### v2 — CRM complet (cycle de vie)
- **Une fiche Twenty par humain, clé email** : agrège lead (catégorie/score/pipeline) +
  compte (`signupDate`, `lastConnectionAt`, abonnement/MRR, statut). Champs Person en plus :
  `akyraUserId`, `signupDate`, `lastConnectionAt`. `profiles.twenty_person_id/...` (idempotence).
- **Dernière connexion** = `auth.users.last_sign_in_at` (via `getUserById`), PAS `profiles.last_login_at`.
- **Découverte vs rafraîchissement** : `reconcileStaleContacts` ne fait que RAFRAÎCHIR les
  contacts déjà synchronisés (>6 h). Les NOUVEAUX entrent via les hooks temps réel (inscription/
  conversion/engagement) ou le **backfill explicite**. Évite d'aspirer le junk.
- **Backfill** : prospects réels = `WITH_OUTREACH=1 REQUIRE_EMAIL=1 EXCLUDE_TEST=1` ;
  inscrits = `ONLY_USERS=1` (à n'utiliser que quand il y aura de vrais inscrits — la base
  actuelle est surtout du test : emails @yopmail, paiements `cs_test_`).
- Cron `app/api/cron/twenty-sync/route.ts` (utilisé seulement si on passe à un Twenty
  hébergé ; en mode local on s'appuie sur `npm run twenty:worker`).
- Hooks `enqueue` : `app/api/track`, `app/api/email/webhook`, `lib/fulfill.ts`
  (inscription via `ensureUser` + conversion), `lib/trial.ts`, `lib/subscription.ts`
  (→ `sync_contact`, couvre les inscrits self-serve jamais prospects).

## Règles à respecter

- **Sens unique** : ne jamais faire réécrire Twenty → Akyra sans décision explicite
  (conflits de source de vérité). Les leads partent toujours d'Akyra.
- **Propriété des champs** : la synchro n'écrit QUE des champs Akyra-owned (cf. les
  allowlists de `mapping.ts`). Le travail manuel dans Twenty (qualif, notes, tâches,
  déplacements de pipeline) ne doit JAMAIS être écrasé. Seule exception : passage en
  « gagné » à la conversion (`closeWon`, idempotent).
