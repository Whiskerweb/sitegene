/**
 * Templates email — fonctions pures renvoyant {subject, html, text}.
 * Aucun I/O ici : testable unitairement.
 */
import { wrap, button, esc, type EmailParts } from "./layout";

const p = (s: string) => `<p style="margin:0 0 14px;">${s}</p>`;

const OPT_OUT = "Si vous ne souhaitez plus être contacté : ";

/**
 * Email de prospection à partir d'un message rédigé À LA MAIN (déjà personnalisé,
 * lien reveal déjà écrit dedans). On n'ajoute qu'une ligne de désinscription.
 * Aucune reconstruction d'URL → impossible d'envoyer un lien cassé.
 */
export function customOutreachEmail(opts: {
  subject: string;
  message: string;
  unsubUrl: string;
}): EmailParts {
  const text = `${opts.message}\n\n—\n${OPT_OUT}${opts.unsubUrl}`;
  // Échappe, transforme les URLs http(s) en liens, puis les sauts de ligne en <br>.
  const linkified = esc(opts.message).replace(
    /(https?:\/\/[^\s<]+)/g,
    (u) => `<a href="${u}" style="color:#1a56db;">${u}</a>`,
  );
  const body = linkified.replace(/\n/g, "<br>");
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;">` +
    `${body}<br><br>—<br>` +
    `<span style="font-size:13px;color:#888;">${OPT_OUT}<a href="${esc(opts.unsubUrl)}" style="color:#1a56db;">${esc(opts.unsubUrl)}</a></span>` +
    `</div>`;
  return { subject: opts.subject, html, text };
}

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

/** Notification : le site sur-mesure généré en tâche de fond est prêt. */
export function siteReadyEmail(opts: {
  firstName?: string | null;
  dashboardUrl: string;
}): EmailParts {
  const hi = opts.firstName ? `Bonjour ${esc(opts.firstName)},` : "Bonjour,";
  const bodyHtml = [
    p(`<strong>${hi}</strong>`),
    p("Bonne nouvelle : votre site sur-mesure est prêt ! ✨"),
    p("Découvrez-le, ajustez tout ce que vous voulez, puis mettez-le en ligne depuis votre espace."),
    button("Voir mon site", opts.dashboardUrl),
    p(`<span style="font-size:13px;color:#6b6878;">Une question ? Répondez simplement à cet email.</span>`),
  ].join("\n");

  const text = [
    `${opts.firstName ? `Bonjour ${opts.firstName},` : "Bonjour,"}`,
    "",
    "Bonne nouvelle : votre site sur-mesure est prêt !",
    "Découvrez-le et personnalisez-le depuis votre espace :",
    opts.dashboardUrl,
    "",
    "Une question ? Répondez simplement à cet email.",
    "Akyra · akyra.io",
  ].join("\n");

  return wrap({
    subject: "Votre site Akyra est prêt ✨",
    preheader: "Votre site sur-mesure vient d'être généré.",
    bodyHtml,
    text,
    footerKind: "transactional",
  });
}

/** Relance après échec du débit de fin d'essai (carte refusée off-session). */
export function trialChargeFailedEmail(opts: {
  firstName?: string | null;
  dashboardUrl: string;
}): EmailParts {
  const hi = opts.firstName ? `Bonjour ${esc(opts.firstName)},` : "Bonjour,";
  const bodyHtml = [
    p(`<strong>${hi}</strong>`),
    p("Nous n'avons pas pu débiter les 50 € de fin d'essai sur votre carte."),
    p("Pas d'inquiétude : votre site reste en ligne pendant que nous réessayons (jusqu'à 3 tentatives)."),
    p("Pour éviter toute interruption, mettez à jour votre moyen de paiement depuis votre espace."),
    button("Mettre à jour ma carte", opts.dashboardUrl),
    p(`<span style="font-size:13px;color:#6b6878;">Une question ? Répondez simplement à cet email.</span>`),
  ].join("\n");

  const text = [
    opts.firstName ? `Bonjour ${opts.firstName},` : "Bonjour,",
    "",
    "Nous n'avons pas pu débiter les 50 € de fin d'essai sur votre carte.",
    "Votre site reste en ligne pendant que nous réessayons (jusqu'à 3 tentatives).",
    "",
    "Mettez à jour votre moyen de paiement depuis votre espace :",
    opts.dashboardUrl,
    "",
    "Une question ? Répondez simplement à cet email.",
    "Akyra · akyra.io",
  ].join("\n");

  return wrap({
    subject: "Votre site Akyra — un souci avec votre carte",
    preheader: "Le débit de fin d'essai a échoué. Votre site reste en ligne, mettez à jour votre carte.",
    bodyHtml,
    text,
    footerKind: "transactional",
  });
}

/**
 * Confirmation d'un changement d'adresse email — envoyée à la NOUVELLE adresse.
 * Le clic sur le bouton (lien à usage unique) déclenche la bascule effective.
 */
