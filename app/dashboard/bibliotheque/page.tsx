import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { listSitePhotos, collectUsedPhotoUrls } from "@/lib/site-photos";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPhoto } from "@/components/ui/icons";
import { LibraryGrid } from "./LibraryGrid";

export const dynamic = "force-dynamic";

export default async function Bibliotheque() {
  const user = await requireUser();
  const admin = createAdminClient();

  const site = await primarySiteForUser<{ id: string }>(admin, user.id, "id");

  if (!site) {
    return (
      <>
        <PageHeader title="Bibliothèque" />
        <EmptyState
          icon={<IconPhoto />}
          title="Aucun site pour l'instant"
          description="Votre bibliothèque de photos apparaîtra ici une fois votre site créé."
        />
      </>
    );
  }

  const photos = await listSitePhotos(admin, site.id);

  const { data: top } = await admin
    .from("site_content")
    .select("content_json")
    .eq("site_id", site.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const usedUrls = [...collectUsedPhotoUrls(top?.content_json, site.id)];

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle="Vos photos reliées au site. Ajoutez-en, supprimez celles que vous n'utilisez plus."
      />
      <LibraryGrid siteId={site.id} initialPhotos={photos} usedUrls={usedUrls} />
    </>
  );
}
