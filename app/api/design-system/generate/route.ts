import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isTemplateId } from "@/lib/templates";
import { generateBespokeSite, type GenFacts } from "@/lib/design-system-gen";
import { buildSiteHtml } from "@/lib/site-server";

export const maxDuration = 120;

/**
 * Route de test (owner/dev) — génère un site SUR-MESURE depuis le design-system.md
 * d'un template + des FAITS client (ou un brief), le rend via buildSiteHtml (shell
 * bespoke) et renvoie le HTML directement. Ne persiste rien.
 * POST { templateId, brief?, facts? }.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
  }
  const origin = new URL(request.url).origin;
  const facts: GenFacts =
    body?.facts && typeof body.facts === "object"
      ? (body.facts as GenFacts)
      : { brief: typeof body?.brief === "string" ? body.brief : "" };

  const gen = await generateBespokeSite({ origin, templateId, facts });
  if (!gen.ok) {
    return NextResponse.json(
      { error: `Génération indisponible (${gen.reason}).` },
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
