import { notFound, redirect } from "next/navigation";
import { loadStartState } from "@/lib/start-tunnel";
import { getUser } from "@/lib/auth";
import StartClient from "./StartClient";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/**
 * Étape 1/3 du tunnel outreach : choix de la template avec le contenu du
 * prospect déjà injecté. Public mais token-gated ; jamais indexé.
 */
export default async function StartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await loadStartState(token);
  if (!state) notFound();

  const user = await getUser();
  // Déjà revendiqué + finalisé par ce compte → direction la suite du tunnel.
  if (user && state.ownerUserId === user.id && state.chosenTemplateId) {
    redirect("/onboarding/chat");
  }

  return (
    <StartClient
      token={token}
      firstName={state.firstName}
      candidateTemplateIds={state.candidateTemplateIds}
      isAuthed={Boolean(user)}
    />
  );
}
