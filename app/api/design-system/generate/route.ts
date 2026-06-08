import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isTemplateId } from "@/lib/templates";
import { generateBespokeSite } from "@/lib/design-system-gen";
import { buildSiteHtml, fetchDefaultContent } from "@/lib/site-server";

export const maxDuration = 120;

/**
 * Route de test (owner/dev) — génère un site SUR-MESURE depuis le design-system.md
 * d'un template + un brief métier, le rend via buildSiteHtml (shell bespoke) et
 * renvoie le HTML directement (text/html) pour vérification visuelle. Ne persiste
 * rien. POST { templateId, brief?, content? }.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }
  const brief = typeof body?.brief === "string" ? body.brief : undefined;
  const origin = new URL(request.url).origin;

  // Contenu de départ : fourni, sinon le contenu par défaut du template.
  const content =
    (body?.content && typeof body.content === "object"
      ? (body.content as Record<string, unknown>)
      : ((await fetchDefaultContent(origin, templateId)) as Record<string, unknown> | null)) ?? {};

  const gen = await generateBespokeSite({ origin, templateId, content, brief });
  if (!gen) {
    return NextResponse.json(
      { error: "Génération indisponible (clé Mistral, timeout ou sortie tronquée)." },
      { status: 502 },
    );
  }

  const html = await buildSiteHtml(
    origin,
    templateId,
    gen.content,
    { title: "Aperçu sur-mesure", description: "" },
    { shellHtml: gen.html },
  );
  if (!html) return NextResponse.json({ error: "Rendu impossible." }, { status: 500 });

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}
