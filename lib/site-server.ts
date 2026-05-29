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
  const inject = `<script>window.__SITE_CONTENT__=${safeJson(content)};</script>`;
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${inject}</head>`);
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
