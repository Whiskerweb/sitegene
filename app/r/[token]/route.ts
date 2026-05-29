import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteHtml } from "@/lib/site-server";

/**
 * Reveal pré-paiement : /r/<token>. Token-gated (secret). Rend le site (draft)
 * avec watermark + barre CTA "Mettre en ligne". Lecture via service_role
 * (le site n'est pas encore `live`, donc invisible aux policies publiques).
 */
function injectRevealChrome(html: string, token: string): string {
  const wm = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200"><text x="0" y="100" transform="rotate(-24 0 100)" fill="rgba(255,255,255,0.10)" font-family="sans-serif" font-size="26" font-weight="700">APERÇU · SITEGENE</text></svg>`,
  );
  const chrome = `
<style>
  #sg-watermark{position:fixed;inset:0;z-index:2147483646;pointer-events:none;background-image:url("data:image/svg+xml,${wm}");background-repeat:repeat;mix-blend-mode:overlay}
  #sg-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;background:rgba(8,8,12,0.82);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,0.12);font-family:ui-sans-serif,system-ui,sans-serif;color:#f5f6fa}
  #sg-bar .sg-l{font-size:14px;color:#a6a8b8}
  #sg-bar .sg-l b{color:#f5f6fa}
  #sg-bar button{border:0;cursor:pointer;border-radius:999px;padding:12px 22px;font-size:15px;font-weight:600;color:#fff;background:linear-gradient(180deg,#8b6bff,#5226e0);box-shadow:0 12px 30px -10px rgba(82,38,224,0.6)}
  @media(max-width:560px){#sg-bar{flex-direction:column;gap:10px;align-items:stretch;text-align:center}}
</style>
<div id="sg-watermark"></div>
<form id="sg-bar" method="post" action="/api/checkout">
  <input type="hidden" name="token" value="${token}" />
  <span class="sg-l">Voici <b>votre site</b>. Mettez-le en ligne en 30 secondes.</span>
  <button type="submit">Mettre en ligne — 50 €</button>
</form>`;
  if (html.includes("</body>")) return html.replace("</body>", `${chrome}</body>`);
  return html + chrome;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  const admin = createAdminClient();

  const { data: code } = await admin
    .from("prospect_codes")
    .select("id, site_id, status")
    .eq("token", token)
    .maybeSingle();

  if (!code || !code.site_id) {
    return new Response("Lien invalide ou expiré.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const { data: site } = await admin
    .from("sites")
    .select("id, template_id")
    .eq("id", code.site_id)
    .maybeSingle();
  if (!site || !site.template_id) {
    return new Response("Site introuvable.", { status: 404 });
  }

  const { data: sc } = await admin
    .from("site_content")
    .select("content_json, version")
    .eq("site_id", site.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const html = await buildSiteHtml(origin, site.template_id, sc?.content_json);
  if (!html) return new Response("Template indisponible.", { status: 500 });

  // Best-effort : marquer le reveal comme vu.
  if (code.status === "sent") {
    await admin
      .from("prospect_codes")
      .update({ status: "opened", reveal_seen_at: new Date().toISOString() })
      .eq("id", code.id);
  }

  return new Response(injectRevealChrome(html, token), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
