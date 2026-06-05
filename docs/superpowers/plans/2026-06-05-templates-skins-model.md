# Mécanisme de templates « 1 site / N peaux » — Plan d'implémentation

> **Pour l'exécution :** tâches séquentielles, commits fréquents, `tsc --noEmit` après chaque phase.

**Objectif :** Un seul site canonique par utilisateur (1 slug, 1 statut online, 1 bibliothèque de photos). Les templates achetés sont des « peaux » stockées, chacune avec son propre instantané de contenu. Changer de peau = instantané et sans perte. Synchroniser = action IA explicite avec rapport. Publier = 1 bouton sur l'unique site.

**Architecture :**
- `sites` : 1 ligne par user. `template_id` = peau **en cours d'édition**. `slug`/`status`/`billing_status` inchangés.
- `site_content` : +colonne `template_id`. Un instantané versionné **par (site, template)**. Exactement **une** ligne `is_published=true` par site = la peau **en ligne** (peut différer de la peau éditée).
- `photos` : rattachées au site unique → suivent toutes les peaux.
- Galerie = templates distincts ayant un instantané pour ce site (+ `marketplace_items` pour les droits d'achat).

**Lignées :** SPA v2 (`pages[]`) et PLAT (data-sg plat) restent gérées par `contentForTemplate`. Le `template_id` du snapshot détermine le markup au rendu.

---

## Phase 0 — Migration 0020 (schéma + consolidation prod)

**Fichier :** `supabase/migrations/0020_site_content_template.sql`

- [ ] Ajouter `template_id text` à `site_content` (nullable).
- [ ] Backfill : `update site_content sc set template_id = s.template_id from sites s where sc.site_id = s.id and sc.template_id is null;`
- [ ] Index : `create index if not exists idx_site_content_site_tpl_ver on site_content (site_id, template_id, version desc);`
- [ ] Bloc PL/pgSQL idempotent de consolidation : pour chaque `owner_user_id` ayant >1 site,
  choisir le canonique (status='live' > is_active > plus récent) ; pour chaque autre site du même user :
  - copier son `content_json` le plus récent dans une nouvelle ligne `site_content` sous le canonique
    (`template_id` = template de l'autre, `is_published=false`, version = max+1) **si** aucun snapshot
    n'existe déjà pour ce template ;
  - `update photos set site_id = canonique where site_id = autre;`
  - garantir `marketplace_items` (user, 'template', template_autre) en upsert ;
  - `delete from sites where id = autre;`
- [ ] Garder UN seul `is_published=true` par site : sur le canonique, ne publier que le snapshot du `template_id` courant.
- [ ] Appliquer la migration en prod (db.xnjonnamprqrsqeetrtu, connexion directe).

## Phase 1 — Helper central `lib/site-content-store.ts`

- [ ] `loadEditableSnapshot(admin, siteId, templateId)` → ligne version max pour (site,template) | null.
- [ ] `loadPublishedSnapshot(admin, siteId)` → la ligne `is_published=true` (porte son `template_id`) | null.
- [ ] `saveDraftSnapshot(admin, siteId, templateId, contentJson, createdBy)` → insert/maj version max non publiée pour (site,template).
- [ ] `publishSnapshot(admin, siteId, templateId)` → `is_published=true` sur le snapshot courant de (site,template), `false` sur tous les autres du site.
- [ ] `listSiteTemplates(admin, siteId)` → template_ids distincts ayant un snapshot.
- [ ] Tests purs sur la logique de sélection version max / unicité published (lib/site-content-store.test.ts).

## Phase 2 — Endpoints peaux

- [ ] **Remplacer** `/api/site/switch` (copie verbatim) par `/api/site/template/activate` :
  `POST { templateId }` → vérifie possession (snapshot existant OU marketplace OU = template courant) ;
  si pas de snapshot → en créer un depuis le contenu par défaut ; set `sites.template_id` ; renvoie ok.
- [ ] **Sync IA** `/api/site/template/sync` : `POST { templateId }` →
  lance `applyTemplateToSite`-remap (source = peau courante, cible = templateId) et **persiste** le
  résultat comme snapshot de la cible ; renvoie un **rapport** structuré
  `{ transcribed: string[], unmatchedFromSource: string[], emptyInTarget: string[] }`.
- [ ] Étendre `lib/template-apply.ts` → `remapContentReport(...)` retournant le rapport (champs sources non placés, sections cible sans source) en plus du contenu.
- [ ] Mettre `/api/site/template` (ancien apply lourd) en alias de activate+sync ou le retirer.

## Phase 3 — Câbler les lecteurs/écrivains sur le store

- [ ] Public (`s/[slug]`, `r/[token]`) → `loadPublishedSnapshot` + rendre avec **son** `template_id`.
- [ ] Édition (`editor/page.tsx`, `api/preview`, `api/site/draft`, `api/site/ai`+commit, `api/onboarding/refine`) → `loadEditableSnapshot(site, site.template_id)` / `saveDraftSnapshot`.
- [ ] Publication (`api/site/publish`, `api/sites/golive`) → `publishSnapshot(site, site.template_id)`.
- [ ] Créations initiales (`lib/generate`, `lib/onboarding`, `lib/fulfill`, `lib/trial`) → insérer le snapshot avec `template_id`.
- [ ] `lib/primary-site.ts` : revenir au modèle 1 site (retirer la dépendance `is_active` pour la sélection ; garder rétro-compat).

## Phase 4 — Achat → snapshot (plus de site fantôme)

- [ ] `/api/marketplace/purchase` : à l'achat d'un template, créer un **snapshot par défaut** pour (site, template) au lieu d'une ligne `sites`. Renvoie `templateId`.
- [ ] Retirer la création de `sites` ajoutée précédemment.

## Phase 5 — Bibliothèque (galerie de peaux)

- [ ] `dashboard/bibliotheque/page.tsx` : onglet « Sites » → « Templates » = `listSiteTemplates` (peau courante = active, badge En ligne = peau publiée).
- [ ] `LibraryTabs.tsx` : bouton « Activer cette peau » → `activate` ; case « Synchroniser mon contenu » → `sync` + afficher le **rapport** (modale : ✅ transcrit, ⚠️ non placé, ⚠️ section cible vide).
- [ ] Aperçu = `/api/preview?templateId=` (peau ciblée) ou snapshot.

## Phase 6 — Nettoyage multi-sites

- [ ] Retirer `app/api/site/switch/route.ts` et `find-by-template` si remplacés.
- [ ] Retirer les vérifs paywall « niveau compte » devenues inutiles (1 site).
- [ ] `tsc --noEmit` global vert + commit final.
