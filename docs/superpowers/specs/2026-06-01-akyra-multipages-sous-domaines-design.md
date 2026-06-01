# Spec 1 — Akyra : sites multi-pages + hébergement par sous-domaine

**Date :** 2026-06-01
**Statut :** design validé en brainstorming, en attente de relecture utilisateur
**Périmètre :** Composants 0 (sous-domaines) + A (templates multi-pages). Le **Composant B (skill de recopie)** fait l'objet d'une spec séparée (Spec 2) et n'est PAS couvert ici.

---

## 1. Contexte & problème

Akyra (ex-Sitegene) vend des sites clé en main à des photographes. La cible : des photographes qui **ont déjà un site**, souvent daté, **multi-pages** (accueil + N pages séance + à propos + tarifs + contact + blog…). Exemple analysé : `aliceliloue.com` (méga-menu, ~10 pages « séance », home studio, formation, bon cadeau, galerie client, FAQ, blog).

Aujourd'hui l'architecture Akyra est **mono-page** :
- 3 templates (`alice-r`/Aurelia, `potozon`/Potozon, `target`/Target) = apps **Vite SPA autonomes**, prébuildées dans `sitegene/public/_templates/<id>/`.
- Un site publié = `index.html` du bundle + injection runtime de `window.__SITE_CONTENT__` (`lib/site-server.ts`), **sans rebuild**.
- La route `app/s/[slug]/route.ts` sert ce HTML ; la nav est **par ancres** (`navItems` → `#section`).

**Objectif de cette spec :** permettre des sites à **plusieurs vraies pages** avec **URLs distinctes**, servies sur un **sous-domaine par client** (`lea.akyra.io`, `lea.akyra.io/portfolio`), sans casser le modèle « no-rebuild ».

## 2. Décisions actées (brainstorming)

