import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chat } from "@/lib/mistral";
import { generateRecipe, type AgenceurInput } from "@/lib/foundry/agenceur";
import { markPlaceholders } from "@/lib/foundry/placeholders";
import { repairCharte } from "@/lib/foundry/charte";
import {
  FOUNDRY_TEMPLATE_ID,
  ensureFoundryTemplateRow,
  recipeCards,
  saveRecipeDraft,
} from "@/lib/foundry/server";

export const maxDuration = 90;

/**
 * Assemble un site (tunnel /creer) : l'agenceur Mistral choisit les composants
 * et rédige les textes, le serveur garantit une recette valide (réparation +
 * repli) — la génération ne peut pas échouer. Réutilise le brouillon foundry
 * existant du compte (pas de sites fantômes en relançant le tunnel).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
  const vibeId = typeof body?.vibeId === "string" ? body.vibeId : "";
  const accent = typeof body?.accent === "string" ? body.accent : undefined;
  // Avis clients : false = le client n'en a pas → aucune section avis.
  const hasReviews = typeof body?.hasReviews === "boolean" ? body.hasReviews : undefined;
  // Charte sur mesure (spec d'échange du tunnel) : JAMAIS prise telle quelle —
  // re-réparée serveur (contrastes, saturation, fonts en liste blanche).
  const customVibe =
    body?.charteSpec && typeof body.charteSpec === "object"
      ? repairCharte(body.charteSpec)
      : undefined;
  if (brief.length < 10 || brief.length > 2000) {
    return NextResponse.json({ error: "Décrivez votre activité en quelques phrases (10 caractères minimum)." }, { status: 400 });
  }
  if (!businessName || businessName.length > 80) {
    return NextResponse.json({ error: "Le nom de votre activité est requis." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Client déjà en ligne : on ne crée pas un site fantôme par-dessus.
  const { data: liveSite } = await admin
    .from("sites")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("status", "live")
    .limit(1)
    .maybeSingle();
  if (liveSite?.id) return NextResponse.json({ redirect: "/dashboard" });

  const input: AgenceurInput = { brief, businessName, vibeId, accent, customVibe, hasReviews };
  const { recipe: generated, source } = await generateRecipe(input, chat);
  // Marque d'emblée les sections « à personnaliser » (avis/chiffres/galerie) —
  // l'aperçu du reveal les entoure. La passe links/ les raffine avec le collecté.
  const recipe = markPlaceholders(generated);

  try {
    await ensureFoundryTemplateRow(admin);

    // Réutilise le brouillon foundry du compte s'il existe (relance du tunnel).
    const { data: draft } = await admin
      .from("sites")
      .select("id")
      .eq("owner_user_id", user.id)
      .eq("template_id", FOUNDRY_TEMPLATE_ID)
      .neq("status", "live")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let siteId = draft?.id as string | undefined;
    if (!siteId) {
      const { data: created, error } = await admin
        .from("sites")
        .insert({ owner_user_id: user.id, template_id: FOUNDRY_TEMPLATE_ID, status: "draft" })
        .select("id")
        .single();
      if (error) throw new Error(`création du site : ${error.message}`);
      siteId = created.id as string;
    }

    await saveRecipeDraft(admin, siteId!, recipe, { brief, businessName });

    // Marque du site (slug à la mise en ligne + prénom dashboard) — même
    // canal que le tunnel chat (site_onboarding.intake.brand).
    await admin
      .from("site_onboarding")
      .upsert({ site_id: siteId, intake: { brand: businessName, brief } }, { onConflict: "site_id" });

    return NextResponse.json({
      ok: true,
      siteId,
      source,
      vibeId: recipe.vibe,
      cards: recipeCards(recipe),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assemblage impossible.";
    console.error("[foundry/generate]", message);
    return NextResponse.json({ error: "Assemblage impossible pour le moment. Réessayez." }, { status: 500 });
  }
}
