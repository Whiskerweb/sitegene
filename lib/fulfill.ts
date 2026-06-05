import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits-server";
import { SIGNUP_CREDITS } from "@/lib/stripe";
import { sendReceipt } from "@/lib/email/send";
import { isValidSlug, normalizeSlug } from "@/lib/templates";

export type FulfillResult = {
  email: string | null;
  token: string | null;
  siteId: string | null;
  userId: string | null;
  /** Tunnel self-serve : le site appartenait déjà au payeur (mis en ligne ici). */
  selfServe: boolean;
  /** Slug attribué au go-live self-serve (sinon null → nommage via /welcome/name). */
  slug: string | null;
};

type Admin = ReturnType<typeof createAdminClient>;

/** Slug unique dérivé d'une base (suffixe -2, -3… en cas de collision). */
async function deriveUniqueSlug(admin: Admin, base: string, siteId: string): Promise<string> {
  let root = normalizeSlug(base);
  if (!isValidSlug(root)) root = `studio-${siteId.slice(0, 6)}`;
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await admin
      .from("sites")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash || clash.id === siteId) return candidate;
    candidate = `${root}-${i}`.slice(0, 40);
  }
  return `${root}-${siteId.slice(0, 6)}`.slice(0, 40);
}

/** Met le site en ligne (publie la dernière version + slug + statut live). */
export async function goLive(admin: Admin, siteId: string, slugBase: string): Promise<string> {
  const slug = await deriveUniqueSlug(admin, slugBase, siteId);
  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) {
    await admin.from("site_content").update({ is_published: true }).eq("id", sc.id);
  }
  await admin
    .from("sites")
    .update({ slug, status: "live", published_at: new Date().toISOString() })
    .eq("id", siteId);
  return slug;
}

/** Trouve ou crée un utilisateur Supabase par email. */
async function ensureUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  return data.user.id;
}

/**
 * Effets durables d'un paiement réussi — IDEMPOTENT (clé = stripe_session_id).
 * Appelé depuis /welcome (immédiat) ET le webhook (filet de sécurité).
 */
