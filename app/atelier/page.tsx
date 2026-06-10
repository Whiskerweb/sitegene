import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { FOUNDRY_TEMPLATE_ID } from "@/lib/foundry/server";
import { loadStudioData } from "@/components/foundry/studio/load";
import StudioEditor from "@/components/foundry/studio/StudioEditor";

export const dynamic = "force-dynamic";

/**
 * « L'Atelier » — éditeur visuel plein écran d'un site assemblé (fonderie).
 * Réservé au propriétaire d'un site foundry ; sinon retour au dashboard.
 */
export default async function AtelierPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const { page } = await searchParams;

  const site = await primarySiteForUser<{
    id: string;
    slug: string | null;
    status: string;
    billing_status: string | null;
    template_id: string | null;
  }>(admin, user.id, "id, slug, status, template_id");
  if (!site || site.template_id !== FOUNDRY_TEMPLATE_ID) redirect("/dashboard");

  const { data: ob } = await admin
    .from("site_onboarding")
    .select("intake")
    .eq("site_id", site.id)
    .maybeSingle();
  const businessName = ((ob?.intake as { brand?: string } | null)?.brand ?? "").trim();

  let data = await loadStudioData(admin, user.id, site, businessName, page ?? null);
  // Page demandée introuvable → on retombe sur l'accueil plutôt qu'une 404.
  if (!data && page) data = await loadStudioData(admin, user.id, site, businessName, null);
  if (!data) redirect("/dashboard");

  return <StudioEditor data={data} />;
}
