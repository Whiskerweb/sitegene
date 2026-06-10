import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chat } from "@/lib/mistral";
import { generateSubPage } from "@/lib/foundry/agenceur";
import {
  FOUNDRY_TEMPLATE_ID,
  loadRecipeDraft,
  pagesFromSnapshot,
  uniquePageSlug,
  saveSitePages,
  saveRecipeDraft,
  addNavLink,
  removeNavLinks,
  renameNavLink,
  ensureNavbar,
  type FoundryPage,
} from "@/lib/foundry/server";

export const maxDuration = 90;

/**
 * Sous-pages d'un site assemblé : créer (l'IA compose une sous-page sur mesure,
 * sans navbar/footer — hérités de l'accueil), supprimer, renommer. À la création
 * on ajoute un lien dans la navbar de l'accueil pour rendre la page accessible.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = typeof body?.siteId === "string" ? body.siteId : "";
  const op = typeof body?.op === "string" ? body.op : "";
  if (!siteId || !["create", "delete", "rename"].includes(op)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }
  if (site.template_id !== FOUNDRY_TEMPLATE_ID) {
    return NextResponse.json({ error: "Ce site n'est pas un site assemblé." }, { status: 400 });
  }

  const draft = await loadRecipeDraft(admin, siteId);
  if (!draft) return NextResponse.json({ error: "Recette introuvable." }, { status: 404 });
  const pages = pagesFromSnapshot(draft.row);
  const meta = draft.row.content_json as { __businessName?: string; __brief?: string } | null;
  const businessName = (meta?.__businessName ?? "").trim();
  const brief = (meta?.__brief ?? "").trim();

  // --- Créer -----------------------------------------------------------------
  if (op === "create") {
    // Demande libre (nouveau tunnel) ; l'ancien client envoyait title+purpose.
    const legacyTitle = typeof body?.title === "string" ? body.title.trim().slice(0, 60) : "";
    const legacyPurpose = typeof body?.purpose === "string" ? body.purpose.trim().slice(0, 1000) : "";
    const request_ = typeof body?.request === "string" ? body.request.trim().slice(0, 1000) : legacyPurpose;
    if (request_.length < 8) return NextResponse.json({ error: "Décrivez la page en quelques mots." }, { status: 400 });
    if (pages.length >= 12) return NextResponse.json({ error: "Maximum 12 pages pour l'instant." }, { status: 409 });

    const generated = await generateSubPage(
      {
        request: request_,
        businessName,
        brief,
        homeComponents: draft.recipe.sections.map((s) => s.component),
        existingTitles: pages.map((p) => p.title),
      },
      chat,
    );
    const { sections, source } = generated;
    const title = uniquePageTitle(legacyTitle || generated.title, pages);
    const slug = uniquePageSlug(title, pages);
    const page: FoundryPage = { id: `p_${randomUUID().slice(0, 8)}`, slug, title, purpose: request_, sections };

    try {
      await saveSitePages(admin, siteId, [...pages, page]);
      // Lien dans la navbar de l'accueil → page accessible aux visiteurs.
      // Sans navbar (la plupart des recettes générées), on en pose une d'abord.
      const ensured = ensureNavbar(draft.recipe, businessName);
      await saveRecipeDraft(admin, siteId, addNavLink(ensured.recipe, title, slug));
      return NextResponse.json({ ok: true, page, source, navbarAdded: ensured.added });
    } catch (e) {
      console.error("[foundry/page] create", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "Création impossible. Réessayez." }, { status: 500 });
    }
  }

  // --- Supprimer -------------------------------------------------------------
  if (op === "delete") {
    const pageId = typeof body?.pageId === "string" ? body.pageId : "";
    const target = pages.find((p) => p.id === pageId);
    if (!target) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    await saveSitePages(admin, siteId, pages.filter((p) => p.id !== pageId));
    await saveRecipeDraft(admin, siteId, removeNavLinks(draft.recipe, target.slug));
    return NextResponse.json({ ok: true });
  }

  // --- Renommer --------------------------------------------------------------
  if (op === "rename") {
    const pageId = typeof body?.pageId === "string" ? body.pageId : "";
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 60) : "";
    const target = pages.find((p) => p.id === pageId);
    if (!target) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    if (title.length < 2) return NextResponse.json({ error: "Titre trop court." }, { status: 400 });
    const others = pages.filter((p) => p.id !== pageId);
    const slug = uniquePageSlug(title, others);
    const updated = { ...target, title, slug };
    await saveSitePages(admin, siteId, pages.map((p) => (p.id === pageId ? updated : p)));
    // Recâble le lien navbar en place (la position du lien est conservée).
    await saveRecipeDraft(admin, siteId, renameNavLink(draft.recipe, target.slug, title, slug));
    return NextResponse.json({ ok: true, page: updated });
  }

  return NextResponse.json({ error: "Opération inconnue." }, { status: 400 });
}

/** Nom d'onglet unique : « Tarifs », « Tarifs 2 », « Tarifs 3 »… */
function uniquePageTitle(title: string, pages: FoundryPage[]): string {
  const taken = new Set(pages.map((p) => p.title.toLowerCase()));
  if (!taken.has(title.toLowerCase())) return title;
  for (let n = 2; n < 20; n++) {
    const t = `${title} ${n}`;
    if (!taken.has(t.toLowerCase())) return t;
  }
  return title;
}
