import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite } from "@/lib/onboarding";
import { pickDesignSystem } from "@/lib/theme-match";
import { imagePlanFor } from "@/lib/image-plan";
import type { Intake } from "@/lib/onboarding-config";

export const maxDuration = 30;

/**
 * Après le chat (socle complet) : choisit le design system adapté (cross-métier),
 * le persiste (chosen_template_id) et renvoie le PLAN PHOTO (nombre exact + rôles)
 * à montrer au client avant l'upload. POST { siteId }.
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
  const admin = createAdminClient();
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const intake = (ob?.intake ?? {}) as Intake;

  const choice = await pickDesignSystem(origin, intake);
  await admin
    .from("site_onboarding")
    .update({ chosen_template_id: choice.templateId, updated_at: new Date().toISOString() })
    .eq("site_id", siteId);

  const imagePlan = await imagePlanFor(origin, choice.templateId, intake);
  return NextResponse.json({
    templateId: choice.templateId,
    rationale: choice.rationale,
    imagePlan,
  });
}
