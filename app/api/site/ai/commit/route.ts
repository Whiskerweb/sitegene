import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance, grantCredits } from "@/lib/credits-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { sanitizeCss } from "@/lib/css-sanitize";

const COST = 1;

/**
 * Le client valide la proposition de l'IA → on enregistre le CSS dans une nouvelle
 * version (publiée si le site est live) et on débite 1 crédit (ai_edit).
 * On re-valide le CSS côté serveur (jamais faire confiance au client).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  if (!siteId) return NextResponse.json({ error: "siteId requis." }, { status: 400 });

  const clean = sanitizeCss(body?.css);
  if (!clean.ok) return NextResponse.json({ error: clean.reason }, { status: 400 });

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  // Abonné « tout illimité » : aucune vérif de solde ni débit.
  const unlimited = await hasActiveSubscription(admin, user.id);
  if (!unlimited) {
    const balance = await getBalance(admin, user.id);
    if (balance < COST) {
      return NextResponse.json(
        { error: "Solde insuffisant. Achetez des crédits ou passez à l'illimité pour valider." },
        { status: 409 },
      );
    }
  }

  const { data: top } = await admin
    .from("site_content")
    .select("version, content_json")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = structuredClone((top?.content_json as Record<string, unknown>) ?? {});
  base.__css = clean.css;
  const version = (top?.version ?? 0) + 1;

  const { error } = await admin.from("site_content").insert({
    site_id: siteId,
    version,
    content_json: base,
    is_published: site.status === "live",
    created_by: "ai",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const newBalance = unlimited
    ? await getBalance(admin, user.id)
    : await grantCredits(admin, user.id, -COST, "ai_edit", {});
  return NextResponse.json({ ok: true, version, balance: newBalance, unlimited });
}
