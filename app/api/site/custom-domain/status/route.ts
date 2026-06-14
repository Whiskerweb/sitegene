import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { hasActiveSubscription } from "@/lib/subscription";
import { getDomainStatus } from "@/lib/vercel";

/**
 * Statut réel du domaine personnalisé du site principal (interrogé en polling
 * par la carte Réglages). Gate Pro identique au POST.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();
  if (!(await hasActiveSubscription(admin, user.id))) {
    return NextResponse.json({ error: "Réservé aux abonnés.", upgrade: true }, { status: 403 });
  }

  const site = await primarySiteForUser<{ custom_domain: string | null }>(
    admin,
    user.id,
    "custom_domain",
  );
  const domain = site?.custom_domain ?? null;
  if (!domain) return NextResponse.json({ connected: false });

  const status = await getDomainStatus(domain);
  return NextResponse.json({ connected: true, status });
}
