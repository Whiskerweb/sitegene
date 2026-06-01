import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePinSelector } from "@/lib/notes-selector";

/** Le client dépose une demande de modification (note), éventuellement épinglée à un endroit. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { siteId, message, selector } = await request.json();
  if (!siteId || !String(message ?? "").trim()) {
    return NextResponse.json({ error: "Message requis." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Vérifie que le site appartient bien à l'utilisateur.
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  const pin = selector ? parsePinSelector(selector) : null; // null = note non épinglée (toléré)

  const { data: inserted, error } = await admin
    .from("notes")
    .insert({
      site_id: siteId,
      author_user_id: user.id,
      message: String(message).slice(0, 1000),
      status: "open",
      selector: pin,
    })
    .select("id, message, status, selector, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, note: inserted });
}
