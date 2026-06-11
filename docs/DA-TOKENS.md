# Tokens de DA — rôles STRICTS (à respecter dans tous les composants)

Chaque token de couleur a **un seul rôle**. Le mélanger (ex. colorer un texte
avec `--c-accent2`) fait que changer une couleur de la charte en repeint d'autres
au hasard — c'est le bug à éviter. Règles ci-dessous, non négociables.

| Token | Libellé client | Rôle UNIQUE | Ne JAMAIS l'utiliser pour |
|---|---|---|---|
| `--c-surface` | Fond | Arrière-plan des pages/sections | du texte |
| `--c-card` | Cartes | Fond des encarts / blocs | du texte |
| `--c-ink` | Texte | Titres & paragraphes (couleur de texte forte) | un grand fond derrière du texte clair |
| `--c-muted` | Texte doux | Légendes, sous-titres, métadonnées | un titre principal |
| `--c-accent` | Accent | **Boutons, liens**, 1 mot/chiffre en highlight, pré-titres | un grand fond derrière du texte, du texte de paragraphe |
| `--c-accent2` | Accent 2 | **Petites touches déco UNIQUEMENT** : point de pré-titre, étoile d'avis, soulignement, 2ᵉ arrêt de dégradé | un texte lisible, un titre, un fond de bouton, un grand fond |
| `--c-on-accent` | (auto) | Texte/icône **posé SUR un fond `--c-accent`** (contraste garanti) | ailleurs |

## Paires obligatoires (contraste garanti)

- **Bouton primaire / CTA** : fond `--c-accent` + texte `--c-on-accent`. JAMAIS
  texte `--c-ink`/`--c-accent2` sur un fond accent (même famille → illisible).
- **Panneau sombre** (`background: var(--c-ink)`) : texte `--c-surface` (et non
  `#fff` ni `text-white`, qui cassent en DA claire où `--c-ink` est clair).
- **Texte sur photo assombrie** : blanc/`--c-surface` selon le voile — ok.
- **Lien dans du texte** : couleur `--c-accent` (le seul cas où l'accent colore
  du texte — un lien EST une touche interactive).

## Conséquences concrètes

- Un **titre** ou un **paragraphe** = `--c-ink`. Une **légende** = `--c-muted`.
  Jamais `--c-accent2`.
- Un **gros chiffre** (stat) = contenu → `--c-ink` (ou `--c-accent` si on veut
  un highlight de marque assumé), jamais `--c-accent2`.
- Un **pré-titre / eyebrow** = `--c-accent` (texte) + point déco `--c-accent2`.
  C'est exactement ce que fait le primitive `Eyebrow` (la référence).
- Un **bouton** est toujours `--c-accent` + `--c-on-accent`. Si une 2ᵉ action
  existe, la rendre discrète (contour `--c-accent`, ou fond `--c-card`), pas
  `--c-accent2`.
- `--c-accent2` ne doit JAMAIS porter de texte par-dessus : c'est une touche,
  pas une surface.

## Test de cohérence (mental)

Pour chaque couleur posée, se demander : *« si le client change CE token, qu'est-ce
qui doit bouger ? »* La réponse doit correspondre au libellé client :
- changer **Accent** → seulement boutons/liens/highlights bougent ;
- changer **Accent 2** → seulement les petites touches déco bougent ;
- changer **Texte** → tous les textes ; **Fond** → tous les fonds. Rien ne doit
  déborder de sa catégorie.

> Garde automatique : `lib/foundry/no-hardcoded-colors.test.ts` interdit les
> couleurs hex solides en dur. Elle ne vérifie pas la sémantique (rôles) — c'est
> à la revue humaine + ce document de la garantir.
