import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { IconSettings } from "@/components/ui/icons";

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
  }>(admin, user.id, "slug, custom_domain, template_id");

  if (!site) {
    return (
      <>
        <PageHeader title="Paramètres" />
        <EmptyState icon={<IconSettings />} title="Aucun site pour l'instant" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Les réglages de votre site." />

      <div className="space-y-5">
        <Card className="p-6">
          <h2 className="font-archivo text-base font-semibold text-night">Nom & adresse</h2>
          <p className="mt-1 text-sm text-slate">L'adresse publique de votre portfolio.</p>
          <div className="mt-4 flex items-center gap-3">
            <code className="rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 text-sm text-night">
              /s/{site.slug ?? "—"}
            </code>
          </div>
          <p className="mt-3 text-[13px] text-mist">
            Pour changer le nom de votre site, contactez-nous depuis les paramètres.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-archivo text-base font-semibold text-night">
              Domaine personnalisé
            </h2>
            <Badge tone="neutral">Bientôt</Badge>
          </div>
          <p className="mt-1 text-sm text-slate">
            Branchez votre propre nom de domaine (ex : votre-studio.com). Disponible prochainement.
          </p>
          {site.custom_domain && (
            <code className="mt-3 inline-block rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-night">
              {site.custom_domain}
            </code>
          )}
        </Card>

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
