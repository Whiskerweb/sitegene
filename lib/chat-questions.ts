/**
 * Questions d'affinage du chatbot (étape 2 du tunnel outreach /start).
 *
 * Chaque question est scriptée (zéro LLM) et FILTRÉE : on ne demande jamais
 * une info déjà présente dans l'intake (pré-rempli par Lucas ou répondu avant),
 * ni une question déjà passée. `askIf` exprime les dépendances entre questions
 * (ex. la fourchette de prix n'a de sens que si le client veut une page tarifs).
 * Module partagé client/serveur (même pattern que onboarding-config).
 */
import {
  PHOTO_EVENT_OPTIONS,
  type Intake,
  type QuestionOption,
} from "./onboarding-config";

export type ChatQuestionKind = "boolean" | "text" | "choice" | "multiselect";

export type ChatQuestion = {
  /** Clé dans l'intake (la réponse y est écrite). */
  key: keyof Intake & string;
  kind: ChatQuestionKind;
  /** Phrase posée dans la bulle de chat (ton concierge, tutoiement exclu). */
  label: string;
  help?: string;
  placeholder?: string;
  options?: QuestionOption[];
  /** La question n'est posée que si cette condition est vraie. */
  askIf?: (intake: Intake) => boolean;
  /** Question dont la réponse conditionne celle-ci (askIf). Tant qu'elle n'est ni répondue ni passée, on transmet la question au client, qui décide dynamiquement. */
  dependsOn?: keyof Intake & string;
};

const PHOTOGRAPHE_CHAT: ChatQuestion[] = [
  {
    key: "eventTypes",
    kind: "multiselect",
    label: "Quelles sont vos spécialités ? On ajuste les sections du site à ce que vous faites.",
    options: PHOTO_EVENT_OPTIONS,
  },
  {
    key: "wantsPricingPage",
    kind: "boolean",
    label: "Souhaitez-vous afficher une page tarifs sur votre site ?",
    help: "Beaucoup de photographes préfèrent donner leurs prix sur demande — les deux fonctionnent.",
  },
  {
    key: "priceRange",
    kind: "text",
    label: "Quelle fourchette de prix afficher ?",
    placeholder: "Ex. À partir de 250 €",
    askIf: (intake) => intake.wantsPricingPage === true,
    dependsOn: "wantsPricingPage",
  },
  {
    key: "contactPhone",
    kind: "text",
    label: "Un numéro de téléphone à afficher pour vos clients ?",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    kind: "text",
    label: "Votre compte Instagram, pour le relier au site ?",
    placeholder: "@votre.studio",
  },
  {
    key: "city",
    kind: "text",
    label: "Dans quelle ville (ou région) travaillez-vous principalement ?",
    placeholder: "Ex. Lyon et alentours",
  },
  {
    key: "about",
    kind: "text",
    label: "En une phrase : qu'est-ce qui vous rend unique ?",
    placeholder: "Lumière naturelle, émotions vraies, zéro pose forcée.",
  },
  {
    key: "tone",
    kind: "choice",
    label: "Quel ton pour les textes de votre site ?",
    options: [
      { value: "chaleureux", label: "Chaleureux" },
      { value: "premium", label: "Premium" },
      { value: "naturel", label: "Naturel" },
    ],
  },
];

const MUSICIEN_CHAT: ChatQuestion[] = [
  {
    key: "techRider",
    kind: "text",
    label: "Avez-vous une fiche technique à afficher (matériel, scène) ?",
    placeholder: "2 platines + table de mixage, retours…",
  },
  {
    key: "contactPhone",
    kind: "text",
    label: "Un numéro pour le booking ?",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    kind: "text",
    label: "Votre compte Instagram, pour le relier au site ?",
    placeholder: "@votre.nom",
  },
  {
    key: "city",
    kind: "text",
    label: "Votre ville de base ?",
    placeholder: "Ex. Paris",
  },
];

export const CHAT_QUESTIONS: Record<string, ChatQuestion[]> = {
  photographe: PHOTOGRAPHE_CHAT,
  musicien: MUSICIEN_CHAT,
};

/** Vrai si l'intake contient déjà une réponse exploitable pour cette clé. */
function isAnswered(intake: Intake, key: keyof Intake & string): boolean {
  const v = intake[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // boolean (même false = répondu)
}

/**
 * Questions restantes à poser : jamais celles déjà répondues (pré-remplissage
 * admin ou réponse précédente), jamais celles passées, et askIf respecté.
 */
export function chatQuestionsFor(
  categoryId: string,
  intake: Intake,
  skipped: string[],
): ChatQuestion[] {
  const list = CHAT_QUESTIONS[categoryId] ?? CHAT_QUESTIONS.photographe;
  return list.filter((q) => {
    if (isAnswered(intake, q.key) || skipped.includes(q.key)) return false;
    // Dépendance encore ouverte (ni répondue ni passée) : on transmet la
    // question — le client la posera ou non selon la réponse en session.
    const dependencyPending =
      q.dependsOn !== undefined &&
      !isAnswered(intake, q.dependsOn) &&
      !skipped.includes(q.dependsOn);
    if (dependencyPending) return true;
    return q.askIf ? q.askIf(intake) : true;
  });
}
