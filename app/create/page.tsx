import { redirect } from "next/navigation";

/**
 * Ancien tunnel de génération remplacé par le parcours d'onboarding gamifié.
 * On conserve la route pour rediriger d'éventuels liens vers /onboarding
 * (l'onboarding gère lui-même l'auth : renvoi vers la home si non connecté).
 */
export default function CreatePage() {
  redirect("/onboarding");
}
