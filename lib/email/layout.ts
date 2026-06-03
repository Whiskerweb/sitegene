/**
 * Layout HTML partagé pour tous les emails Akyra. Table-based + styles inline
 * (contrainte des clients mail). Deux variantes de footer : transactionnel
 * (identité simple) et prospection (identité légale + lien de désinscription,
 * conformité B2B EU).
 */

const INK = "#0c0a14";
const MUTED = "#6b6878";
const BORDER = "#ececf1";

/** Logo Akyra (variante claire, fond transparent) — URL absolue pour les emails. */
export const LOGO_URL =
  process.env.AKYRA_LOGO_URL || "https://akyra.io/brand/akyra-light.png";

/** En-tête de marque : symbole + mot-marque (le texte reste si l'image est bloquée). */
export function brandHeader(): string {
  return `<tr><td style="padding:26px 32px 8px;">
      <img src="${LOGO_URL}" width="30" height="30" alt="Akyra"
           style="vertical-align:middle;display:inline-block;border:0;outline:none;text-decoration:none;">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;
            color:${INK};letter-spacing:-0.02em;vertical-align:middle;margin-left:9px;">Akyra</span>
    </td></tr>`;
}

export type EmailParts = { subject: string; html: string; text: string };

/** Échappe le HTML d'une valeur dynamique injectée dans le markup. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bouton CTA centré. */
export function button(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 8px;">
    <tr><td style="border-radius:10px;background:${INK};">
      <a href="${esc(href)}" target="_blank"
         style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;
         font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
        ${esc(label)}</a>
    </td></tr>
  </table>`;
}

export type FooterKind = "transactional" | "outreach";

const ADDRESS = "Akyra · akyra.io";

function footer(kind: FooterKind, unsubUrl?: string): string {
  const unsub =
    kind === "outreach" && unsubUrl
      ? `<p style="margin:6px 0 0;font-size:12px;color:${MUTED};">
           Vous recevez ce message car vous exercez une activité de photographe professionnel.
           <a href="${esc(unsubUrl)}" style="color:${MUTED};text-decoration:underline;">Se désinscrire</a>.
         </p>`
      : "";
  return `<tr><td style="padding:24px 32px 32px;border-top:1px solid ${BORDER};">
      <p style="margin:0;font-size:12px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">${ADDRESS}</p>
      ${unsub}
    </td></tr>`;
}

/**
 * Assemble un email complet. `bodyHtml` = contenu interne (paragraphes, bouton…).
 * `preheader` = texte d'aperçu masqué dans l'inbox.
 */
export function wrap(opts: {
  subject: string;
  preheader: string;
  bodyHtml: string;
  text: string;
  footerKind: FooterKind;
  unsubUrl?: string;
}): EmailParts {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#f5f4f8;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f4f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
             style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        ${brandHeader()}
        <tr><td style="padding:8px 32px 4px;font-family:Arial,Helvetica,sans-serif;
              font-size:15px;line-height:1.6;color:#26242e;">
          ${opts.bodyHtml}
        </td></tr>
        ${footer(opts.footerKind, opts.unsubUrl)}
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject: opts.subject, html, text: opts.text };
}
