import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AiOnboardingClient from "./AiOnboardingClient";

export const metadata = {
  title: "Akyra — Construisons votre site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Parcours self-serve : onboarding conversationnel IA temps réel (questions
 * improvisées selon le métier, choix de thème adapté, génération sur-mesure).
 * Remplace l'ancien tunnel scripté (OnboardingClient, conservé pour référence).
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/");
  return <AiOnboardingClient />;
}
