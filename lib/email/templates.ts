/**
 * Templates email — fonctions pures renvoyant {subject, html, text}.
 * Aucun I/O ici : testable unitairement.
 */
import { wrap, button, esc, type EmailParts } from "./layout";

const p = (s: string) => `<p style="margin:0 0 14px;">${s}</p>`;

/** Reçu / bienvenue après le paiement initial (50 €). */
export function receiptEmail(opts: {
  firstName?: string | null;
  dashboardUrl: string;
}): EmailParts {
  const hi = opts.firstName ? `Bonjour ${esc(opts.firstName)},` : "Bonjour,";
  const bodyHtml = [
    p(`<strong>${hi}</strong>`),
    p("Merci, votre paiement est confirmé — votre site Akyra est désormais le vôtre. 🎉"),
    p("Vous pouvez dès maintenant le personnaliser, le mettre en ligne et le connecter à votre domaine depuis votre espace."),
    button("Ouvrir mon espace", opts.dashboardUrl),
    p(`<span style="font-size:13px;color:#6b6878;">Une question ? Répondez simplement à cet email.</span>`),
  ].join("\n");

  const text = [
    `${opts.firstName ? `Bonjour ${opts.firstName},` : "Bonjour,"}`,
    "",
    "Merci, votre paiement est confirmé — votre site Akyra est désormais le vôtre.",
    "Personnalisez-le et mettez-le en ligne depuis votre espace :",
    opts.dashboardUrl,
    "",
    "Une question ? Répondez simplement à cet email.",
    "Akyra · akyra.io",
  ].join("\n");

  return wrap({
    subject: "Bienvenue chez Akyra — votre site est à vous",
    preheader: "Paiement confirmé. Votre site est prêt à être personnalisé.",
    bodyHtml,
    text,
    footerKind: "transactional",
  });
}

/**
 * Email de prospection à froid. `step` : 0 = initial, 1 = relance J+3,
 * 2 = relance finale J+7. Chaque variante pointe vers le reveal /r/{token}.
 */
export function outreachEmail(
  step: number,
  opts: { firstName?: string | null; revealUrl: string; unsubUrl: string },
): EmailParts {
  const name = opts.firstName ? esc(opts.firstName) : "";
  const hi = name ? `Bonjour ${name},` : "Bonjour,";

  const variants: Array<{ subject: string; preheader: string; lead: string[]; cta: string }> = [
    {
      subject: name ? `${name}, j'ai préparé un aperçu de votre site` : "Un aperçu de votre site photo",
      preheader: "Un site déjà construit avec vos photos — à voir en 30 secondes.",
      lead: [
        "Je crée des sites pour les photographes, et j'en ai préparé un pour vous — avec vos photos, déjà en ligne.",
        "Pas une maquette : un vrai site que vous pouvez voir tout de suite.",
      ],
      cta: "Voir mon site",
    },
    {
      subject: name ? `${name}, vous avez vu votre aperçu ?` : "Vous avez vu votre aperçu ?",
      preheader: "Je remonte mon précédent message — votre site vous attend.",
      lead: [
        "Je me permets de remonter mon précédent message au cas où il serait passé inaperçu.",
        "Votre aperçu est toujours en ligne, prêt à être personnalisé :",
      ],
      cta: "Revoir mon site",
    },
    {
      subject: name ? `${name}, je clôture votre aperçu` : "Je clôture votre aperçu",
      preheader: "Dernier message — je libère l'aperçu si pas de retour.",
      lead: [
        "Dernier message de ma part : sans retour, je libérerai l'aperçu que j'avais préparé pour vous.",
        "Si le site vous plaît, il est encore là :",
      ],
      cta: "Voir une dernière fois",
    },
  ];

  const v = variants[Math.max(0, Math.min(step, variants.length - 1))];
  const bodyHtml = [
    p(`<strong>${hi}</strong>`),
    ...v.lead.map((l) => p(l)),
    button(v.cta, opts.revealUrl),
    p(`<span style="font-size:13px;color:#6b6878;">— Lucas, Akyra</span>`),
  ].join("\n");

  const text = [
    hi,
    "",
    ...v.lead,
    "",
    v.cta + " : " + opts.revealUrl,
    "",
    "— Lucas, Akyra",
    "",
    "Se désinscrire : " + opts.unsubUrl,
  ].join("\n");

  return wrap({
    subject: v.subject,
    preheader: v.preheader,
    bodyHtml,
    text,
    footerKind: "outreach",
    unsubUrl: opts.unsubUrl,
  });
}
