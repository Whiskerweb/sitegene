import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";

/** L'opérateur valide une note → crée un job modify_site (le worker/Claude l'applique). */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile?.is_operator) {
    return NextResponse.json({ error: "Accès opérateur requis." }, { status: 403 });
  }

  const { noteId } = await request.json();
  const admin = createAdminClient();

  const { data: note } = await admin
    .from("notes")
    .select("id, site_id, message, status")
    .eq("id", noteId)
    .maybeSingle();
  if (!note || !note.site_id) {
    return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  }

  const { data: site } = await admin
    .from("sites")
    .select("owner_user_id")
    .eq("id", note.site_id)
    .maybeSingle();
  if (site?.owner_user_id) {
    const balance = await getBalance(admin, site.owner_user_id);
    if (balance <= 0) {
      return NextResponse.json(
        { error: "Le client n'a plus de crédits." },
        { status: 402 },
      );
    }
  }

  await admin.from("jobs").insert({
    type: "modify_site",
    status: "pending",
    site_id: note.site_id,
    created_by: profile.id,
    payload: { siteId: note.site_id, instruction: note.message, noteId: note.id },
  });
  await admin.from("notes").update({ status: "in_progress" }).eq("id", note.id);

  return NextResponse.json({ ok: true });
}
