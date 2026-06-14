# Domaines clients (sous-domaine + domaine personnalisé Pro) — Design

**Date :** 2026-06-14
**Statut :** Validé (en attente revue spec)

## Problème

Deux bugs distincts rendent l'adressage des sites clients non fonctionnel.

### Bug 1 — `arelec.akyra.io` retombe en 404 (boucle de réécriture)

- `proxy.ts:14-19` réécrit **tout** chemin d'un sous-domaine client `<slug>.akyra.io/<path>` → `/s/<slug>/<path>` (bundles statiques de templates).
- Or `arelec` est un site **fonderie** (`template_id === "foundry"`), rendu sur `/a/<slug>` (Assembler React), pas sur `/s/`.
- `app/s/[slug]/[[...path]]/route.ts:36` détecte la fonderie et renvoie un `308` vers `${origin}/a/<slug>`. Mais cette redirection revient sur `arelec.akyra.io/a/arelec`, que le proxy **re-réécrit** (le path `/a/...` n'est pas exclu) en `/s/arelec/a/arelec` → 404.
- Résultat : le site n'est joignable que sur `akyra.io/a/arelec`, jamais sur `arelec.akyra.io`.
- Le wildcard `*.akyra.io` est **déjà** ajouté et vérifié sur le projet Vercel (SSL OK). Le DNS n'est donc pas en cause — c'est purement le routing du proxy.

### Bug 2 — Le domaine personnalisé « marche dans le vent »

- `app/api/site/custom-domain/route.ts` **stocke seulement** `sites.custom_domain` en base. Aucun appel à l'API Vercel.
- Conséquence : le domaine n'est jamais ajouté au projet Vercel → **pas de certificat SSL, Vercel ne le sert pas** (confirmé : `entreprise-arelec.fr` absent des domaines du projet).
- `parseHost` (`lib/subdomain.ts`) ne reconnaît que `akyra.io`/`localhost` → un domaine custom retombe sur `{kind:"app"}` → la home, jamais le site.
- `CustomDomainCard.tsx` affiche un badge **« Branché » factice** (dès que `custom_domain` est non-nul) et un texte DNS **erroné** (« CNAME vers akyra.io »).
- Le **gate Pro existe déjà et fonctionne** : API `custom-domain/route.ts:33` (`hasActiveSubscription`) + mur d'upgrade `CustomDomainCard.tsx:27`. Rien à reconstruire côté gate, juste à conserver/renforcer.

## Décisions produit (validées)

1. **Statut « Branché » = état réel Vercel.** L'UI interroge Vercel ; « Branché ✓ » uniquement quand DNS pointé correctement **et** SSL émis. Sinon « En attente DNS… » + enregistrements exacts à poser.
2. **Apex seul.** On branche exactement le domaine saisi (ex. `entreprise-arelec.fr`). Le `www` n'est pas géré dans cette itération.

## Architecture

### Unité 1 — `lib/host-resolver.ts` (résolveur host → site) — NOUVEAU

Source unique de vérité pour « quel site, quel mode de rendu » à partir d'un Host. Logique pure + une requête indexée.

```ts
type ResolvedHost =
  | { kind: "app" }                                  // apex/www/réservé/inconnu non-custom
  | { kind: "site"; slug: string; render: "foundry" | "static" }

async function resolveHost(host, supabase): Promise<ResolvedHost>
```

- Sous-domaine `<slug>.akyra.io` → réutilise `parseHost`, puis **un** `select slug,template_id from sites where slug=? and status='live'` → `render = template_id === "foundry" ? "foundry" : "static"`. Si introuvable → `{kind:"app"}`.
- Host inconnu (ni `akyra.io`, ni `localhost`, ni `*.vercel.app`, ni apex) = **candidat domaine custom** → `select slug,template_id from sites where custom_domain=? and status='live'` → idem. Si introuvable → `{kind:"app"}`.
- Apex `akyra.io` / `www` / `*.vercel.app` → `{kind:"app"}` **sans** requête (perf).

`parseHost` reste pur et testé ; `resolveHost` l'enveloppe en ajoutant le lookup DB + le cas custom domain.

### Unité 2 — `proxy.ts` (réécriture corrigée)

- Remplace la réécriture aveugle vers `/s/` par : `resolveHost(host)`. Si `kind === "site"` → réécrit vers `/a/<slug><path>` (foundry) **ou** `/s/<slug><path>` (static).
- **Garde anti-double-réécriture** sur les deux préfixes : si le path commence déjà par `/a/` ou `/s/`, ne pas re-réécrire (corrige la boucle du 308 fonderie).
- Le lookup DB n'est fait que pour les hosts non-apex (sous-domaine ou custom) — l'app principale ne paie pas la requête.
- Le client Supabase pour le lookup réutilise l'anon key (RLS : sites `live` lisibles publiquement), créé dans le proxy.

### Unité 3 — `lib/vercel.ts` (client API Vercel Domains) — NOUVEAU

Enveloppe fine et testable des appels REST Vercel (lit `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID`).

- `addDomain(name)` → `POST /v10/projects/{id}/domains` (idempotent : si déjà présent code `domain_already_in_use`/409, on traite comme succès).
- `removeDomain(name)` → `DELETE /v9/projects/{id}/domains/{name}` (pour le changement/débranchement).
- `getDomainStatus(name)` → combine `GET …/domains/{name}` (verified + challenges) et `GET …/domains/{name}/config` (misconfigured + enregistrements recommandés). Renvoie une forme normalisée :

```ts
type DomainStatus = {
  domain: string
  verified: boolean              // propriété + DNS OK côté Vercel
  misconfigured: boolean         // DNS pas (encore) pointé
  records: { type: "A" | "CNAME" | "TXT"; name: string; value: string }[]
  // records = ce que le client doit poser chez son registrar
}
```

Si `VERCEL_TOKEN` absent (dev local) → les fonctions no-op renvoient un statut « non configuré » explicite plutôt que de planter.

### Unité 4 — `app/api/site/custom-domain/route.ts` (POST enrichi)

Inchangé : auth + **gate Pro** (`hasActiveSubscription`) + validation regex. Ajouts :

1. Récupère l'ancien `custom_domain` ; s'il change et n'est pas vide → `removeDomain(ancien)` (best-effort).
2. Si nouveau domaine non vide → `addDomain(nouveau)`.
3. Met à jour `sites.custom_domain`.
4. Réponse inclut le `DomainStatus` initial (records à poser) en plus de `{ ok, custom_domain }`.

Erreurs Vercel (domaine déjà utilisé par un autre projet, invalide) → message FR clair, et on **n'écrit pas** le domaine en base si l'ajout Vercel échoue durement.

### Unité 5 — `app/api/site/custom-domain/status/route.ts` (GET statut) — NOUVEAU

- Auth + gate Pro. Lit le `custom_domain` du site principal. Si vide → `{ connected:false }`.
- Sinon `getDomainStatus(domain)` → renvoie `DomainStatus`. Utilisé par l'UI pour le polling.

### Unité 6 — `components/settings/CustomDomainCard.tsx` (UI honnête)

- Mur d'upgrade non-abonné : **inchangé** (CTA Pro déjà bon).
- Abonné :
  - Au montage et après save : `GET …/status`, puis re-poll toutes ~5 s tant que `!verified` (s'arrête quand vérifié ou si pas de domaine).
  - Badge : `verified` → « Branché ✓ » (success) ; domaine posé mais pas vérifié → « En attente DNS… » (warning/neutral) ; sinon « Pro ».
  - Affiche un **bloc d'enregistrements DNS** (table : Type / Nom / Valeur) issu de `records`, avec bouton copier — remplace le texte « CNAME vers akyra.io ».
  - Conserve input + bouton Brancher/Mettre à jour, et un bouton Débrancher (POST domaine vide).

## Flux de données

```
Client tape entreprise-arelec.fr ──POST /api/site/custom-domain──▶ gate Pro ✓
   └─▶ vercel.addDomain() ─▶ projet Vercel (SSL en attente)
   └─▶ UPDATE sites.custom_domain
   └─▶ renvoie DomainStatus (A 76.76.21.21 …)
UI ──GET /status (poll 5s)──▶ vercel.getDomainStatus() ─▶ verified? records?
   └─▶ badge « En attente DNS » → « Branché ✓ »

Visiteur ─▶ entreprise-arelec.fr ─▶ proxy.resolveHost() ─▶ {slug:arelec, render:foundry}
   └─▶ rewrite /a/arelec  (idem pour arelec.akyra.io)
```

## Gestion d'erreurs

- `VERCEL_TOKEN` absent → API renvoie statut « non configuré », l'UI affiche un message au lieu de crasher ; le domaine est quand même stocké (dégradé, utile en dev).
- Domaine déjà pris par un autre projet Vercel → 409 traduit en message FR « déjà utilisé ailleurs ».
- Lookup `resolveHost` en échec réseau → fallback `{kind:"app"}` (le visiteur voit la home, pas une 500).
- Double-réécriture proxy → garde sur préfixes `/a/` et `/s/`.

## Tests

- `lib/host-resolver.test.ts` : sous-domaine foundry→`/a/`, sous-domaine static→`/s/`, custom domain trouvé→bon render, host inconnu→app, apex→app sans lookup (mock supabase). Étend les cas existants de `lib/subdomain.test.ts`.
- `lib/vercel.test.ts` : normalisation de `getDomainStatus` (verified/misconfigured/records) sur réponses Vercel mockées ; `addDomain` idempotent sur 409.
- Vérif manuelle : `arelec.akyra.io` rend le site ; brancher un domaine custom affiche les bons records ; badge passe à « Branché » une fois le DNS posé.

## Hors périmètre (YAGNI)

- Gestion du `www` et des redirections apex↔www.
- Renouvellement/rotation de l'IP apex Vercel (on lit toujours les records depuis `getDomainStatus`, donc auto-suivi).
- Multi-domaines par site (un seul `custom_domain`).
- Cache du lookup `resolveHost` (à ajouter seulement si la latence proxy devient un sujet).

## Pré-requis opérationnels

- `*.akyra.io`, `akyra.io` : **déjà** sur Vercel (vérifié).
- `VERCEL_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID` : **déjà** dans `.env.local` ; à ajouter aussi dans les env vars du projet Vercel (prod) pour que les routes API fonctionnent en ligne.
