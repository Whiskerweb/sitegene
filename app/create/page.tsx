import GenerationFlow from "@/components/create/GenerationFlow";

export const metadata = {
  title: "Akyra — Votre site se construit…",
  robots: { index: false, follow: false },
};

/** Tunnel de génération : chargement scénarisé → révélation du site. */
export default function CreatePage() {
  return (
    <main className="cloud-bg min-h-[100dvh]">
      <GenerationFlow />
    </main>
  );
}
