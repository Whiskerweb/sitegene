import { createPublicClient } from "@/lib/supabase/public";
import { buildSiteHtml, fetchDefaultContent } from "@/lib/site-server";
import { isTemplateId } from "@/lib/templates";

/**
 * Serveur de sites clients : /s/<slug>.
 * Récupère le site `live` + son contenu publié depuis Supabase, puis sert le
 * bundle template avec le contenu injecté. En dev, /s/<templateId> rend le
 * template avec son contenu par défaut (mode démo).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origin = new URL(request.url).origin;
  const supabase = createPublicClient();

  let templateId: string | null = null;
  let content: unknown = null;

  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (site && site.template_id) {
    templateId = site.template_id;
    const { data: sc } = await supabase
      .from("site_content")
      .select("content_json, version")
      .eq("site_id", site.id)
      .eq("is_published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    content =
      sc?.content_json ?? (await fetchDefaultContent(origin, site.template_id));
  } else if (process.env.NODE_ENV !== "production" && isTemplateId(slug)) {
    templateId = slug;
    content = await fetchDefaultContent(origin, slug);
  }

  if (!templateId) {
    return new Response("Site introuvable.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const html = await buildSiteHtml(origin, templateId, content);
  if (!html) {
    return new Response("Template indisponible.", { status: 500 });
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // noindex au lancement (cf. robots global) — à ouvrir quand on indexera les sites clients.
      "x-robots-tag": "noindex",
    },
  });
}