export async function fulfillPayment(
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  const admin = createAdminClient();
  const token = (session.metadata?.token as string) || null;
  const email =
    session.customer_details?.email || (session.customer_email as string) || null;

  const { data: code } = token
    ? await admin
        .from("prospect_codes")
        .select("id, site_id, prospect_id")
        .eq("token", token)
        .maybeSingle()
    : { data: null };
  const siteId = code?.site_id ?? null;

  // Self-serve : le site appartient DÉJÀ au payeur (compte créé au gate landing).
  // Sinon (outreach) : on crée/retrouve le compte par email comme avant.
  const { data: site } = siteId
    ? await admin.from("sites").select("owner_user_id, status").eq("id", siteId).maybeSingle()
    : { data: null };
  const ownerId = (site?.owner_user_id as string) || null;
  const selfServe = Boolean(ownerId);

  if (!selfServe && !email) {
    return { email: null, token, siteId, userId: null, selfServe: false, slug: null };
  }
  const userId = ownerId ?? (await ensureUser(admin, email as string));

  // Idempotence : si le paiement est déjà enregistré, ne rien refaire.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) {
    const slug = selfServe ? await currentSlug(admin, siteId) : null;
    return { email, token, siteId, userId, selfServe, slug };
  }

  const { data: payment } = await admin
    .from("payments")
    .insert({
      user_id: userId,
      prospect_code_id: code?.id ?? null,
      stripe_session_id: session.id,
      stripe_payment_intent: (session.payment_intent as string) ?? null,
      amount_cents: session.amount_total ?? 5000,
      currency: session.currency ?? "eur",
      kind: "initial_50",
      status: "paid",
    })
    .select("id")
    .single();

  await grantCredits(admin, userId, SIGNUP_CREDITS, "signup_grant", {
    payment_id: payment?.id,
  });

  // Reçu / bienvenue — best-effort, ne doit JAMAIS bloquer le fulfillment.
  try {
    let firstName: string | null = null;
    if (code?.prospect_id) {
      const { data: prospect } = await admin
        .from("prospects")
        .select("first_name")
        .eq("id", code.prospect_id)
        .maybeSingle();
      firstName = prospect?.first_name ?? null;
    }
    if (email) await sendReceipt(admin, { to: email, firstName });
    // Si ce prospect était dans une séquence de prospection : converti → stop.
    if (code?.prospect_id) {
      await admin
        .from("outreach")
        .update({ status: "converted", updated_at: new Date().toISOString() })
        .eq("prospect_id", code.prospect_id);
    }
  } catch (e) {
    console.error("[fulfill] receipt email failed:", e instanceof Error ? e.message : e);
  }

  if (code?.id) {
    await admin.from("prospect_codes").update({ status: "paid" }).eq("id", code.id);
  }

  let slug: string | null = null;
  if (siteId) {
    if (selfServe) {
      // Site déjà finalisé pendant l'onboarding → mise en ligne immédiate.
      const base = await slugBaseForSite(admin, siteId, code?.prospect_id ?? null);
      slug = await goLive(admin, siteId, base);
    } else {
      // Outreach : on attribue le site, le slug est choisi sur /welcome/name.
      await admin.from("sites").update({ owner_user_id: userId }).eq("id", siteId);
    }
    // Les 50 € sont payés : le site est DÉBLOQUÉ pour de bon. Sans ce statut,
    // le dashboard/éditeur retombait sur le paywall d'essai après paiement.
    await admin
      .from("sites")
      .update({ billing_status: "active" })
      .eq("id", siteId);
    await admin.from("events").insert({ token, site_id: siteId, type: "purchased" });
  }

  return { email, token, siteId, userId, selfServe, slug };
}

/** Slug courant d'un site (pour le retour idempotent). */
async function currentSlug(admin: Admin, siteId: string | null): Promise<string | null> {
  if (!siteId) return null;
  const { data } = await admin.from("sites").select("slug").eq("id", siteId).maybeSingle();
  return (data?.slug as string) ?? null;
}

/** Base de slug self-serve : marque de l'onboarding, sinon prénom du prospect. */
export async function slugBaseForSite(
  admin: Admin,
  siteId: string,
  prospectId: string | null,
): Promise<string> {
  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", siteId)
    .maybeSingle();
  const brand = (ob?.intake as { brand?: string } | null)?.brand;
  if (brand) return brand;
  if (prospectId) {
    const { data: p } = await admin
      .from("prospects")
      .select("first_name")
      .eq("id", prospectId)
      .maybeSingle();
    if (p?.first_name) return p.first_name as string;
  }
  return "studio";
}

/**
 * Fulfillment d'un achat de crédits à l'unité (top-up) — IDEMPOTENT
 * (clé = stripe_session_id). Le user est déjà authentifié à l'achat : on lit
 * user_id / credits dans les metadata de la session (jamais le prix côté client).
 */
export async function fulfillTopup(session: Stripe.Checkout.Session): Promise<void> {
  const admin = createAdminClient();
  const userId = (session.metadata?.user_id as string) || null;
  const credits = Number.parseInt((session.metadata?.credits as string) ?? "", 10);
  if (!userId || !Number.isFinite(credits) || credits <= 0) return;

  // Idempotence : si la session est déjà enregistrée, ne rien refaire.
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const { data: payment } = await admin
    .from("payments")
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent: (session.payment_intent as string) ?? null,
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? "eur",
      kind: "topup",
      status: "paid",
    })
    .select("id")
    .single();

  await grantCredits(admin, userId, credits, "topup_purchase", { payment_id: payment?.id });

  // Back-fill du customer id Stripe si absent.
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (customerId) {
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId)
      .is("stripe_customer_id", null);
  }
}
