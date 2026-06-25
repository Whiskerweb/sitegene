import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { drainOutbox, reconcileStaleContacts } from "@/lib/twenty/sync";
import { twentyEnabled } from "@/lib/twenty/client";

// Drain potentiellement long (jusqu'à 80 pushes Twenty throttlés) : durée max.
export const maxDuration = 300;

/** Auth : même secret que le cron de génération (Authorization: Bearer CRON_SECRET). */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.GENERATION_SECRET ?? "";
  const auth = request.headers.get("authorization") ?? "";
  if (secret) return auth === `Bearer ${secret}`;
  return process.env.NODE_ENV !== "production"; // dev sans secret
}

/**
 * Worker de synchro Twenty (cron Vercel toutes les 5 min, GET). Deux temps :
 *   1. enfile les prospects jamais/anciennement synchronisés (réconciliation),
 *   2. draine la file `twenty_outbox` vers Twenty (avec retries/backoff).
 * Ne casse jamais : si Twenty est désactivé/injoignable, renvoie proprement.
 */
async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Interdit." }, { status: 401 });
  if (!twentyEnabled()) return NextResponse.json({ skipped: "twenty disabled" });

  const admin = createAdminClient();
  const reconciled = await reconcileStaleContacts(admin, { limit: 100 });
  const drain = await drainOutbox(admin, { limit: 80 });
  return NextResponse.json({ reconciled, ...drain });
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
