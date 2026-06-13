import { notFound } from "next/navigation";
import Assembler from "@/components/foundry/Assembler";
import { MANIFESTS } from "@/lib/foundry/manifests";
import { previewRecipe } from "@/lib/foundry/samples";

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(MANIFESTS).map((id) => ({ id }));
}

/** Aperçu autonome d'UN composant foundry (vibe warm-serif). Servi dans les iframes du catalogue. */
export default async function FoundryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!MANIFESTS[id]) notFound();
  // `fit` : hauteur naturelle du composant — la vignette du catalogue la mesure
  // et s'y ajuste (plus de grand vide sous une navbar ou un footer).
  return <Assembler recipe={previewRecipe(id)} fit />;
}
