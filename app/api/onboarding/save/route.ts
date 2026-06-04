/** Autosave de l'intake (une réponse → un patch). Garde-fou d'ownership. */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { saveIntake, userOwnsSite } from "@/lib/onboarding";
import type { Intake } from "@/lib/onboarding-config";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { siteId?: string; patch?: Partial<Intake>; step?: number; skipped?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const skipped = Array.isArray(body.skipped)
    ? body.skipped.filter((k): k is string => typeof k === "string").slice(0, 50)
    : undefined;
  const state = await saveIntake(siteId, body.patch ?? {}, body.step, skipped);
  if (!state) {
    return NextResponse.json({ error: "Onboarding introuvable." }, { status: 404 });
  }
  return NextResponse.json(state);
}
