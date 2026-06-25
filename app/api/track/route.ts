import { createAdminClient } from "@/lib/supabase/admin";
import { enqueue } from "@/lib/twenty/sync";

const TYPES = ["reveal_opened", "button_click", "go_live_clicked", "purchased"];

/** Endpoint de tracking (sendBeacon depuis le reveal). Insert via service_role. */
export async function POST(request: Request) {
  let body: { token?: string; type?: string; label?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const { token, type, label } = body;
  if (!token || !type || !TYPES.includes(type)) {
    return new Response(null, { status: 204 });
  }

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("prospect_codes")
    .select("site_id, prospect_id")
    .eq("token", token)
    .maybeSingle();
  if (!code) return new Response(null, { status: 204 });

  await admin.from("events").insert({
    token,
    site_id: code.site_id ?? null,
    type,
    label: label ? String(label).slice(0, 80) : null,
  });

  // Synchro Twenty (best-effort, via outbox — ne bloque jamais le tracking).
  if (code.prospect_id) {
    await enqueue(admin, {
      op: "append_note",
      prospectId: code.prospect_id,
      payload: { signal: type, at: new Date().toISOString(), dedup_key: `evt:${token}:${type}` },
    });
    await enqueue(admin, { op: "sync_prospect", prospectId: code.prospect_id });
  }

  return new Response(null, { status: 204 });
}
