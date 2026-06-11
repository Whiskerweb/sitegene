import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { injectContacts } from "@/lib/foundry/inject";
import { loadRecipeDraft, saveRecipeDraft } from "@/lib/foundry/server";
import type { Collected } from "@/lib/foundry/link-catalog";

export const maxDuration = 30;

/**
 * Fusionne les liens & photos collectés (tunnel /creer) dans la recette draft.
 * Déterministe (aucun appel Mistral). Idempotent.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const collected = body?.collected as Collected | undefined;
  if (!siteId || !collected) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (site.status === "live") {
    return NextResponse.json({ error: "Site déjà en ligne." }, { status: 409 });
  }

  const loaded = await loadRecipeDraft(admin, siteId);
  if (!loaded) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });

  const safe: Collected = {
    socials: Array.isArray(collected.socials) ? collected.socials.filter((s) => s?.href) : [],
    contact: collected.contact ?? {},
    booking: collected.booking?.href ? collected.booking : undefined,
    photos: Array.isArray(collected.photos) ? collected.photos.slice(0, 20) : [],
  };

  const merged = injectContacts(loaded.recipe, safe);
  await saveRecipeDraft(admin, siteId, merged, {});

  return NextResponse.json({ ok: true });
}
