import { notFound } from "next/navigation";
import { isTemplateId } from "@/lib/templates";
import { REALISATIONS } from "@/lib/showcase";
import TemplatePreview from "@/components/marketing/TemplatePreview";

export const dynamic = "force-static";

/**
 * Aperçu public d'un template : /preview/<id>.
 * Chrome neutre + sélecteur responsive + CTA connexion (cf. TemplatePreview).
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();
  const title = REALISATIONS.find((r) => r.id === id)?.title ?? id;
  return <TemplatePreview id={id} title={title} />;
}
