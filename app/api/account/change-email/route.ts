import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EMAIL_CHANGE_RESEND_COOLDOWN_MS,
  EMAIL_CHANGE_TTL_MS,
  isValidEmail,
  newEmailChangeToken,
  normalizeEmail,
} from "@/lib/account/email-change";
import { sendEmailChangeRequest, sendEmailChangedNotice } from "@/lib/email/send";

/**
 * Demande de changement d'adresse email. N'effectue AUCUNE bascule : enregistre
 * une demande à usage unique et envoie un lien de confirmation à la NOUVELLE
 * adresse (+ une alerte de sécurité à l'ancienne). La bascule réelle a lieu dans
 * /api/account/confirm-email après clic.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newEmail = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  if (!isValidEmail(newEmail)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const current = (user.email ?? "").toLowerCase();
  if (newEmail === current) {
    return NextResponse.json({ error: "C'est déjà votre adresse actuelle." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Collision : l'adresse est-elle déjà rattachée à un autre compte ? (pré-check
  // pour ne pas envoyer d'email inutile — la garde définitive est à la bascule).
  const { data: clash } = await admin
    .from("profiles")
    .select("id")
    .eq("email", newEmail)
    .neq("id", user.id)
    .maybeSingle();
  if (clash) {
    return NextResponse.json(
      { error: "Cette adresse est déjà utilisée par un autre compte." },
      { status: 409 },
    );
  }

  // Anti-spam : une demande non consommée a-t-elle été émise il y a moins d'1 min ?
  const { data: recent } = await admin
    .from("email_change_requests")
    .select("created_at")
    .eq("user_id", user.id)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    recent &&
    Date.now() - new Date(recent.created_at).getTime() < EMAIL_CHANGE_RESEND_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: "Un email vient d'être envoyé. Patientez une minute avant de réessayer." },
      { status: 429 },
    );
  }

  // Un seul lien valable à la fois : on invalide les demandes en attente.
  await admin.from("email_change_requests").delete().eq("user_id", user.id).is("used_at", null);

  const { raw, hash } = newEmailChangeToken();
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS).toISOString();
  const { error: insErr } = await admin.from("email_change_requests").insert({
    user_id: user.id,
    new_email: newEmail,
    token_hash: hash,
    expires_at: expiresAt,
  });
  if (insErr) {
    return NextResponse.json({ error: "Impossible d'enregistrer la demande." }, { status: 500 });
  }

  // Email de confirmation vers la NOUVELLE adresse : indispensable. S'il
  // échoue, on retire la demande pour permettre un nouvel essai immédiat
  // (sans buter sur l'anti-spam).
  try {
    await sendEmailChangeRequest(admin, { to: newEmail, token: raw });
  } catch (e) {
    console.error(
      "[change-email] envoi confirmation échoué:",
      e instanceof Error ? e.message : e,
    );
    await admin.from("email_change_requests").delete().eq("token_hash", hash);
    return NextResponse.json(
      { error: "L'email de confirmation n'a pas pu être envoyé. Réessayez." },
      { status: 502 },
    );
  }

  // Alerte de sécurité vers l'ANCIENNE adresse : best-effort. Elle ne doit
  // JAMAIS bloquer ni invalider une confirmation déjà partie.
  if (current) {
    try {
      await sendEmailChangedNotice(admin, { to: current, newEmail });
    } catch (e) {
      console.error(
        "[change-email] alerte ancienne adresse échouée:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  return NextResponse.json({ ok: true, email: newEmail });
}
