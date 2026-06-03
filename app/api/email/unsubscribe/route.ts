/**
 * Désinscription prospection. `GET ?token={unsub_token}` (clic dans l'email) →
 * stop séquence + page de confirmation. `POST` (en-tête List-Unsubscribe-Post,
 * désinscription en un clic côté client mail) → 204.
 */
import { createAdminClient } from "@/lib/supabase/admin";

async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token) return false;
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("outreach")
    .select("id, prospect_id")
    .eq("unsub_token", token)
    .maybeSingle();
  if (!row) return false;

  await admin
    .from("outreach")
    .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  // Trace pour la suppression list (isSuppressed lit email_events).
  let toEmail: string | null = null;
  if (row.prospect_id) {
    const { data: prospect } = await admin
      .from("prospects")
      .select("email")
      .eq("id", row.prospect_id)
      .maybeSingle();
    toEmail = prospect?.email ?? null;
  }
  await admin.from("email_events").insert({
    outreach_id: row.id,
    prospect_id: row.prospect_id,
    to_email: toEmail ? toEmail.toLowerCase() : null,
    kind: "unsubscribe",
    event: "unsubscribed",
  });
  return true;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribe(token);
  // On confirme toujours (ne pas révéler si le token existait).
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f4f8;color:#26242e;">
  <div style="max-width:480px;margin:80px auto;background:#fff;border:1px solid #ececf1;border-radius:16px;padding:40px;text-align:center;">
    <p style="font-size:20px;font-weight:700;margin:0 0 12px;">Akyra<span style="color:#c9a84a;">.</span></p>
    <p style="font-size:15px;line-height:1.6;margin:0;">Vous êtes désinscrit. Vous ne recevrez plus de messages de notre part.</p>
  </div>
</body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribe(token);
  return new Response(null, { status: 204 });
}
