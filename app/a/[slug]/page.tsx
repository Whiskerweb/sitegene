import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import Assembler from "@/components/foundry/Assembler";
import { FOUNDRY_TEMPLATE_ID, recipeFromSnapshot, withResolvedNav, type FoundryContent } from "@/lib/foundry/server";
import type { ContentRow } from "@/lib/site-content-store";

export const dynamic = "force-dynamic";

/**
 * Rendu public d'un site ASSEMBLÉ (fonderie) : /a/<slug>.
 * Lit le snapshot publié via le client anon (RLS : contenu publié des sites
 * live lisible par tous) et rend la recette avec l'Assembler (React hydraté —
 * FAQ, count-up et marquees vivent, contrairement aux bundles statiques /s/).
 */
async function loadPublished(slug: string) {
  const supabase = createPublicClient();
  const { data: site } = await supabase
    .from("sites")
    .select("id, template_id, status")
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
  const recipe = recipeFromSnapshot((sc as ContentRow | null) ?? null);
  if (!recipe) return null;
  const meta = (sc?.content_json ?? {}) as Partial<FoundryContent>;
  return { recipe, businessName: meta.__businessName };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPublished(slug);
  const title = data?.businessName?.trim() || "Site";
  return {
    title,
    robots: { index: false, follow: false }, // à lever quand on ouvrira l'indexation des sites clients
  };
}

export default async function FoundrySitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadPublished(slug);
  if (!data) notFound();
  return <Assembler recipe={withResolvedNav(data.recipe, slug)} />;
}
