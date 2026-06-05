import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { listSitePhotos } from "@/lib/site-photos";
import { ownedEffectModules, ownedItems } from "@/lib/marketplace-server";
import { listSiteTemplates, loadPublishedSnapshot } from "@/lib/site-content-store";
import { templateMeta } from "@/lib/templates";
import { PageHeader } from "@/components/ui/PageHeader";
import { LibraryTabs } from "./LibraryTabs";

export const dynamic = "force-dynamic";

function skinName(templateId: string): string {
  const m = templateMeta(templateId);
  return m ? `${m.name} — ${m.style}` : templateId;
}

export default async function Bibliotheque({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const sp = await searchParams;
  const defaultTab = sp.tab ?? "photos";

  // Site unique du client (1 site / N peaux).
  const site = await primarySiteForUser<{ id: string; template_id: string | null }>(
    admin,
    user.id,
    "id, template_id",
  );
  const siteId = site?.id ?? "";

  // Peaux = templates ayant un snapshot + templates achetés (marketplace).
  const [snapshotTpls, owned, published, photos, ownedEffects] = await Promise.all([
    siteId ? listSiteTemplates(admin, siteId) : Promise.resolve([] as string[]),
    ownedItems(admin, user.id),
    siteId ? loadPublishedSnapshot(admin, siteId) : Promise.resolve(null),
    siteId ? listSitePhotos(admin, siteId) : Promise.resolve([]),
    ownedEffectModules(admin, user.id),
  ]);

  const currentTpl = site?.template_id ?? "";
  const liveTpl = published?.template_id ?? null;

  // Union des peaux : snapshots existants + templates possédés + peau courante.
  const ids = new Set<string>([...snapshotTpls, ...owned.templates, ...(currentTpl ? [currentTpl] : [])]);
  const skins = [...ids].map((id) => ({
    templateId: id,
    name: skinName(id),
    isCurrent: id === currentTpl,
    isLive: id === liveTpl,
  }));
  // Peau courante en tête, puis en ligne, puis le reste.
  skins.sort(
    (a, b) => Number(b.isCurrent) - Number(a.isCurrent) || Number(b.isLive) - Number(a.isLive),
  );

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
      <PageHeader title="Bibliothèque" subtitle="Vos photos, composants et templates." />
      <LibraryTabs
        defaultTab={defaultTab}
        siteId={siteId}
        initialPhotos={photos}
        usedUrls={[]}
        effects={effects}
        skins={skins}
      />
    </>
  );
}
