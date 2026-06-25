import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { injectContacts } from "@/lib/foundry/inject";
import { ensurePhotoGallery } from "@/lib/foundry/auto-gallery";
import { applyReviewsPolicy } from "@/lib/foundry/reviews";
import { markPlaceholders } from "@/lib/foundry/placeholders";
import { loadRecipeDraft, saveRecipeDraft } from "@/lib/foundry/server";
import type { Collected, ReviewItem } from "@/lib/foundry/link-catalog";

/** Avis importés : nettoyés et cappés avant injection. */
function sanitizeReviews(raw: unknown): ReviewItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      text: typeof r.text === "string" ? r.text.trim().slice(0, 600) : "",
      name: typeof r.name === "string" ? r.name.trim().slice(0, 60) : "",
      role: typeof r.role === "string" ? r.role.trim().slice(0, 80) : undefined,
      rating: typeof r.rating === "number" && Number.isFinite(r.rating) ? r.rating : undefined,
    }))
    .filter((r) => r.text.length > 0)
    .slice(0, 24);
  return items.length ? items : undefined;
}

export const maxDuration = 30;

type Admin = ReturnType<typeof createAdminClient>;

const STAGING_RE = /\/storage\/v1\/object\/public\/site-photos\/(staging\/[^?#]+)$/i;

/**
 * Adopte un fichier du dépôt anonyme (staging/<draftId>/…) dans le dossier du
 * site : copie Storage + URL réécrite. Indispensable pour que la bibliothèque
 * de l'Atelier (site-photos/<siteId>/) liste les photos de l'onboarding, et
 * pour que isAllowedPhotoUrl accepte ces URLs à l'édition. Idempotent.
 */
async function adoptStagingUrl(admin: Admin, siteId: string, url: string): Promise<string> {
  const m = url.match(STAGING_RE);
  if (!m) return url;
  const from = decodeURIComponent(m[1]);
  const name = from.split("/").pop();
  if (!name) return url;
  const to = `${siteId}/${name}`;
  const { error } = await admin.storage.from("site-photos").copy(from, to);
  if (error && !/exists|duplicate/i.test(error.message)) {
    console.error("[foundry/links] adoption staging échouée :", error.message);
    return url; // l'URL staging reste fonctionnelle (publique)
  }
  return admin.storage.from("site-photos").getPublicUrl(to).data.publicUrl;
}

/**
 * Fusionne les liens & photos collectés (tunnel /creer) dans la recette draft.
 * Déterministe (aucun appel Mistral). Idempotent.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const collected = body?.collected as Collected | undefined;
  if (!siteId || !collected) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (site.status === "live") {
    return NextResponse.json({ error: "Site déjà en ligne." }, { status: 409 });
  }

  const loaded = await loadRecipeDraft(admin, siteId);
  if (!loaded) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });

  const safe: Collected = {
    socials: Array.isArray(collected.socials) ? collected.socials.filter((s) => s?.href) : [],
    contact: collected.contact ?? {},
    booking: collected.booking?.href ? collected.booking : undefined,
    photos: Array.isArray(collected.photos)
      ? collected.photos.filter((p): p is string => typeof p === "string" && !!p).slice(0, 20)
      : [],
    techRider:
      typeof collected.techRider?.href === "string" && collected.techRider.href
        ? { href: collected.techRider.href, name: collected.techRider.name }
        : undefined,
    reviews: sanitizeReviews(collected.reviews),
    hasReviews: typeof collected.hasReviews === "boolean" ? collected.hasReviews : undefined,
    brandLogo: typeof collected.brandLogo === "string" && collected.brandLogo ? collected.brandLogo : undefined,
  };

  // Adoption des fichiers staging → dossier du site (photos + fiche technique + logo).
  safe.photos = await Promise.all(safe.photos.map((url) => adoptStagingUrl(admin, siteId, url)));
  if (safe.techRider) {
    safe.techRider = { ...safe.techRider, href: await adoptStagingUrl(admin, siteId, safe.techRider.href) };
  }
  if (safe.brandLogo) {
    safe.brandLogo = await adoptStagingUrl(admin, siteId, safe.brandLogo);
  }

  // Liens & photos → puis politique d'avis (retrait si « pas d'avis », sinon
  // remplissage) → puis marquage des sections d'exemple restantes (badge aperçu).
  let merged = injectContacts(loaded.recipe, safe);
  merged = applyReviewsPolicy(merged, safe);
  merged = markPlaceholders(merged, safe);
  // Beaucoup de photos fournies → galerie dédiée vers le bas (si pas déjà là),
  // pour qu'aucune photo ne soit perdue (tous métiers).
  merged = ensurePhotoGallery(merged, safe.photos);
  // Logo de marque → recipe.brand.logo (affiché dans navbar/footer du site).
  if (safe.brandLogo) {
    merged = { ...merged, brand: { ...merged.brand, logo: safe.brandLogo } };
  }
  await saveRecipeDraft(admin, siteId, merged, {});

  return NextResponse.json({ ok: true });
}
