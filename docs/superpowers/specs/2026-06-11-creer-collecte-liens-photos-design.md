# Collecte de liens & photos pendant l'assemblage (`/creer`)

> Spec — 2026-06-11 — branche `feat/da-engine`
> Itération 1. La Phase 2 (placement sémantique par Mistral + édition après coup) fait l'objet d'une spec séparée.

## Problème

Le tunnel `/creer` enchaîne `pitch → vibe → pack → reveal`. Pendant la phase
`pack`, la génération Mistral tourne (`/api/foundry/generate`, synchrone) et
l'utilisateur **regarde une animation sans rien faire** : c'est un temps mort.

Par ailleurs le site généré ne connaît **aucun lien réel** du client :
- les réseaux sociaux n'existent que dans les footers, avec `href` à `#` ;
- les CTA retombent sur des ancres internes (`#contact`, `#services`) ;
- aucune photo du client n'est injectée.

## Objectif

Remplacer le temps mort par une **étape de collecte utile** (liens + photos)
qui tourne **en parallèle** de la génération, puis **injecter** ce que
l'utilisateur a réellement fourni dans le site — **sans jamais afficher de
bouton vers un lien externe non renseigné**, et **sans rien rendre
obligatoire**.

## Décisions actées

- **Pré-remplissage** = défauts intelligents par métier (déterministe, zéro
  réseau) + bouton « Ajouter un lien » ouvrant un sélecteur de plateformes.
- **Photos** = upload réel, stocké sur le compte client, **plafonné à 20**.
- **Liens « Autre » placés sémantiquement par Mistral** = **Phase 2**.
- **CTA internes conservés** : on ne masque que les boutons vers des liens
  **externes** non fournis ; un CTA qui scrolle vers `#contact` reste.
