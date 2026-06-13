import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { hasActiveSubscription } from "@/lib/subscription";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { IconSettings } from "@/components/ui/icons";
import { CustomDomainCard } from "@/components/settings/CustomDomainCard";
import { SiteNameCard } from "@/components/settings/SiteNameCard";

export const dynamic = "force-dynamic";

const templateNames: Record<string, string> = {
  "alice-r": "Aurelia — sombre & chaud",
  potozon: "Potozon — pop & coloré",
  target: "Target — éditorial & net",
};

export default async function Settings() {
  const user = await requireUser();
  const admin = createAdminClient();
  const site = await primarySiteForUser<{
    slug: string | null;
    custom_domain: string | null;
    template_id: string | null;
    status: string;
    slug_changed_at: string | null;
  }>(admin, user.id, "slug, custom_domain, template_id, slug_changed_at");

  if (!site) {
    return (
      <>
        <PageHeader title="Paramètres" />
        <EmptyState icon={<IconSettings />} title="Aucun site pour l'instant" />
      </>
    );
  }

  const isSubscribed = await hasActiveSubscription(admin, user.id);

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Les réglages de votre site." />

      <div className="space-y-5">
        {site.status === "live" && site.slug ? (
          <SiteNameCard slug={site.slug} slugChangedAt={site.slug_changed_at} />
        ) : (
          <Card className="p-6">
            <h2 className="font-archivo text-base font-semibold text-night">Nom & adresse</h2>
            <p className="mt-1 text-sm text-slate">L'adresse publique de votre portfolio.</p>
            <p className="mt-3 text-[13px] text-mist">
              Vous choisirez votre nom <code className="text-night">name.akyra.io</code> au moment de
              la mise en ligne de votre site.
            </p>
          </Card>
        )}

        <CustomDomainCard isSubscribed={isSubscribed} currentDomain={site.custom_domain} />

        <Card className="p-6">
          <h2 className="font-archivo text-base font-semibold text-night">Design</h2>
          <p className="mt-1 text-sm text-slate">Le modèle de votre site.</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 text-sm text-night">
              {templateNames[site.template_id ?? ""] ?? site.template_id ?? "—"}
            </span>
            <Button href="/dashboard/bibliotheque?tab=sites" variant="ghost" size="sm">
              Changer de site
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
