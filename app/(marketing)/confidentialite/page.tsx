import type { Metadata } from "next";
import LegalPage from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Confidentialité · Akyra" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <p>
        Akyra collecte les informations strictement nécessaires à la création et à la gestion de
        votre site : adresse e-mail, brief, photos déposées et données de compte.
      </p>
      <h2>Utilisation</h2>
      <p>
        Vos données servent uniquement à générer, héberger et faire évoluer votre site. Elles ne
        sont jamais revendues.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données à tout
        moment. Détails de contact à compléter.
      </p>
    </LegalPage>
  );
}