- **Étape de collecte = un seul écran scrollable** (liens groupés + photos).
- **Injection déterministe** (pas d'appel Mistral), pour préserver le
  parallélisme génération ⟂ collecte.

## Flux cible

```
  vibe ──[clic "Assembler"]──┐
                             ├─► (A) /api/foundry/generate  (tâche de fond)
                             └─► (B) écran COLLECTE liens+photos
                             quand (A) finie ET (B) validée :
                                 /api/foundry/links (fusion déterministe)
                                          └─► reveal
```

1. Le clic « Assembler » lance le `fetch` de génération **en arrière-plan**
   (non bloquant) et bascule **immédiatement** sur l'écran de collecte.
2. L'écran affiche « Pendant qu'on assemble votre site… ajoutez vos liens et
   vos photos », avec une **barre de progression discrète** de l'assemblage.
3. Synchronisation :
   - génération finie avant la fin de la saisie → badge « ✓ Votre site est
     prêt », bouton **« Voir mon site »** actif, l'utilisateur continue ;
   - saisie finie avant la génération → **« On termine l'assemblage… »** ;
   - bouton **« Passer »** toujours disponible (rien d'obligatoire).
4. À la validation : `POST /api/foundry/links` fusionne liens+photos dans la
   recette sauvegardée, puis on passe à `reveal`.

### État client (CreerClient)

Nouvelle phase `collect` entre `vibe` et `reveal`. La phase `pack` (animation +
révélation des cartes) est **conservée** mais jouée **après** la collecte, au
moment du reveal (ou fusionnée dans la transition vers reveal — détail
d'implémentation laissé au plan). Le `STATE_KEY` sessionStorage est étendu pour
survivre au redirect OAuth :

```ts
type Collected = {
  socials: Array<{ platform: string; href: string; label?: string }>;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string; mapsUrl?: string };
  booking?: { label: string; href: string };
  photos: string[]; // URLs publiques Supabase Storage, max 20
};
```

`launchAssembly()` est scindé : il déclenche la génération **et** passe en
`collect` ; la fusion + reveal arrive dans un nouveau `finishCollect()`.

## Composant — catalogue « quel lien pour qui »

Nouveau module `lib/foundry/link-catalog.ts` (pur, testé), indexé sur les
`TradeId` existants (`detectTrade`). Pour chaque métier, la liste des champs de
liens **affichés par défaut** :

| `TradeId` | Liens par défaut |
|---|---|
| `musicien` | Spotify, Apple Music, YouTube, Instagram, TikTok, SoundCloud/Bandcamp, Deezer, billetterie |
| `photographe` | Instagram, Pinterest, Behance, prise de RDV, email, téléphone |
| `coach` / `bien-etre` | Prise de RDV, Instagram, LinkedIn, WhatsApp, YouTube, email, téléphone |
| `artisan` | Téléphone, WhatsApp, devis/email, Google Maps & avis, Facebook, Instagram |
| `restaurant` | Réservation, menu, Instagram, Google Maps, téléphone |
| `beaute` | Réservation, Instagram, téléphone, Google Maps |
| `conseil` | LinkedIn, prise de RDV, email, site, téléphone |
| `fitness` | Instagram, réservation, YouTube, WhatsApp, téléphone |
| `autre` | Instagram, Facebook, LinkedIn, email, téléphone, site |

Chaque entrée du catalogue : `{ key, platform, label, placeholder, kind }`
où `kind ∈ { social, contact, booking, link }` (pilote l'injection).

Le sous-persona (`rap`/`rock`/`contemporain`) peut affiner l'ordre mais pas la
liste (musicien couvre déjà l'essentiel).

### Bouton « + Ajouter un lien »

Ouvre la **liste complète des plateformes connues** (toutes icônes) + l'entrée
**« Autre »** (nom libre + URL). En itération 1, « Autre » est rendu dans la
rangée de liens/footer avec l'icône générique `link`. Son placement sémantique
dans le corps du site relève de la Phase 2.

### Icônes manquantes

Ajouter à `components/foundry/components/SocialIcon.tsx` : **Spotify,
WhatsApp, Google Maps, Apple Music**, + **Pinterest, Behance, SoundCloud**
(utilisées par certains métiers). `norm()` étendu en conséquence.

## Composant — injection déterministe

Nouveau module `lib/foundry/inject.ts`, fonction pure et testée :

```ts
function injectContacts(recipe: Recipe, collected: Collected): Recipe
```

Règles de mapping :

- **`socials[]`** → clé `socials` des sections footer (déjà gérée, déjà masquée
  si vide). Inclut les liens « Autre ».
- **`contact.phone | email | address`** → section `contact-block` (`phone`,
  `email`, `address`) + `topbarPhone` de la navbar si la clé existe.
- **`booking.href`** (réservation/streaming/billetterie principal) → `ctaHref`
  du hero et de la `cta-banner` ; le bouton principal pointe vers le vrai lien
  au lieu d'une ancre. Le **label** du CTA reste celui rédigé par Mistral
  (option : suffixer selon `booking.label` — à trancher au plan).
- **`photos[]`** → remplissent dans l'ordre les clés image rendables des
  sections (galerie/carousel d'abord, puis image de hero, puis avatars), sans
  dépasser le nombre de slots disponibles.

La fonction **ne crée ni ne supprime de section** ; elle ne fait que remplir des
clés de contenu existantes. Elle est appliquée côté serveur dans
`/api/foundry/links` puis re-sauvegardée via `saveRecipeDraft`.

## Endpoint — `POST /api/foundry/links`

- Auth requise (même garde que `/api/foundry/generate`).
- Body : `{ siteId, collected: Collected }`.
- Vérifie que `siteId` appartient à l'utilisateur et n'est pas `live`.
- Charge la recette draft, applique `injectContacts`, re-sauvegarde.
- Réponse : `{ ok: true }`. Idempotent (réappliquer la même collecte = même
  résultat).

## Upload photos

- Endpoint `POST /api/foundry/photo` (ou réutilisation d'un upload existant —
  **à vérifier au plan**, cf. usage Storage déjà en place).
- Stockage **Supabase Storage**, chemin par compte/site.
- **Garde serveur : 20 photos max** par compte (compteur + rejet au-delà).
- Redimensionnement/compression à l'upload ; renvoie l'URL publique.
- L'UI affiche la pastille « N/20 », drag-and-drop, suppression d'une photo.

## Masquage des boutons vides (rendu)

Règle : **aucun bouton vers un lien externe non fourni**.

- Rangées de réseaux sociaux : déjà masquées si `socials.length === 0` ✅.
- Boutons « Écouter sur Spotify / Réserver / Voir le menu » : rendus
  **uniquement** si le lien correspondant existe dans le contenu.
- CTA de hero scrollant vers une ancre interne (`#contact`…) : **conservés**.

L'essentiel des composants tombe déjà sur des ancres internes ; le travail de
rendu se limite à : (a) ne pas afficher un bouton externe sans href, (b)
brancher `booking.href` sur les `ctaHref` concernés.

## Périmètre

**Itération 1 (cette spec)**
- Phase `collect` en parallèle de la génération (CreerClient).
- `lib/foundry/link-catalog.ts` (catalogue par métier) + tests.
- Bouton « Ajouter un lien » (plateformes connues + « Autre » basique).
- Icônes manquantes dans `SocialIcon`.
- Upload photos (max 20) + stockage compte.
- `lib/foundry/inject.ts` + tests.
- `POST /api/foundry/links` + (`/api/foundry/photo` si pas d'existant).
- Masquage des boutons externes vides + branchement `booking.href`.

**Phase 2 (spec séparée)**
- Placement *sémantique* par Mistral des liens « Autre » nommés dans le corps
  des sections.
- Ajout/retrait/édition des liens & photos après coup depuis le dashboard.

## Risques / points ouverts (à lever au plan)

- Bucket Supabase Storage existant à confirmer (réutiliser vs créer).
- Compression d'image côté client (navigateur) vs côté serveur.
- Détail de transition `collect → pack → reveal` (l'animation booster reste
  agréable ; la jouer après la collecte ou la raccourcir).
- Suffixe éventuel du label de CTA selon `booking.label`.
