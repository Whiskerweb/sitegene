import { NextResponse, after } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite, enqueueSiteGeneration } from "@/lib/onboarding";
import { commitProgressive } from "@/lib/onboarding-sections";

export const maxDuration = 30;

/**
 * Le client valide le STYLE en fin de conversation → on assemble le header +
 * les sections déjà générées en snapshot courant (step=100). Si toutes les
 * sections sont prêtes (`allDone`), le site est complet — aucun job nécessaire.
 * Sinon on met en file `generate_site` (filet) et on le démarre immédiatement
 * (after()) ; le cron Vercel assure la reprise en cas d'échec.
 * Le reveal in-tunnel est piloté côté client par le poll de `build-state`.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "Site manquant." }, { status: 400 });
  if (!(await userOwnsSite(user.id, siteId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const origin = new URL(request.url).origin;
  const commit = await commitProgressive(origin, siteId);
  if (!commit.ok)
    return NextResponse.json({ error: `Validation impossible (${commit.reason}).` }, { status: 400 });

  // Filet : seulement si des sections manquent → job + démarrage immédiat (cron = reprise).
  if (!commit.allDone) {
    const admin = createAdminClient();
    await enqueueSiteGeneration(admin, siteId);
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
  }

  return NextResponse.json({ ok: true, allDone: commit.allDone, redirect: "/dashboard?building=1" });
}
