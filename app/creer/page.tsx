import type { Metadata } from "next";
import CreerClient from "./CreerClient";

export const metadata: Metadata = {
  title: "Créer mon site · Akyra",
  description:
    "Décrivez votre activité, choisissez votre ambiance : l'architecte Akyra assemble votre site en composants premium, en moins de deux minutes.",
};

export default function CreerPage() {
  return <CreerClient />;
}
