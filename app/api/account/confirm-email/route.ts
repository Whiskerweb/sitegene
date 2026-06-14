import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashEmailChangeToken } from "@/lib/account/email-change";

/**
 * Finalise un changement d'adresse : valide le token à usage unique puis bascule
 * l'email côté Supabase Auth (confirmé d'office, donc pas d'email Supabase en
 * double) et resynchronise le miroir public.profiles. Aucune session requise —
 * le token suffit (l'utilisateur peut cliquer depuis un autre appareil).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("email_change_requests")
    .select("id, user_id, new_email, expires_at, used_at")
    .eq("token_hash", hashEmailChangeToken(token))
    .maybeSingle();

  if (!req) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  if (req.used_at) {
    return NextResponse.json({ error: "Ce lien a déjà été utilisé." }, { status: 409 });
  }
  if (new Date(req.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Ce lien a expiré. Relancez la demande depuis vos paramètres." },
      { status: 410 },
    );
  }

  // Collision de dernière minute (l'adresse a pu être prise entre-temps).
  const { data: clash } = await admin
    .from("profiles")
    .select("id")
    .eq("email", req.new_email)
    .neq("id", req.user_id)
    .maybeSingle();
  if (clash) {
    return NextResponse.json(
      { error: "Cette adresse est désormais utilisée par un autre compte." },
      { status: 409 },
    );
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(req.user_id, {
    email: req.new_email,
    email_confirm: true,
  });
  if (updErr) {
    const taken = /already|registered|exists|in use/i.test(updErr.message);
    return NextResponse.json(
      {
        error: taken
          ? "Cette adresse est déjà utilisée par un autre compte."
          : "Le changement a échoué. Réessayez.",
      },
      { status: taken ? 409 : 500 },
    );
  }

  // Miroir public + consommation du token (best-effort sur le miroir).
  await admin.from("profiles").update({ email: req.new_email }).eq("id", req.user_id);
  await admin
    .from("email_change_requests")
    .update({ used_at: new Date().toISOString() })
    .eq("id", req.id);

  return NextResponse.json({ ok: true, email: req.new_email });
}
