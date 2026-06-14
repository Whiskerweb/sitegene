import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { isValidSlug, normalizeSlug } from "@/lib/templates";

/** Délai imposé entre deux renommages (le 1er reste libre). */
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Renomme le sous-domaine du site principal (`name.akyra.io`).
 * Règle : le nom par défaut (slug_changed_at NULL) est modifiable librement ;
 * une fois modifié, un nouveau renommage n'est possible que tous les 30 jours.
 * Ouvert à tout site EN LIGNE (le domaine 100 % perso reste réservé au Pro).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();
  const site = await primarySiteForUser<{
    id: string;
    slug: string | null;
    status: string;
    slug_changed_at: string | null;
  }>(admin, user.id, "id, slug, status, slug_changed_at");

  if (!site) {
    return NextResponse.json({ error: "Aucun site." }, { status: 404 });
  }
  if (site.status !== "live") {
    return NextResponse.json(
      { error: "Mettez d'abord votre site en ligne pour choisir son nom." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const slug = normalizeSlug(typeof body?.slug === "string" ? body.slug : "");
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Nom invalide (2–40 caractères, lettres/chiffres)." },
      { status: 400 },
    );
  }

  // Aucun changement réel → succès idempotent.
  if (slug === site.slug) {
    return NextResponse.json({ ok: true, slug, unchanged: true });
  }

  // Cooldown : bloque si le dernier renommage date de moins de 30 jours.
  if (site.slug_changed_at) {
    const elapsed = Date.now() - new Date(site.slug_changed_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const nextChangeAt = new Date(
        new Date(site.slug_changed_at).getTime() + COOLDOWN_MS,
      ).toISOString();
      return NextResponse.json(
        {
          error: "Vous avez déjà changé le nom récemment. Réessayez plus tard.",
          nextChangeAt,
        },
        { status: 429 },
      );
    }
  }

  // Unicité du slug (même garde-fou que le go-live).
  const { data: clash } = await admin
    .from("sites")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash && clash.id !== site.id) {
    return NextResponse.json({ error: "Ce nom est déjà pris." }, { status: 409 });
  }

  const changedAt = new Date().toISOString();
  const { error } = await admin
    .from("sites")
    .update({ slug, slug_changed_at: changedAt })
    .eq("id", site.id);
  if (error) {
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }

  const nextChangeAt = new Date(
    new Date(changedAt).getTime() + COOLDOWN_MS,
  ).toISOString();
  return NextResponse.json({ ok: true, slug, nextChangeAt });
}
