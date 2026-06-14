import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { hasActiveSubscription } from "@/lib/subscription";
import { addDomain, removeDomain, getDomainStatus } from "@/lib/vercel";

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

  const site = await primarySiteForUser<{ id: string; custom_domain: string | null }>(
    admin,
    user.id,
    "id, custom_domain",
  );
  if (!site) {
    return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  }

  const previous = site.custom_domain;

  // 1) Branchement Vercel AVANT l'écriture en base : si Vercel refuse durement,
  //    on n'enregistre pas un domaine qui ne marchera jamais.
  if (domain && domain !== previous) {
    const added = await addDomain(domain);
    if (!added.ok) {
      return NextResponse.json({ error: added.error ?? "Échec côté Vercel." }, { status: 502 });
    }
  }

  // 2) Écriture en base.
  const { error } = await admin
    .from("sites")
    .update({ custom_domain: domain || null })
    .eq("id", site.id);
  if (error) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }

  // 3) Nettoyage : retire l'ancien domaine du projet Vercel s'il a changé (best-effort).
  if (previous && previous !== domain) {
    await removeDomain(previous);
  }

  // 4) Statut initial (records DNS à poser) pour affichage immédiat.
  const status = domain ? await getDomainStatus(domain) : null;
  return NextResponse.json({ ok: true, custom_domain: domain || null, status });
}
