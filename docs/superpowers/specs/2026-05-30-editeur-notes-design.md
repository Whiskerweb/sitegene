# Spec — Éditeur « WordPress simple » + Notes épinglées (Sitegene)

Date : 2026-05-30
Statut : design validé en brainstorming, à transformer en plan d'implémentation.

## Contexte & objectif

Le client qui a acheté son site doit pouvoir le retoucher **sans friction, façon WordPress**.
L'éditeur WYSIWYG (`/editor`) existe déjà (édition au clic via annotations `data-sg-path` /
`data-sg-img`, runtime injecté, autosave brouillon, publication contre 1 crédit). Ce spec ajoute
**deux choses** :

1. Rendre les zones modifiables **visibles en permanence** (affordances « façon WordPress »), pas
   seulement au survol.
2. Un **outil Note** : le client épingle une demande à un endroit précis du site pour les
   changements qu'il **ne peut pas faire lui-même** ; l'opérateur la reçoit avec sa **localisation
   exacte** (zéro capture d'écran).

### Frontière fonctionnelle (point central, à ne jamais confondre)

- **Édition directe (self-service, dans l'éditeur)** = **TEXTES + IMAGES uniquement**. Ce sont les
  seuls éléments qui portent un cadre éditable.
- **Note épinglée (envoyée à l'opérateur)** = tout le reste, **structurel / stylistique** : ajouter
  une **catégorie**, une **section**, changer une **couleur de fond**, la mise en page, etc. Le
  client **ne modifie jamais ces éléments lui-même** — il pose un pin + une note, et nous (opérateur
  + Claude) appliquons le changement.

## Décisions validées (brainstorming)

- **Affordances = style « B »** : chaque texte/image éditable affiche en permanence un **cadre +
  une étiquette** « TEXTE ✎ » / « PHOTO ↺ » (rendu propre, DA cloud). Toujours visible (pas
  seulement au survol).
- **Outil Note** : barre de gauche dans `/editor` avec deux outils — **✎ Modifier** (défaut) et
  **📌 Note**. En mode Note, les cadres d'édition s'estompent ; clic **n'importe où** → le pin
  **s'accroche à l'élément le plus proche** + capture sa **position**.
- **Aucune capture d'écran** : le client n'a rien à faire de plus ; seul **l'emplacement du pin**
  (élément cible + position) part au backend.
- **Vue opérateur** : le **site live** du client + **pins superposés** à leur position, toujours à
  jour (re-render live, pas de screenshot stocké).
- **Crédits** : édition self-service = **1 crédit à la publication** (`edit_publish`, déjà en
  place) ; note traitée = **1 crédit à la résolution** (`note_spend`, déjà en place). Montants
  ajustables, non bloquants.

## Composant 1 — Affordances permanentes (mode Édition)

Modifier le runtime d'édition (`lib/edit-runtime.ts`) : au lieu du seul contour au survol, dessiner
en permanence pour chaque `[data-sg-path]` (texte) et `[data-sg-img]` (image) :

- un **cadre** discret mais visible (liseré bleu cloud) ;
- une **petite étiquette** d'angle : « TEXTE ✎ » pour le texte, « PHOTO ↺ » pour l'image.

Comportement de clic inchangé (texte = édition inline / popover ; image = sélecteur de fichier).
Le rendu doit rester lisible sur fonds clairs ET sombres (les 3 templates) → cadre + étiquette à
contraste géré (halo/ombre). Respecte `prefers-reduced-motion`. **Seuls** les éléments annotés
(textes + images) reçoivent une affordance — rien sur les fonds, sections, couleurs.

## Composant 2 — Outil Note (mode Note)

### Barre de gauche (`/editor`, `EditorClient.tsx`)
- Deux boutons d'outil : **✎ Modifier** (actif par défaut) et **📌 Note**.
- Sous les outils, liste « **Mes notes (N)** » : chaque note placée, son libellé de cible et son
  statut (En attente / Claude travaille… / Appliqué), cohérent avec `lib/ui/status.ts`.

### Pose d'un pin
1. L'utilisateur active **📌 Note**. Les cadres d'édition (Composant 1) s'estompent ; le curseur
   devient un pin ; un bandeau « Cliquez sur le site pour poser une note » s'affiche.
2. **Clic** sur le site (dans l'iframe). Le **runtime** (mode note) calcule la **cible** :
   - `path` = `data-sg-path`/`data-sg-img` de l'élément cliqué **s'il en a un** ;
   - sinon, un **sélecteur CSS robuste** de l'élément le plus proche (chemin `tag:nth-of-type`
     jusqu'à un ancêtre stable) ;
   - un **libellé lisible** : type d'élément + texte court à proximité (ex. « bouton « Réserver » »,
     « photo hero », « fond de section Services ») ;
   - la **position relative** `xPct` / `yPct` = position du clic ÷ taille totale du document
     (`scrollWidth`/`scrollHeight`), pour survivre aux changements de layout.
   Le runtime renvoie au parent `postMessage({type:'sg:note', target:{path?,cssSelector,label,xPct,yPct}, rect})`.
3. Le parent ouvre une **bulle** ancrée au pin avec un champ libre « Décrivez votre demande… » +
   **Envoyer** / Annuler.
4. À l'envoi : `POST /api/notes` ; le pin reste affiché et apparaît dans « Mes notes ».

### Données envoyées
`POST /api/notes` (existant) accepte désormais un champ `selector` :
```
{ siteId, message, selector: { path?: string, cssSelector: string, label: string, xPct: number, yPct: number } }
```
Stocké tel quel dans `notes.selector` (colonne `jsonb` **déjà présente** — migration 0001). Aucune
nouvelle colonne, **aucune capture d'écran** (`screenshot_path` reste null).

## Composant 3 — Vue opérateur (`/admin/notes`)

L'opérateur n'est pas propriétaire du site → on ne passe PAS par `/api/preview` (owner-gated). On
iframe le **site public live `/s/{slug}`** (même origine, pas d'auth requise). Pour un client donné :
- **Le site live** dans une iframe `/s/{slug}`.
- **Overlay de pins numérotés** dessiné **dans la page opérateur** (pas d'injection dans `/s/`) : la
  page lit `iframe.contentDocument` (same-origin autorisé) → `querySelector(cssSelector)` ou
  `[data-sg-path="…"]`/`[data-sg-img="…"]` → `getBoundingClientRect()` → place le pin par-dessus
  l'iframe. Si l'élément est introuvable, fallback sur `xPct`/`yPct` × taille de l'iframe. Pins
  toujours à jour (le site est re-rendu live).
- **Panneau latéral** : une carte par note = **cible** (`label`) + **demande** (`message`) + statut.
  Actions alignées sur le flux existant : **Approuver** (`POST /api/operator/notes/approve` → crée
  un job → worker Claude applique → nouvelle version + débite **1 crédit** `note_spend` à la
  résolution) et **Refuser**. Cliquer une carte met en surbrillance son pin (et inversement).
- Pas de nouvel éditeur opérateur : la correction passe par le worker/Claude comme aujourd'hui.

## Modèle de données

Aucune migration. On réutilise :
- `notes.selector` (jsonb) → `{ path?, cssSelector, label, xPct, yPct }`.
- `notes.message`, `notes.status` (`open|in_progress|done|rejected`), `notes.resulting_content_version`.
- `notes.screenshot_path` → reste **null** (pas de capture).

## Crédits

- **Édition texte/image** : gratuit en brouillon, **1 crédit à la publication** (`edit_publish`).
- **Note (structurel/style)** : **1 crédit à la résolution** par l'opérateur (`note_spend`).

## Fichiers touchés

- `lib/edit-runtime.ts` — affordances permanentes (cadres + étiquettes TEXTE/PHOTO) ; **mode note**
  (curseur pin, calcul cible `path`/`cssSelector`/`label`/`xPct`/`yPct`, `postMessage 'sg:note'`) ;
  un message parent→iframe pour activer/désactiver le mode et estomper les cadres.
- `app/editor/EditorClient.tsx` — barre de gauche (toggle Modifier/Note), réception `sg:note`,
  bulle de saisie ancrée, liste « Mes notes », `POST /api/notes`.
- `app/api/preview/route.ts` — passer un flag au runtime pour activer le mode note + les affordances.
- `app/api/notes/route.ts` — accepter et valider `selector` (longueurs bornées, types).
- `app/admin/notes/*` — vue visuelle : iframe du site + overlay de pins + panneau de notes +
  actions. (Composant overlay de pins réutilisable.)
- `lib/ui/status.ts` — réutilisé pour les libellés de statut de note (déjà en place).

## Cas limites

- **Pin sur élément non éditable** (fond, section, bouton) : on capture quand même `cssSelector` +
  `label` + position → l'opérateur sait quoi viser.
- **Contenu modifié après la note** : `cssSelector`/`path` peut ne plus matcher → on retombe sur
  `xPct`/`yPct` + `label` ; l'overlay affiche le pin à la position approximative avec une mention
  « élément introuvable ».
- **Iframe cross-doc** : pose de pin et overlay opérateur communiquent par `postMessage` same-origin
  (déjà le cas pour l'éditeur).

## Hors périmètre (v1)

- Capture d'écran des notes (jamais — décision produit).
- Édition self-service du structurel (sections/couleurs/catégories) — passe par note, point.
- Choix de couleur structuré dans la note (la demande reste en texte libre).
- Notifications temps réel opérateur (la note apparaît au prochain chargement de `/admin/notes`).

## Vérification (bout en bout)

1. Session client sur un site live : `/editor` → mode Modifier affiche cadres « TEXTE/PHOTO » sur
   textes+images **uniquement** (rien sur fonds/sections).
2. Outil Note → clic sur un bouton → pin posé, libellé « bouton … » correct, bulle → message →
   `POST /api/notes` 200 → note visible dans « Mes notes » avec son statut.
3. En base : `notes.selector` contient `{path?,cssSelector,label,xPct,yPct}`, `screenshot_path` null.
4. Session opérateur `/admin/notes` : iframe `/s/{slug}` + pins aux bons endroits (via
   `contentDocument`) ; panneau liste cible + demande ; clic carte ↔ surbrillance pin ;
   « Approuver » crée le job → worker applique → 1 crédit débité à la résolution.
5. Cas limite : note sur un fond de section → cible capturée ; après une modif de contenu, pin
   retombe sur la position % avec mention « introuvable ».
6. `npm run build` + `npm run lint` verts.
