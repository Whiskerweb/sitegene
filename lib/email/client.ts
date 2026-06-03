import { Resend } from "resend";

/**
 * Client Resend — SERVEUR UNIQUEMENT. Singleton paresseux (la clé n'est lue
 * qu'au premier envoi, pas au build). Ne JAMAIS importer côté client.
 */
let _client: Resend | null = null;

export function resend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY manquant — requis pour l'envoi d'emails.");
    _client = new Resend(key);
  }
  return _client;
}

/** Mode test : si DRY_RUN=1, on ne contacte pas Resend (log seulement). */
export const DRY_RUN = process.env.DRY_RUN === "1";

export type SendArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult = { id: string | null; dryRun: boolean };

/** Envoi bas niveau. Renvoie l'id du message Resend (null en dry-run). */
export async function sendRaw(args: SendArgs): Promise<SendResult> {
  if (DRY_RUN) {
    console.log(`[email:dry-run] → ${args.to} | ${args.subject}`);
    return { id: null, dryRun: true };
  }
  const { data, error } = await resend().emails.send({
    from: args.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
    headers: args.headers,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { id: data?.id ?? null, dryRun: false };
}
