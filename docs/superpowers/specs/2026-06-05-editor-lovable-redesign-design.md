# Refonte de l'éditeur façon Lovable — design

**Date** : 2026-06-05
**Statut** : validé par Lucas
**Portée** : `/editor` (app Akyra/sitegene)

## Objectif

Transformer l'éditeur actuel (iframe plein écran + modale IA ponctuelle) en
interface façon Lovable : **panneau de chat persistant à gauche, aperçu à
droite**, avec :

1. prompting IA libre ou ciblé (sélection d'un élément sur l'aperçu) ;
2. galerie de composants (effets possédés) accessible sans quitter la page ;
3. mode édition manuelle (texte / photo) conservé via un bouton discret ;
4. historique de conversation **persistant en base**.

## Décisions actées

| Décision | Choix |
| --- | --- |
| Historique du chat | Persistant en base (table `ai_messages`) |
| Mobile | Bottom sheet / drawer pour le chat, aperçu plein écran |
| Galerie composants | Effets **possédés** seulement + lien vers Formules |
| Approche | Restructuration de l'éditeur existant (pas de v2 parallèle) |

## Approche retenue

**Restructuration UI de l'existant.** Toute la plomberie éprouvée est
conservée telle quelle : runtime postMessage `sg:*`, autosave page-aware,
publication, crédits, multi-pages, dictée vocale, aperçu éphémère des
composants (`previewComponent`), flux `?integrate=<effectId>`. Seule la
couche présentation change, avec au passage le découpage de
`EditorClient.tsx` (≈1 180 lignes) en sous-composants.

Alternatives écartées : éditeur v2 sur route séparée (duplication massive,
deux éditeurs à maintenir) ; panneau latéral sans persistance (ne répond pas
à la demande).

## 1. Layout desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│ ◂ Quitter   [page ▾]              🖥 📱   ✦ 12   [Publier]   │
├───────────────────┬──────────────────────────────────────────┤
│  CHAT (≈400px)    │            APERÇU (iframe)               │
│  fil de messages  │   dock flottant : [✎ Edit] [⌖ Cibler]    │
│  + cartes de      │                                          │
│  proposition      │                                          │
│  ─────────────    │                                          │
│  [chip cible ✕]   │                                          │
│  ┌─────────────┐  │                                          │
│  │ Décrivez…   │  │                                          │
│  │ 🎯 ✦ 🎤   ↑ │  │                                          │
│  └─────────────┘  │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

- **Chat à gauche** : fil persistant ; messages utilisateur, réponses IA, et
  **cartes de proposition** dans le fil (aperçu appliqué en live sur
  l'iframe + boutons Annuler / Affiner / Accepter 1 ✦ — flux crédits
  inchangé).
- **Composer** en bas du chat : textarea autosize, bouton **🎯 Cibler**
  (mode sélection sur l'iframe), bouton **✦ Composants** (galerie), micro
  (dictée existante), envoi.
- **Sélection** : 🎯 → mode `note` existant → le clic sur un élément attache
  une **chip cible** au-dessus de l'input (« Section Héro ✕ ») au lieu
  d'ouvrir une modale. Le prompt part avec ce `target`. Sans chip = prompt
  libre (`target: null`, déjà accepté par `/api/site/ai`).
- **Édition manuelle** : bouton **✎ Edit** flottant sur l'aperçu qui bascule
  le mode `edit` existant — clic texte/photo → panneau / picker actuels,
  inchangés.
- **Galerie composants** : panneau glissant au-dessus du chat (vignettes
  avec dégradé d'accent, nom, état compatible/« bientôt ») — clic = attache
  l'effet comme chip dans le composer (flux `integrate` conservé). Lien
  « Débloquer plus d'effets → Formules » en bas.

## 2. Mobile (< 1024px)

Aperçu plein écran + **bottom sheet** pour le chat : poignée en bas, le
drawer remonte sur ~60 % de l'écran, se replie automatiquement pendant la
sélection d'élément. Les modes ✎ / 🎯 restent accessibles dans le sheet.

## 3. Persistance de l'historique

- **Migration `0018_ai_messages.sql`** :
  `ai_messages (id uuid pk, site_id fk, user_id fk, role text check
  ('user'|'assistant'), kind text check ('text'|'proposal'|'commit'),
  payload jsonb, created_at timestamptz)` + RLS propriétaire (même modèle
  que les autres tables sites).
- `/api/site/ai` enrichi : écrit le message user + la réponse IA ;
  `/api/site/ai/commit` marque la proposition acceptée (`kind: 'commit'`).
- Chargement initial côté serveur dans `page.tsx` (50 derniers messages).
- Les propositions **non acceptées** restent dans le fil comme trace
  (« Proposition expirée ») ; seule la **dernière** est actionnable.

## 4. Découpage des fichiers

```
app/editor/
  page.tsx               (charge aussi l'historique)
  EditorClient.tsx       (orchestration, state partagé — réduit)
  components/
    ChatPanel.tsx        (fil + composer + chips)
    ChatMessage.tsx      (bulles + carte proposition)
    PreviewFrame.tsx     (iframe + overlays + dock ✎/🎯 + device)
    GalleryPopover.tsx   (galerie effets possédés)
    TextPanel.tsx        (modale texte existante, extraite)
    PhotoPicker.tsx      (picker photo existant, extrait)
```

La logique (autosave, postMessage, publish, dictée) reste dans des
hooks/fonctions inchangés — on déplace, on ne réécrit pas.

## 5. Erreurs & garde-fous

- Échec IA → message d'erreur **dans le fil** (plus de toast pour ce cas),
  bouton Réessayer.
- Solde insuffisant → « Accepter » désactivé + lien crédits (comme
  aujourd'hui).
- Changement de page du site → le fil reste (il est par **site**, pas par
  page) ; la chip cible est purgée.
- `/editor?integrate=<effectId>` → démarre avec l'effet en chip + mode
  sélection actif (comportement actuel préservé).

## 6. Tests

- Vitest : API historique (lecture/écriture/RLS), reducer du chat (ajout
  message, unicité de la proposition active, purge de la chip cible au
  changement de page).
- Vérification manuelle : prompt libre / prompt ciblé / intégration
  composant / édition manuelle / publication, desktop + mobile.
