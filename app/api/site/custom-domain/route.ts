import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { hasActiveSubscription } from "@/lib/subscription";

/** Domaine ou sous-domaine valide (ex : studio.com, www.studio.com). */
const DOMAIN_RE =
  /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;

/** Normalise l'entrée : minuscules, sans protocole, sans chemin ni www superflu. */
function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

/**
 * Branche (ou retire) le domaine personnalisé du site principal du client.
 * GATE : réservé aux abonnés « tout compris » (hasActiveSubscription). Le
 * domaine custom est le cœur de la proposition d'abonnement.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();

  // Gate abonnement — c'est ici qu'on pousse vers l'offre Pro.
  if (!(await hasActiveSubscription(admin, user.id))) {
    return NextResponse.json(
      {
        error: "Le domaine personnalisé est réservé aux abonnés.",
        upgrade: true,
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const raw = typeof body?.domain === "string" ? body.domain : "";
  const domain = normalizeDomain(raw);

  // Chaîne vide → on débranche le domaine (retour au sous-domaine akyra.io).
  if (domain && !DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      { error: "Domaine invalide (ex : votre-studio.com)." },
      { status: 400 },
    );
  }

  const site = await primarySiteForUser<{ id: string }>(admin, user.id, "id");
  if (!site) {
    return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  }

  const { error } = await admin
    .from("sites")
    .update({ custom_domain: domain || null })
    .eq("id", site.id);
  if (error) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, custom_domain: domain || null });
}
