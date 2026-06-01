/**
 * Construit le HTML d'un site client : on récupère le shell du bundle template
 * prébuild (public/_templates/<id>/index.html) et on injecte le contenu runtime
 * via window.__SITE_CONTENT__ AVANT l'exécution du bundle (module différé).
 * Aucun rebuild : la mise en ligne et les modifs sont de simples réécritures.
 */

/** Sérialise en JSON sûr pour insertion inline (`<` échappé → pas de break-out </script>). */
function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

export async function buildSiteHtml(
  origin: string,
  templateId: string,
  content: unknown,
): Promise<string | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/index.html`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  let html = await res.text();
  // CSS personnalisé (modifications de design IA), injecté APRÈS le CSS du bundle
  // (donc en fin de <head>) pour l'emporter. Déjà validé/sanitizé à la sauvegarde.
  const css =
    content && typeof content === "object" && typeof (content as Record<string, unknown>).__css === "string"
      ? ((content as Record<string, unknown>).__css as string)
      : "";
  const cssTag = css ? `<style id="sg-custom">${css}</style>` : "";
  const inject = `<script>window.__SITE_CONTENT__=${safeJson(content)};</script>${cssTag}`;
  // Fonction de remplacement : sinon un contenu client contenant $&/$'/$$ serait
  // mal interprété par String.replace.
  if (html.includes("</head>")) {
    html = html.replace("</head>", () => `${inject}</head>`);
  } else {
    html = inject + html;
  }
  return html;
}

export async function fetchDefaultContent(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(
    `${origin}/_templates/${templateId}/default-content.json`,
    { cache: "no-store" },
  );
  return res.ok ? res.json() : null;
}

/** Manifest du template (champs editable/locked, slots photo). */
export async function fetchTemplateManifest(
  origin: string,
  templateId: string,
): Promise<unknown | null> {
  const res = await fetch(`${origin}/_templates/${templateId}/manifest.json`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}
