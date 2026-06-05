import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { listSitePhotos, collectUsedPhotoUrls } from "@/lib/site-photos";
import { ownedEffectModules } from "@/lib/marketplace-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { LibraryTabs } from "./LibraryTabs";

export const dynamic = "force-dynamic";

const TEMPLATE_NAMES: Record<string, string> = {
  "alice-r": "Aurelia — sombre & chaud",
  potozon: "Potozon — pop & coloré",
  target: "Target — éditorial & net",
  "wedding-fine-art": "Wedding Fine Art",
  "wedding-romantic": "Wedding Romantic",
  "arelec": "Arelec — électriciens",
  "eloctix": "Eloctix — électriciens",
};

export default async function Bibliotheque({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const sp = await searchParams;
  const defaultTab = sp.tab ?? "photos";

  // Site actif (pour identifier lequel est le principal).
  const primarySite = await primarySiteForUser<{ id: string }>(admin, user.id, "id");

  // Tous les sites du client.
  // is_active n'existe qu'après la migration 0019 ; on sélectionne sans cette
  // colonne pour éviter une erreur 400 en prod avant son application.
  const { data: allSites } = await admin
    .from("sites")
    .select("id, template_id, status, created_at, slug")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Photos du site actif.
  const photos = primarySite ? await listSitePhotos(admin, primarySite.id) : [];
  const usedUrls = primarySite
    ? (() => {
        // Fetch inline is not async here — skip used detection for library
        return [] as string[];
      })()
    : [];

  // Effets possédés.
  const ownedEffects = await ownedEffectModules(admin, user.id);

  const sites = (allSites ?? []).map((s) => ({
    id: s.id as string,
    templateId: (s.template_id as string) ?? "",
    templateName: TEMPLATE_NAMES[(s.template_id as string) ?? ""] ?? (s.template_id as string) ?? "Site",
    status: (s.status as string) ?? "draft",
    // Avant migration 0019 : le site primaire est considéré actif.
    isActive: ("is_active" in s ? (s.is_active as boolean) : null) ?? (s.id === primarySite?.id),
    slug: (s.slug as string | null) ?? null,
    createdAt: (s.created_at as string) ?? "",
  }));

  const effects = ownedEffects.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    accentFrom: e.accent.from,
    accentTo: e.accent.to,
    kind: e.kind as "global" | "component",
  }));

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle="Vos photos, composants et sites."
      />
      <LibraryTabs
        defaultTab={defaultTab}
        siteId={primarySite?.id ?? ""}
        initialPhotos={photos}
        usedUrls={usedUrls}
        effects={effects}
        sites={sites}
        activeSiteId={primarySite?.id ?? ""}
      />
    </>
  );
}
