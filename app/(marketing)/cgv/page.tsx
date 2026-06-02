import type { Metadata } from "next";
import LegalPage from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "CGV · Akyra" };

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales de vente">
      <h2>Offre</h2>
      <p>
        Akyra propose un site vitrine clé en main pour 50 €/an, tout compris (hébergement, mises à
        jour et adresse vous.akyra.com). Des options en abonnement et des packs de crédits sont
        disponibles, facultatifs.
      </p>
      <h2>Paiement</h2>
      <p>Les paiements sont traités de façon sécurisée via Stripe. Renouvellement annuel.</p>
      <h2>Résiliation</h2>
      <p>Vous pouvez arrêter le renouvellement à tout moment, sans engagement.</p>
    </LegalPage>
  );
}
