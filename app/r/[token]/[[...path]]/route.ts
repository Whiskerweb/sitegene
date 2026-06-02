import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteHtml } from "@/lib/site-server";
import { normalizeContent, pageMeta } from "@/lib/site-content";

/**
 * Reveal pré-paiement : /r/<token>. Token-gated (secret). Rend le site (draft)
 * avec watermark + barre CTA "Mettre en ligne". Lecture via service_role
 * (le site n'est pas encore `live`, donc invisible aux policies publiques).
 */
function injectRevealChrome(
  html: string,
  token: string,
  embed = false,
): string {
  const wm = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200"><text x="0" y="100" transform="rotate(-24 0 100)" fill="rgba(255,255,255,0.10)" font-family="sans-serif" font-size="26" font-weight="700">APERÇU · AKYRA</text></svg>`,
  );
  // Mode `embed` (iframe du tunnel /create) : on garde le filigrane + le
  // tracking, mais PAS la barre CTA interne — le CTA de paiement vit au niveau
  // de la page /create (sinon le POST checkout redirige l'iframe, pas la page).
  const bar = embed
    ? ""
    : `
<form id="sg-bar" method="post" action="/api/checkout">
  <input type="hidden" name="token" value="${token}" />
  <span class="sg-brand"><span class="sg-dot"></span>Akyra · aperçu</span>
  <span class="sg-l">Voici <b>votre site</b>. Mettez-le en ligne en 30 secondes.</span>
  <button type="submit">Mettre en ligne — 50 €</button>
</form>`;
  // Chrome Akyra (DA sombre, tokens @theme). Couleurs en dur car le HTML est
  // une page autonome (template client) sans accès aux utilitaires Tailwind.
  const chrome = `
<style>
  #sg-watermark{position:fixed;inset:0;z-index:2147483646;pointer-events:none;background-image:url("data:image/svg+xml,${wm}");background-repeat:repeat;mix-blend-mode:overlay}
  #sg-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;display:flex;align-items:center;gap:16px;padding:14px 22px;background:rgba(8,8,12,0.86);backdrop-filter:blur(16px);border-top:1px solid rgba(245,246,250,0.10);font-family:ui-sans-serif,system-ui,sans-serif;color:#f5f6fa}
  #sg-bar .sg-brand{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#a6a8b8}
  #sg-bar .sg-dot{width:7px;height:7px;border-radius:999px;background:#8b6bff;box-shadow:0 0 10px 1px rgba(139,107,255,0.7)}
  #sg-bar .sg-l{flex:1;font-size:14px;color:#a6a8b8}
  #sg-bar .sg-l b{color:#f5f6fa;font-weight:600}
  #sg-bar button{flex-shrink:0;border:1.5px solid transparent;cursor:pointer;border-radius:999px;padding:12px 24px;font-size:15px;font-weight:700;color:#fff;background:linear-gradient(180deg,#6d4aff 0%,#5226e0 100%);box-shadow:0 12px 36px -8px rgba(109,74,255,0.55);transition:transform .15s ease,box-shadow .15s ease}
  #sg-bar button:hover{transform:translateY(-1px);box-shadow:0 16px 40px -8px rgba(109,74,255,0.7)}
  @media(max-width:640px){#sg-bar{flex-wrap:wrap;gap:10px;padding:12px 16px}#sg-bar .sg-l{flex-basis:100%;order:3;text-align:center}#sg-bar button{flex:1}}
</style>
<div id="sg-watermark"></div>${bar}
<script>
(function(){var T=${JSON.stringify(token)};
function ping(t,l){try{var b=new Blob([JSON.stringify({token:T,type:t,label:l||null})],{type:'application/json'});if(!navigator.sendBeacon('/api/track',b))throw 0;}catch(e){fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:T,type:t,label:l||null}),keepalive:true});}}
ping('reveal_opened');
document.addEventListener('click',function(e){var el=e.target&&e.target.closest&&e.target.closest('a,button');if(!el)return;if(el.closest('#sg-bar')){ping('go_live_clicked','Mettre en ligne');return;}ping('button_click',(el.textContent||'').trim().slice(0,60));},true);
})();
</script>`;
  // Fonction de remplacement : évite l'interprétation des motifs $&/$'/$$ du chrome.
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
  const embed = url.searchParams.get("embed") === "1";
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
  // /r/<token>. Contenu normalisé v2 + meta de la page ciblée par l'URL.
  const content = normalizeContent(sc?.content_json);
  const html = await buildSiteHtml(
    origin,
    site.template_id,
    content,
    pageMeta(content, pagePath),
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  // Best-effort : marquer le reveal comme vu.
  if (code.status === "sent") {
    await admin
      .from("prospect_codes")
      .update({ status: "opened", reveal_seen_at: new Date().toISOString() })
      .eq("id", code.id);
  }

  return new Response(injectRevealChrome(html, token, embed), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