1. **Vraies pages séparées** avec URLs distinctes + nav en haut (pas d'ancres).
2. **Structure adaptative alignée sur le site source** : pas de catalogue figé. On a des **types de pages = briques**, mais le nombre et la nature des pages s'adaptent à la source. Principe : **garder un maximum de contenu**, priorité **style photo (galeries) / expertise (prestations) / tarifs**. Cure propre, jamais de perte d'info importante.
3. **Moteur de rendu = Approche 1** : routing **client** dans la SPA + route **catch-all** + **middleware** de sous-domaine ; meta par page injectées côté serveur ; **no-rebuild conservé**. Upgrade SEO possible plus tard (pré-rendu statique « snapshot »), hors périmètre.
4. **Hébergement par sous-domaine** : `lea.akyra.io` (accueil), `lea.akyra.io/portfolio` (autres pages). `slug = sous-domaine`.
5. **Les 3 templates** sont convertis au schéma multi-pages **ensemble** (schéma commun d'abord, puis conversion des 3).

## 3. Vue d'ensemble (3 composants, Spec 1 = 0 + A)

```
Visiteur → lea.akyra.io/portfolio
   │
   ▼
[Composant 0] middleware Next : host "lea.akyra.io" → slug="lea", path="/portfolio"
   │  rewrite interne
   ▼
[Composant A] route catch-all /s/[slug]/[[...path]]
   │  - lit site(slug) + content_json (v2) en base
   │  - trouve la page par path → injecte <title>/meta de CETTE page
   │  - injecte window.__SITE_CONTENT__ (tout le contenu)
   ▼
Bundle SPA template (inchangé côté hébergement) :
   mini-routeur client lit location.pathname → rend la bonne page
   Nav (menus déroulants) ← site.nav
```

---

## 4. Composant 0 — Hébergement par sous-domaine

### 4.1 DNS / TLS / Vercel
- **DNS wildcard** `*.akyra.io` → Vercel (CNAME/ALIAS selon registrar).
- **Domaine wildcard `*.akyra.io`** ajouté au projet Vercel → **TLS wildcard** automatique.
- `akyra.io` et `www.akyra.io` = la **landing / app** actuelle (inchangée).

### 4.2 Middleware (`sitegene/middleware.ts` — nouveau)
- Lit le header `host`.
- Si host = `akyra.io` / `www.akyra.io` / domaine Vercel de preview de l'app → **passe** (app normale).
- Si host = `<sub>.akyra.io` (ou `<sub>.localhost:3000` en dev) :
  - `sub = host.split('.')[0]`.
  - Si `sub` ∈ `RESERVED_SLUGS` (déjà défini dans `lib/templates.ts`) → passe / 404 app selon le cas.
  - Sinon **rewrite interne** vers `/s/<sub><path>` (ex : `/portfolio` → `/s/lea/portfolio`).
- `config.matcher` exclut `/_next`, `/api`, assets statiques, `/_templates`.
- **Dev** : sous-domaines via `lea.localhost:3000` (supporté par Chrome). Fallback dev conservé : `localhost:3000/s/<slug>/...` continue de marcher (utile pour `/admin`, debug).

### 4.3 Slug = sous-domaine
- Réutilise `normalizeSlug` / `isValidSlug` / `RESERVED_SLUGS` existants (déjà la bonne forme `[a-z0-9-]`, 2–40, anti-collision).
- À l'inscription, le slug choisi **est** le sous-domaine. Unicité déjà garantie par la colonne `slug` de `sites`.

---

## 5. Composant A — Templates multi-pages

### 5.1 Schéma de contenu v2

Le `content_json` passe de « objet plat mono-page » à :

```jsonc
{
  "version": 2,
  "site": {
    "brand": "Alice Liloue",
    "theme": { /* couleurs/accents structurels du template, locked */ },
    "nav": [
      { "label": "Accueil", "to": "/" },
      { "label": "Prestations", "children": [
        { "label": "Grossesse", "to": "/prestations/grossesse" },
        { "label": "Naissance", "to": "/prestations/naissance" }
      ]},
      { "label": "Portfolio", "to": "/portfolio" },
      { "label": "À propos", "to": "/a-propos" },
      { "label": "Contact & Tarifs", "to": "/contact" }
    ],
    "footer": { "title": "", "email": "", "socials": [], "legalLinks": [] }
  },
  "pages": [
    {
      "slug": "/",            // chemin relatif ("/" = home)
      "type": "home",         // home | portfolio | about | service | contact | generic
      "title": "Alice Liloue — Photographe maternité Douai",
      "meta": { "description": "…", "ogImage": "p1.jpg" },
      "content": { /* shape dépend de `type` (voir 5.2) */ }
    }
  ]
}
```

Règles :
- `slug` page = chemin relatif sous le sous-domaine. `"/"` = home (obligatoire, exactement une).
- `nav` pilote la barre de navigation ; `children` = menu déroulant. Les `to` doivent pointer vers un `pages[].slug` existant (ou une ancre `#…` intra-page).
- `theme` reste **locked** (géométrie/couleurs structurelles du template), comme aujourd'hui.

### 5.2 Types de pages (briques) et leur `content`

Tous réutilisent les **composants de section déjà existants** (Hero, Gallery, Services, Testimonials, FAQ, Stats, FeaturedQuote, Footer…). Chaque template implémente les **mêmes types** avec **son propre style**.

| `type` | Rôle | `content` (sections typées) |
|--------|------|------------------------------|
| `home` | Accueil | hero, aperçu prestations, avantages, citation, aperçu portfolio, témoignages, CTA |
| `portfolio` | Galeries | groupes `{ category, photos[] }` (galeries par catégorie sur une page) |
| `about` | À propos | bio, studio, stats, citation, témoignages |
| `service` | Page séance/prestation | hero, description, galerie dédiée, **tarif**, FAQ ciblée, CTA contact |
| `contact` | Contact & Tarifs | coordonnées, email, **zones géo**, **grille tarifaire**, formulaire/mailto |
| `generic` | Page libre (home studio, formation, bon cadeau…) | **pile de blocs simples** : `richText`, `imageText`, `gallery`, `cta` |

> `generic` est le seul type à mini-système de blocs (pour absorber les pages atypiques de la source sans en inventer un type dédié). Les 5 autres types ont un `content` typé fixe → faible risque de rendu.

### 5.2bis Couplage avec l'éditeur inline (data-sg-*)
Un éditeur WYSIWYG existe déjà (spec `2026-05-30-editeur-notes`, `lib/edit-runtime.ts`, `app/editor/EditorClient.tsx`) : les composants des templates portent des annotations `data-sg-path`/`data-sg-img`/`data-sg-edit`, et l'éditeur lit/écrit le `content_json` **à ces chemins**. Contraintes pour le multi-pages :
- **Préserver** ces attributs lors de tout refactor de composant ; les chemins restent **relatifs au contenu de la page** (`hero.title[0]`), sans préfixe `pages[...]`.
- **Résolution page-aware** côté éditeur : l'édit s'applique à `pages[<page courante>].content.<path>`, la page courante étant déduite de l'URL chargée dans l'iframe d'aperçu. Helpers dédiés `lib/content-path.ts` (`getAtPath`/`setAtPath`/`pageIndexForPath`).
- En v1 du multi-pages, la whitelist `__SG_FIELDS__` peut rester une **union plate** de tous les champs (l'éditeur tolère un chemin non listé → champ générique).

### 5.3 Routeur client (par template)
- Petit module `router.ts` dans chaque template : lit `window.location.pathname`, retire le préfixe éventuel (`/s/<slug>` en dev, rien en prod sous-domaine), matche `pages[].slug`, rend la page ; 404 interne → redirige vers `/`.
- Liens de nav interceptés (`history.pushState` + re-render) ; rechargement direct d'une URL profonde fonctionne aussi (le serveur sert le bundle pour tout `path`).
- `<a>` réels conservés (SEO + clic-droit/ouvrir dans un onglet).

### 5.4 Rendu serveur (Composant A côté Next)
- `app/s/[slug]/[[...path]]/route.ts` (catch-all, **remplace** l'actuel `app/s/[slug]/route.ts`) :
  - charge `site(slug, status=live)` + dernier `site_content` publié (ou défaut en dev).
  - `path` → trouve `pages[]` correspondante → calcule `<title>`, `meta.description`, `og:*`, `<link rel=canonical>` de **cette** page.
  - `buildSiteHtml()` (dans `lib/site-server.ts`) étendu : injecte `window.__SITE_CONTENT__` (tout le contenu) **et** le bloc meta de la page courante dans le `<head>`.
  - `x-robots-tag` : reste `noindex` tant qu'on n'ouvre pas l'indexation (comportement actuel conservé, à lever plus tard).
- `lib/templates.ts` : `manifest.json` v2 déclare les **types de pages supportés** + sections + rôles photo par type.

### 5.5 Rétro-compatibilité (v1 → v2)
- `lib/site-content.ts` (nouveau) : `normalizeContent(raw)` :
  - si `raw.version !== 2` (ancien format plat) → **wrappe** en une seule page `home` (`pages:[{slug:"/", type:"home", content: <ancien objet>}]`), `nav` dérivée des anciens `navItems` convertis en ancres intra-home.
  - sinon → renvoie tel quel.
- Aucune migration destructive en base : la normalisation se fait **au rendu** et à l'édition. Les sites existants continuent de fonctionner à l'identique.

### 5.6 Pipeline de génération / publication
- `scripts/cli-build-site.mjs` + `app/api/site/draft|publish` : acceptent un `content_json` **v2** (plusieurs pages), lient les images par nom de fichier **sur toutes les pages**, valident via le manifest v2 (types de pages connus, `nav.to` cohérents, exactement une page `/`).
- Le `sitegene-builder` (mono-page) reste valide : il produit du v1, normalisé en v2 au rendu. (Sa mise à jour vers le multi-pages natif = travail du Composant B / Spec 2.)

---

## 6. Découpage en unités (isolation)

| Unité | Fait quoi | Dépend de | Testable seule |
|-------|-----------|-----------|----------------|
| `middleware.ts` | host → slug + rewrite | `RESERVED_SLUGS` | oui (parse host) |
| `lib/site-content.ts` | schéma v2 + `normalizeContent` (v1→v2) | — | oui (unitaire) |
| `lib/site-server.ts` (étendu) | injecte contenu + meta page | `site-content` | oui |
| route `/s/[slug]/[[...path]]` | charge site + sert HTML | tout ci-dessus | oui (intégration) |
| `manifest.json` v2 (×3) | déclare types/pages/photos | — | validation schéma |
| routeur client (×3 templates) | pathname → page | schéma v2 | oui (unitaire) |
| renderers de types (×3 templates) | rendent home/portfolio/about/service/contact/generic | composants section existants | oui (rendu défaut) |
| Nav à déroulants (×3) | rend `site.nav` | schéma v2 | oui |

## 7. Gestion des erreurs / cas limites
- Page introuvable (path inconnu) → routeur client redirige vers `/` ; serveur renvoie quand même le bundle (200) pour éviter un flash 404.
- `slug` réservé / inexistant en prod → 404 app (comportement actuel).
- Contenu v2 invalide (pas de page `/`, `nav.to` cassé) → la validation **bloque la publication** (draft refusé avec message).
- Sous-domaine en dev : si l'environnement ne supporte pas `*.localhost`, fallback `localhost:3000/s/<slug>/<path>`.
- Échappement JSON inline conservé (`safeJson`, anti-`</script>`).

## 8. Stratégie de test
- **Unitaires** : `normalizeContent` (v1→v2, idempotence v2), parse host du middleware, routeur client (pathname → page, préfixe dev).
- **Intégration** : `/s/<slug>/<path>` rend le bon `<title>`/meta + bundle ; site v1 existant rendu inchangé.
- **Par template (×3)** : rendre chaque type de page avec `default-content.json` v2 ; nav déroulante OK ; navigation client sans rechargement ; deep-link direct OK.
- **Manuel** : `lea.localhost:3000` + `/portfolio` ; vérifier qu'aucune section vide ne laisse de bande (règle de masquage héritée).

## 9. Hors périmètre (→ Spec 2)
- Le **skill de recopie** (crawl, extraction texte+images, cure/mapping vers v2, validation, publication).
- Le pré-rendu statique « snapshot » (upgrade SEO Approche 3).
- L'éditeur dashboard multi-pages (édition page par page) — à cadrer après.

## 9bis. Addendum technique (après lecture du code)

Précisions découvertes en inspectant le code, qui priment sur les approximations ci-dessus :

- **Vraie source des templates** : `sitegene/templates/<id>/` (PAS `sites/photographers/<id>/`, qui est une lignée « sites factory » autonome séparée). Le multi-pages se construit dans `sitegene/templates/<id>/`.
- **Pont contenu existant** : `templates/<id>/src/data/content.ts` définit `DEFAULT_CONTENT` puis `C = window.__SITE_CONTENT__ ?? DEFAULT_CONTENT`, et **réexporte des noms au niveau module** (`hero`, `services`, `gallery`…). Les composants importent ces globals.
- **Conséquence multi-pages** : comme un même composant (ex. `Gallery`) doit rendre un contenu différent selon la page, on remplace les imports de globals par un **contexte React « page courante »**. Le sélecteur runtime normalise v1→v2, choisit la page via `location.pathname`, et fournit `{ site, page }`.
- **Pipeline build template** : `vite build` (`base:/_templates/<id>/`) → `dist/*` copié dans `public/_templates/<id>/` (committé ; `dist/` gitignoré). `scripts/dump-default-content.mjs` régénère `default-content.json` + copie `manifest.json`. Modifier le code template ⇒ **un rebuild ponctuel** ; publier/éditer un site ⇒ **toujours sans rebuild**.

## 10. Critères de succès
- Un `content_json` v2 à N pages se publie et s'affiche sur `<slug>.akyra.io` + `<slug>.akyra.io/<page>`, nav déroulante fonctionnelle, meta par page correctes.
- Les 3 templates rendent les 6 types de pages avec leur style propre.
- Les sites mono-page existants fonctionnent à l'identique (rétro-compat).
- Aucun rebuild requis pour publier ou modifier.
