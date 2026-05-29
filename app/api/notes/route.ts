import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Le client dépose une demande de modification (note) sur SON site. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { siteId, message } = await request.json();
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

  const { error } = await admin.from("notes").insert({
    site_id: siteId,
    author_user_id: user.id,
    message: String(message).slice(0, 1000),
    status: "open",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
