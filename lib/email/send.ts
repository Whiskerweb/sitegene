import type { SupabaseClient } from "@supabase/supabase-js";
import { sendRaw } from "./client";
import { receiptEmail, outreachEmail, customOutreachEmail, trialChargeFailedEmail } from "./templates";

/**
 * URL publique pour les liens des emails. Priorité à EMAIL_PUBLIC_BASE_URL.
 * GARDE-FOU : jamais de lien localhost/127.0.0.1 dans un email envoyé — le worker
 * tourne en local avec NEXT_PUBLIC_APP_URL=localhost, on retombe alors sur la prod.
 */
function appUrl(): string {
  const raw =
    process.env.EMAIL_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://akyra.io";
  if (raw.includes("localhost") || raw.includes("127.0.0.1")) return "https://akyra.io";
  return raw.replace(/\/$/, "");
}

function fromTransactional(): string {
  return process.env.RESEND_FROM_TRANSACTIONAL || "Akyra Team <noreply@akyra.io>";
}
function fromOutreach(): string {
  return process.env.RESEND_FROM_OUTREACH || "Akyra <lucas@go.akyra.io>";
}

/** Journalise un event email (best-effort : ne lève jamais). */
async function logEvent(
  admin: SupabaseClient,
  row: {
    outreach_id?: string | null;
    prospect_id?: string | null;
    to_email: string;
    kind: string;
    step?: number | null;
    provider_id?: string | null;
    event: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await admin.from("email_events").insert({
      outreach_id: row.outreach_id ?? null,
      prospect_id: row.prospect_id ?? null,
      to_email: row.to_email.toLowerCase(),
      kind: row.kind,
      step: row.step ?? null,
      provider_id: row.provider_id ?? null,
      event: row.event,
      meta: row.meta ?? {},
    });
  } catch (e) {
    console.error("[email] logEvent failed:", e instanceof Error ? e.message : e);
  }
}

/** Reçu / bienvenue après paiement. Renvoie l'id Resend (ou null). */
export async function sendReceipt(
  admin: SupabaseClient,
  opts: { to: string; firstName?: string | null },
): Promise<string | null> {
  const mail = receiptEmail({
    firstName: opts.firstName,
    dashboardUrl: `${appUrl()}/dashboard`,
  });
  const res = await sendRaw({
    from: fromTransactional(),
    to: opts.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  await logEvent(admin, {
    to_email: opts.to,
    kind: "receipt",
    provider_id: res.id,
    event: "sent",
  });
  return res.id;
}

/** Relance après échec du débit de fin d'essai. Renvoie l'id Resend (ou null). */
export async function sendTrialChargeFailed(
  admin: SupabaseClient,
  opts: { to: string; firstName?: string | null },
): Promise<string | null> {
  const mail = trialChargeFailedEmail({
    firstName: opts.firstName,
    dashboardUrl: `${appUrl()}/dashboard`,
  });
  const res = await sendRaw({
    from: fromTransactional(),
    to: opts.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  await logEvent(admin, {
    to_email: opts.to,
    kind: "trial_charge_failed",
    provider_id: res.id,
    event: "sent",
  });
  return res.id;
}

export type OutreachStepInput = {
  outreachId: string;
  prospectId: string | null;
  to: string;
  firstName?: string | null;
  step: number; // étape à envoyer (0 = initial)
  revealToken: string;
  unsubToken: string;
  // Étape 0 : message rédigé à la main (lien déjà dedans). Si fourni, on l'envoie
  // tel quel au lieu du template généré. Les relances utilisent toujours le template.
  customMessage?: string | null;
  customSubject?: string | null;
};

/** Envoie l'étape courante d'une séquence de prospection. */
export async function sendOutreachStep(
  admin: SupabaseClient,
  input: OutreachStepInput,
): Promise<string | null> {
  const base = appUrl();
  const unsubUrl = `${base}/api/email/unsubscribe?token=${encodeURIComponent(input.unsubToken)}`;
  const mail =
    input.step === 0 && input.customMessage
      ? customOutreachEmail({
          subject: input.customSubject || "Votre site est prêt",
          message: input.customMessage,
          unsubUrl,
        })
      : outreachEmail(input.step, {
          firstName: input.firstName,
          revealUrl: `${base}/r/${input.revealToken}`,
          unsubUrl,
        });
  const res = await sendRaw({
    from: fromOutreach(),
    to: input.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    replyTo: process.env.RESEND_OUTREACH_REPLY_TO || undefined,
    // Conformité : désinscription en un clic possible côté client mail.
    headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  await logEvent(admin, {
    outreach_id: input.outreachId,
    prospect_id: input.prospectId,
    to_email: input.to,
    kind: "outreach_step",
    step: input.step,
    provider_id: res.id,
    event: "sent",
  });
  return res.id;
}
