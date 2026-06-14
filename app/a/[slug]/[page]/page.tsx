import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import Assembler from "@/components/foundry/Assembler";
import {
  FOUNDRY_TEMPLATE_ID,
  recipeFromSnapshot,
  pagesFromSnapshot,
  composePageRecipe,
  withResolvedNav,
  type FoundryContent,
} from "@/lib/foundry/server";
import { hasActiveSubscription } from "@/lib/subscription";
import type { ContentRow } from "@/lib/site-content-store";

export const dynamic = "force-dynamic";

/**
 * Rendu public d'une SOUS-PAGE d'un site assemblé : /a/<slug>/<page>.
 * Réutilise la navbar + le footer de l'accueil (cohérence) avec les sections
 * de la page, sur la charte de l'accueil. Lit le snapshot publié (RLS anon).
 */
async function loadPage(slug: string, pageSlug: string) {
  const supabase = createPublicClient();
  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status, owner_user_id")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (!site || site.template_id !== FOUNDRY_TEMPLATE_ID) return null;

  const { data: sc } = await supabase
    .from("site_content")
    .select("id, site_id, template_id, version, content_json, is_published")
    .eq("site_id", site.id)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = (sc as ContentRow | null) ?? null;
  const home = recipeFromSnapshot(row);
  if (!home) return null;
  const page = pagesFromSnapshot(row).find((p) => p.slug === pageSlug);
  if (!page) return null;
  const meta = (sc?.content_json ?? {}) as Partial<FoundryContent>;
  const ownerId = (site as { owner_user_id?: string | null }).owner_user_id ?? null;
  const isSubscribed = ownerId
    ? await hasActiveSubscription(createAdminClient(), ownerId)
    : false;
  return {
    recipe: composePageRecipe(home, page),
    title: page.title,
    businessName: meta.__businessName,
    isSubscribed,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const data = await loadPage(slug, page);
  const title = data ? `${data.title} · ${data.businessName?.trim() || "Site"}` : "Page";
  return { title, robots: { index: false, follow: false } };
}

export default async function FoundrySubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const data = await loadPage(slug, page);
  if (!data) notFound();
  return <Assembler recipe={withResolvedNav(data.recipe, slug)} showBranding={!data.isSubscribed} />;
}
