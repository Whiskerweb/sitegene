import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteHtml } from "@/lib/site-server";
import { contentForTemplate, metaForTemplate } from "@/lib/site-content";

/**
 * Reveal pré-paiement : /r/<token>. Token-gated (secret). Rend le site (draft)
 * SANS chrome visuel — l'aperçu est montré propre, « comme un vrai site ».
 * On ne garde que le tracking d'engagement (reveal_opened, button_click).
 */
function injectRevealTracking(html: string, token: string): string {
  const chrome = `
<script>
(function(){var T=${JSON.stringify(token)};
function ping(t,l){try{var b=new Blob([JSON.stringify({token:T,type:t,label:l||null})],{type:'application/json'});if(!navigator.sendBeacon('/api/track',b))throw 0;}catch(e){fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:T,type:t,label:l||null}),keepalive:true});}}
ping('reveal_opened');
document.addEventListener('click',function(e){var el=e.target&&e.target.closest&&e.target.closest('a,button');if(!el)return;ping('button_click',(el.textContent||'').trim().slice(0,60));},true);
})();
</script>`;
  if (html.includes("</body>")) return html.replace("</body>", () => `${chrome}</body>`);
  return html + chrome;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; path?: string[] }> },
) {
  const { token, path } = await params;
  // URL profonde : /r/<token>/portfolio → pagePath = "/portfolio".
  const pagePath = "/" + (path ?? []).join("/");
  const url = new URL(request.url);
  const origin = url.origin;
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

  // Le reveal sert la page demandée (catch-all) ; la navigation interne reste
  // gérée par le routeur client du template (SPA), agnostique au préfixe
  // /r/<token>. Contenu par lignée : v2 (SPA) ou PLAT (HTML clone-site).
  const content = contentForTemplate(sc?.content_json, site.template_id);
  const html = await buildSiteHtml(
    origin,
    site.template_id,
    content,
    metaForTemplate(content, site.template_id, pagePath),
    { pagePath, basePath: `/r/${token}` },
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  // Best-effort : marquer le reveal comme vu.
  if (code.status === "sent") {
    await admin
      .from("prospect_codes")
      .update({ status: "opened", reveal_seen_at: new Date().toISOString() })
      .eq("id", code.id);
  }

  return new Response(injectRevealTracking(html, token), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
