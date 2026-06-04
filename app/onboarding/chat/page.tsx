import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadOnboarding } from "@/lib/onboarding";
import { chatQuestionsFor } from "@/lib/chat-questions";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Étape 2/3 : le chatbot d'affinage. Questions scriptées, filtrées par ce que
 * l'intake contient déjà — on ne redemande jamais une info connue.
 */
export default async function ChatPage() {
  const user = await requireUser();
  const state = await loadOnboarding(user.id);
  if (!state) redirect("/dashboard");

  const questions = chatQuestionsFor(
    state.categoryId,
    state.intake,
    state.skippedQuestions,
  );
  // Plus rien à demander → directement le dashboard.
  if (questions.length === 0) redirect("/dashboard");

  // `ChatQuestion.askIf` est une fonction → non sérialisable server→client.
  // On retire askIf avant de passer ; la dépendance (priceRange/wantsPricingPage)
  // est re-jouée côté client à partir des réponses en cours.
  const serializable = questions.map(({ askIf: _askIf, ...rest }) => rest);

  return (
    <ChatClient
      siteId={state.siteId}
      firstName={(state.intake.brand ?? "").split(" ")[0] || null}
      questions={serializable}
    />
  );
}
