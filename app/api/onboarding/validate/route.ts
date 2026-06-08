import { NextResponse, after } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite, commitHeaderAndEnqueue } from "@/lib/onboarding";

export const maxDuration = 30;

/**
 * Le client valide le STYLE (header) → on met en file la génération du site
 * complet et on la démarre IMMÉDIATEMENT en tâche de fond (after()). Le client
 * part sur le dashboard ; le cron Vercel est le filet de reprise.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "Site manquant." }, { status: 400 });
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Persiste le header validé comme aperçu courant + met en file la génération.
  const commit = await commitHeaderAndEnqueue(siteId);
  if (!commit.ok) {
    return NextResponse.json({ error: `Validation impossible (${commit.reason}).` }, { status: 400 });
  }

  // Démarrage immédiat (le worker se charge de la génération longue, hors requête).
  const origin = new URL(request.url).origin;
  const secret = process.env.GENERATION_SECRET ?? process.env.CRON_SECRET ?? "";
  after(async () => {
    try {
      await fetch(`${origin}/api/generation/run`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
        body: JSON.stringify({ siteId }),
      });
    } catch {
      // Sans effet : le cron reprendra le job pending.
    }
  });

  return NextResponse.json({ ok: true, redirect: "/dashboard?building=1" });
}
