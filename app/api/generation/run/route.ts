import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSiteGenerationJob } from "@/lib/onboarding";

// Génération longue (corps complet) : on prend la durée max disponible.
export const maxDuration = 300;

const STUCK_AFTER_MIN = 10;

/** Auth : secret partagé (after() interne) ou en-tête de cron Vercel. */
function authorized(request: Request): boolean {
  const secret = process.env.GENERATION_SECRET ?? process.env.CRON_SECRET ?? "";
  const auth = request.headers.get("authorization") ?? "";
  if (secret) return auth === `Bearer ${secret}`;
  // Pas de secret configuré : autorisé seulement hors production (dev).
  return process.env.NODE_ENV !== "production";
}

/**
 * Worker de génération de site. Appelé immédiatement par /api/onboarding/validate
 * (after()) ET par le cron Vercel (filet). Traite UN job `generate_site` : site
 * précis (body.siteId) ou le plus ancien en attente. Avant de prendre un job, il
 * remet en `pending` les jobs `running` bloqués depuis > 10 min (reprise).
 */
async function handle(request: Request, siteId?: string) {
  if (!authorized(request)) return NextResponse.json({ error: "Interdit." }, { status: 401 });

  // Reprise des jobs bloqués (fonction coupée en plein vol).
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MIN * 60_000).toISOString();
  await admin
    .from("jobs")
    .update({ status: "pending" })
    .eq("type", "generate_site")
    .eq("status", "running")
    .lt("started_at", cutoff);

  const origin = new URL(request.url).origin;
  const res = await runSiteGenerationJob(origin, siteId ? { siteId } : undefined);
  return NextResponse.json(res);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : undefined;
  return handle(request, siteId);
}

// Le cron Vercel appelle en GET (Authorization: Bearer CRON_SECRET).
export async function GET(request: Request) {
  return handle(request);
}
