import { getUser } from "@/lib/auth";
import { DEMO_CONFIGS, getEffect } from "@/lib/effects";
import { FX_INJECTOR, sanitizeEffectConfig } from "@/lib/effects/render";
import { defaultConfig } from "@/lib/effects/types";

/**
 * Démo RÉELLE d'un effet du catalogue : page sandbox autonome qui rend le
 * code exact de l'effet (css + htmlSnippet + js + injecteur) avec une config
 * de démonstration — c'est ce que la carte de la page Formules affiche en
 * iframe. Aucune imitation : ce que le client voit est ce qu'il achète.
 */

function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const effect = getEffect(id);
  if (!effect) return new Response("Effet inconnu.", { status: 404 });

  const config = sanitizeEffectConfig(effect, {
    ...defaultConfig(effect),
    ...(DEMO_CONFIGS[effect.id] ?? {}),
  });
  const markup = effect.htmlSnippet ? effect.htmlSnippet(config) : "";
  const body = effect.demo.html.includes("<!--FX-->")
    ? effect.demo.html.replace("<!--FX-->", () => markup)
    : effect.demo.html + markup;

  const html =
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>html,body{margin:0;padding:0}body{background:${effect.demo.bg ?? "#0b0d14"};` +
    `font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;` +
    `-webkit-font-smoothing:antialiased;overflow-x:hidden}</style>` +
    `<style id="sg-fx">${effect.css}</style>` +
    `</head><body>${body}` +
    `<script>window.__SG_FX_CFG__=${safeJson({ [effect.id]: config })};</script>` +
    (effect.js ? `<script>${effect.js}</script>` : "") +
    `<script>${FX_INJECTOR}</script>` +
    `</body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "private, max-age=300",
    },
  });
}