export function emailChangeRequestEmail(opts: {
  newEmail: string;
  confirmUrl: string;
}): EmailParts {
  const bodyHtml = [
    p("<strong>Confirmez votre nouvelle adresse</strong>"),
    p(
      `Vous avez demandé à utiliser <strong>${esc(opts.newEmail)}</strong> pour vous connecter à votre compte Akyra. Confirmez ci-dessous pour activer cette adresse.`,
    ),
    button("Confirmer mon adresse", opts.confirmUrl),
    p(
      `<span style="font-size:13px;color:#6b6878;">Ce lien expire dans 1 heure et ne peut servir qu'une fois. Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, rien ne change.</span>`,
    ),
  ].join("\n");

  const text = [
    "Confirmez votre nouvelle adresse",
    "",
    `Vous avez demandé à utiliser ${opts.newEmail} pour vous connecter à votre compte Akyra.`,
    "Confirmez ce changement en ouvrant ce lien (valable 1 heure, usage unique) :",
    opts.confirmUrl,
    "",
    "Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, rien ne change.",
    "Akyra · akyra.io",
  ].join("\n");

  return wrap({
    subject: "Confirmez votre nouvelle adresse email",
    preheader: "Un clic pour activer votre nouvelle adresse de connexion.",
    bodyHtml,
    text,
    footerKind: "transactional",
  });
}

/**
 * Alerte de sécurité — envoyée à l'ANCIENNE adresse quand un changement est
 * demandé. Permet au titulaire légitime de réagir si la demande n'est pas de lui.
 */
export function emailChangedNoticeEmail(opts: {
  newEmail: string;
  supportUrl: string;
}): EmailParts {
  const bodyHtml = [
    p("<strong>Une demande de changement d'adresse a été reçue</strong>"),
    p(
      `Quelqu'un a demandé à remplacer l'adresse de connexion de votre compte Akyra par <strong>${esc(opts.newEmail)}</strong>.`,
    ),
    p(
      "Si c'est bien vous, aucune action n'est nécessaire ici : confirmez simplement depuis l'email envoyé à la nouvelle adresse.",
    ),
    p(
      `<span style="font-size:13px;color:#6b6878;">Ce n'est pas vous ? Votre adresse actuelle reste active tant que rien n'est confirmé — sécurisez votre compte et <a href="${esc(opts.supportUrl)}" style="color:#3b5bdb;">contactez-nous</a> immédiatement.</span>`,
    ),
  ].join("\n");

  const text = [
    "Une demande de changement d'adresse a été reçue",
    "",
    `Quelqu'un a demandé à remplacer l'adresse de connexion de votre compte Akyra par ${opts.newEmail}.`,
    "Si c'est bien vous, confirmez depuis l'email envoyé à la nouvelle adresse.",
    "",
    `Ce n'est pas vous ? Votre adresse actuelle reste active tant que rien n'est confirmé. Contactez-nous : ${opts.supportUrl}`,
    "Akyra · akyra.io",
  ].join("\n");

  return wrap({
    subject: "Sécurité — demande de changement d'adresse sur votre compte",
    preheader: "Une nouvelle adresse a été demandée pour votre compte Akyra.",
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
  const name = (opts.firstName ?? "").trim();
  const hi = name ? `Bonjour ${name},` : "Bonjour,";

  // Volontairement « écrit à la main » : texte brut, pas de logo ni de bouton,
  // le lien en clair. Un mail 1:1 s'ouvre mieux et passe mieux les filtres.
  const variants: Array<{ subject: string; lines: string[] }> = [
    {
      subject: name ? `${name}, un aperçu de votre site` : "Un aperçu de votre site",
      lines: [
        hi,
        "",
        "Je suis tombé sur votre travail et je me suis permis de vous préparer un aperçu de site avec vos photos. Il est déjà en ligne, vous pouvez le regarder ici :",
        opts.revealUrl,
        "",
        "Si le rendu vous plaît, dites-le moi, on en discute. Sinon ce n'est pas grave, je ne vous embête pas plus.",
        "",
        "Bonne journée,",
        "Lucas",
      ],
    },
    {
      subject: name ? `${name}, vous avez pu y jeter un œil ?` : "Vous avez pu y jeter un œil ?",
      lines: [
        hi,
        "",
        "Je me permets de revenir rapidement vers vous — vous avez eu le temps de regarder l'aperçu que je vous avais préparé ?",
        opts.revealUrl,
        "",
        "Un simple retour me suffit, même si c'est non.",
        "",
        "Lucas",
      ],
    },
    {
      subject: name ? `${name}, je clôture votre aperçu` : "Je clôture votre aperçu",
      lines: [
        hi,
        "",
        "Sans retour de votre part, je vais clôturer l'aperçu de votre site. S'il vous intéresse encore, c'est le bon moment :",
        opts.revealUrl,
        "",
        "Sinon je n'insiste pas — bonne continuation à vous.",
        "",
        "Lucas",
      ],
    },
  ];

  const v = variants[Math.max(0, Math.min(step, variants.length - 1))];
  const optOut = "Si vous ne souhaitez plus être contacté : ";

  // Texte brut = version de référence.
  const text = `${v.lines.join("\n")}\n\n—\n${optOut}${opts.unsubUrl}`;

  // HTML minimal : rendu identique au texte, lien cliquable, zéro mise en page.
  const link = (url: string) => `<a href="${esc(url)}" style="color:#1a56db;">${esc(url)}</a>`;
  const body = v.lines.map((l) => (l === opts.revealUrl ? link(l) : esc(l))).join("<br>");
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;">` +
    `${body}<br><br>—<br>` +
    `<span style="font-size:13px;color:#888;">${optOut}${link(opts.unsubUrl)}</span>` +
    `</div>`;

  return { subject: v.subject, html, text };
}
