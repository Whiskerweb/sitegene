/**
 * Webhook Resend → journalise les events dans `email_events` et met à jour la
 * séquence `outreach` (bounce dur / plainte = stop délivrabilité). Signature
 * vérifiée via Svix (RESEND_WEBHOOK_SECRET). Les opens email ne stoppent PAS la
 * séquence (signal trop bruité) — seul reveal vu / paiement le fait, ailleurs.
 */
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueue } from "@/lib/twenty/sync";
import type { EmailEventName } from "@/lib/types/db";

/** type Resend → nom d'event interne (null = ignoré). */
const MAP: Record<string, EmailEventName> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

/** Events qui stoppent la séquence et suppriment l'adresse. */
const STOP: Partial<Record<EmailEventName, "bounced" | "unsubscribed">> = {
  bounced: "bounced",
  complained: "unsubscribed",
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook secret manquant", { status: 500 });

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let evt: { type?: string; data?: Record<string, unknown> };
  try {
    evt = new Webhook(secret).verify(payload, headers) as typeof evt;
  } catch {
    return new Response("signature invalide", { status: 400 });
  }

  const event = evt.type ? MAP[evt.type] : undefined;
  if (!event) return new Response(null, { status: 204 });

  const data = evt.data ?? {};
  const providerId = (data.email_id as string) ?? null;
  const toRaw = Array.isArray(data.to) ? data.to[0] : (data.to as string | undefined);
  const toEmail = toRaw ? String(toRaw).toLowerCase() : null;

  const admin = createAdminClient();

  // Corrèle avec l'envoi initial pour retrouver outreach_id / prospect_id.
  let outreachId: string | null = null;
  let prospectId: string | null = null;
  if (providerId) {
    const { data: origin } = await admin
      .from("email_events")
      .select("outreach_id, prospect_id")
      .eq("provider_id", providerId)
      .eq("event", "sent")
      .maybeSingle();
    outreachId = origin?.outreach_id ?? null;
    prospectId = origin?.prospect_id ?? null;
  }

  await admin.from("email_events").insert({
    outreach_id: outreachId,
    prospect_id: prospectId,
    to_email: toEmail,
    kind: "resend_webhook",
    provider_id: providerId,
    event,
    meta: { resend_type: evt.type },
  });

  const stop = STOP[event];
  if (stop && outreachId) {
    await admin
      .from("outreach")
      .update({ status: stop, updated_at: new Date().toISOString() })
      .eq("id", outreachId)
      .in("status", ["queued", "active"]);
  }

  // Synchro Twenty : un clic email est un signal fiable (timeline + refresh score).
  if (prospectId && event === "clicked") {
    await enqueue(admin, {
      op: "append_note",
      prospectId,
      payload: {
        signal: "email_clicked",
        at: new Date().toISOString(),
        dedup_key: `email:${providerId ?? toEmail}:clicked`,
      },
    });
    await enqueue(admin, { op: "sync_prospect", prospectId });
  }

  return new Response(null, { status: 204 });
}
