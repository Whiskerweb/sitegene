import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite, finalizeAiOnboarding } from "@/lib/onboarding";

export const maxDuration = 120;

/**
 * Finale de l'onboarding IA : choisit le thème adapté et GÉNÈRE le site sur-mesure
 * (fallback déterministe garanti). POST { siteId }.
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

  const origin = new URL(request.url).origin;
  const result = await finalizeAiOnboarding(origin, siteId);
  if (!result.ok) {
    return NextResponse.json({ error: "Finalisation impossible." }, { status: 500 });
  }
  return NextResponse.json(result);
}
