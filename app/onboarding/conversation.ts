/**
 * Script conversationnel de l'onboarding : tout ce que « Akyra » dit entre les
 * questions. Pur (aucun import React) — déterministe par index, pour que la
 * même conversation se rejoue à l'identique (pas de Math.random : un rerun ou
 * une reprise ne change pas le dialogue).
 *
 * Le ton : un concierge qui construit le site EN DIRECT avec le client — on
 * parle à quelqu'un, on ne remplit pas un questionnaire.
 */

/** Première bulle, avant la première question. */
export const INTRO_LINE =
  "Bonjour, moi c'est Akyra. Trois ou quatre questions, et je construis votre site sous vos yeux. On commence ?";

/* ----------------------------------------------------- [2.2] Métier ------ */

/** Détection ambiguë : on confirme avant de router (jamais silencieusement). */
export function metierConfirmLine(label: string): string {
  return `Vous semblez être ${label.toLowerCase()} — c'est bien ça ?`;
}

/** Aucun signal : on demande le métier directement. */
export const METIER_ASK_LINE =
  "Pour commencer : quel est votre métier ? C'est lui qui guide tout le reste.";

/** [2.3] Signal contradictoire détecté en cours de conversation. */
export function metierSwitchLine(label: string): string {
  return `Un instant — à vous lire, je vous verrais plutôt ${label.toLowerCase()}. C'est bien ça ?`;
}

/** Accusé après confirmation du métier. */
export function metierAckLine(label: string): string {
  return `Parfait — je vous prépare un site de ${label.toLowerCase()}.`;
}

/** Accusés de réception après une réponse (rotation déterministe par index). */
const ACKS = [
  "Parfait, je note ça…",
  "Très bien. Ça m'aide beaucoup…",
  "Excellent — je commence à voir votre univers…",
  "C'est noté. Je réfléchis au style qui vous irait…",
  "Super, on avance bien…",
];

/** Accusés quand le client passe une question. */
const SKIP_ACKS = [
  "Pas de souci, on pourra y revenir plus tard…",
  "D'accord, je m'en occuperai pour vous…",
];

export function ackFor(questionIndex: number, skipped: boolean): string {
  const list = skipped ? SKIP_ACKS : ACKS;
  return list[questionIndex % list.length];
}

/**
 * Phrase d'amorce affichée AVANT l'intitulé d'une question (au-dessus, plus
 * discrète). Les deux dernières questions sont théâtralisées.
 */
export function leadInFor(questionIndex: number, total: number): string | null {
  if (questionIndex === 0) return null; // l'intro joue ce rôle
  if (questionIndex === total - 1)
    return "Allez, celle-là c'est la dernière — et je vous prépare votre site.";
  if (questionIndex === total - 2) return "Encore une petite question.";
  return null;
}

/** Réflexion finale, avant la recommandation de style. */
export const FINDING_STYLE_LINES = [
  "Je compare vos réponses à nos directions artistiques…",
  "Je cherche le style qui vous ressemble…",
];

/** Bulle de présentation de la recommandation. */
export const RECOMMEND_LINE =
  "D'après ce que vous m'avez dit, je vous verrais très bien là-dessus 👇";

/** Étapes affichées sur l'écran de construction (liées aux vrais appels). */
export const BUILD_STEPS = [
  "Je réserve votre direction artistique",
  "J'installe vos photos et vos informations",
  "J'écris vos textes sur mesure",
  "Derniers réglages",
] as const;

/** Sous-titres tournants pendant l'étape longue (réécriture IA). */
export const BUILD_SUBLINES = [
  "Je choisis chaque mot pour qu'il sonne comme vous…",
  "Vos prestations, racontées simplement…",
  "Je relis tout une dernière fois…",
];

/** Bulle d'accueil du site fini. */
export const RESULT_LINE =
  "Voici votre site. Il est à vous — dites-moi si quelque chose ne va pas, je corrige.";
