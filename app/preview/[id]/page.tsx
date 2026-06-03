import { notFound } from "next/navigation";
import { TEMPLATE_IDS, isTemplateId } from "@/lib/templates";
import { REALISATIONS } from "@/lib/showcase";
import TemplatePreview from "@/components/marketing/TemplatePreview";

export const dynamic = "force-static";

/** Templates React (lignée Vite) : rendus via /s (injection du contenu). */
const REACT_TEMPLATES = new Set(["alice-r", "potozon", "target"]);

/** Source d'iframe : React → /s/<id> (injecté) ; HTML → fichier statique autonome. */
function previewSrc(id: string): string {
  return REACT_TEMPLATES.has(id) ? `/s/${id}` : `/_templates/${id}/index.html`;
}

export function generateStaticParams() {
  return TEMPLATE_IDS.map((id) => ({ id }));
}

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
  return <TemplatePreview src={previewSrc(id)} title={title} />;
}
