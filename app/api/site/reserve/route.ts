import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOUNDRY_TEMPLATE_ID, ensureFoundryTemplateRow } from "@/lib/foundry/server";

export const maxDuration = 15;

/**
 * Trouve ou crée un site draft foundry pour le compte connecté.
 * Utilisé pour pré-allouer un siteId avant la génération (upload de photos).
 * Idempotent : un seul draft par compte.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();
  await ensureFoundryTemplateRow(admin);

  // Réutiliser le draft existant s'il y en a un (même logique que generate).
  const { data: existing } = await admin
    .from("sites")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("template_id", FOUNDRY_TEMPLATE_ID)
    .neq("status", "live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ siteId: existing.id });
  }

  const { data: created, error } = await admin
    .from("sites")
    .insert({ owner_user_id: user.id, template_id: FOUNDRY_TEMPLATE_ID, status: "draft" })
    .select("id")
    .single();

  if (error || !created?.id) {
    return NextResponse.json({ error: "Impossible de réserver un espace." }, { status: 500 });
  }

  return NextResponse.json({ siteId: created.id });
}
