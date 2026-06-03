import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";

export const metadata = {
  title: "Akyra — Construisons votre site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Parcours guidé self-serve. Le compte existe déjà (gate landing) ; sinon on
 * renvoie vers la home où la bulle ouvre le gate. Le brief initial est repris
 * côté client depuis sessionStorage.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/");
  return <OnboardingClient email={user.email ?? ""} />;
}
