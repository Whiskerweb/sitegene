import type { Metadata } from "next";
import LegalPage from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Mentions légales · Akyra" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur</h2>
      <p>Le site akyra.io est édité par Akyra. Coordonnées complètes à compléter.</p>
      <h2>Hébergement</h2>
      <p>Site hébergé par Vercel Inc. Base de données et authentification : Supabase.</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Les modèles, visuels et contenus présentés appartiennent à Akyra ou à leurs auteurs
        respectifs. Toute reproduction non autorisée est interdite.
      </p>
    </LegalPage>
  );
}
