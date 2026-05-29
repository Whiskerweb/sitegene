import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("site_id")
    .eq("token", token)
    .maybeSingle();
  if (!code) return new Response(null, { status: 204 });

  await admin.from("events").insert({
    token,
    site_id: code.site_id ?? null,
    type,
    label: label ? String(label).slice(0, 80) : null,
  });

  return new Response(null, { status: 204 });
}
