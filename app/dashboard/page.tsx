import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import GenerationWatcher from "@/components/dashboard/GenerationWatcher";
import { SitePreview } from "@/components/ui/SitePreview";
import { IconCloud } from "@/components/ui/icons";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { MetricsRow } from "@/components/ui/MetricsRow";
import PaywallModal from "@/components/dashboard/PaywallModal";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { PublishButton } from "@/components/dashboard/PublishButton";
import { primarySiteForUser } from "@/lib/primary-site";
import { loadOrCreateEditableSnapshot, loadPublishedSnapshot } from "@/lib/site-content-store";

export const dynamic = "force-dynamic";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }) : "—";

export default async function MonSite({
  searchParams,
}: {
  searchParams: Promise<{ paywall?: string; fromChat?: string }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();
  const sp = await searchParams;

  // Site PRINCIPAL (live/payé d'abord) : un brouillon plus récent ne doit
  // jamais masquer le site débloqué (sinon → paywall d'essai à tort).
  const site = await primarySiteForUser<{
    id: string;
    slug: string | null;
    status: string;
    template_id: string | null;
    published_at: string | null;
    created_at: string;
    billing_status: string | null;
    trial_ends_at: string | null;
  }>(admin, user.id, "id, slug, template_id, published_at, created_at, trial_ends_at");
  const balance = await getBalance(admin, user.id);

  const { data: ob } = site
    ? await admin
        .from("site_onboarding")
        .select("intake")
        .eq("site_id", site.id)
        .maybeSingle()
    : { data: null };
  const firstName =
    ((ob?.intake as { brand?: string } | null)?.brand ?? "").split(" ")[0] || null;

  if (!site) {
    return (
      <>
        <PageHeader title="Mon site" subtitle="Votre portfolio, en un coup d'œil." />
        <EmptyState
          icon={<IconCloud />}
          title="Votre site arrive bientôt"
          description="Notre équipe prépare votre portfolio. Vous recevrez un lien dès qu'il est prêt."
        />
      </>
    );
  }

  const [{ data: notes }, { data: job }, { data: genJob }, { data: lastContent }] =
    await Promise.all([
      admin
        .from("notes")
        .select("id, message, status, created_at, resulting_content_version")
        .eq("site_id", site.id)
        .order("created_at", { ascending: false })
        .limit(50),
      // Jobs opérateur (create/modify) — bannière « Claude travaille ».
      admin
        .from("jobs")
        .select("status")
        .eq("site_id", site.id)
        .neq("type", "generate_site")
        .in("status", ["pending", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Dernier job de génération de site (tous statuts) — surveillé côté client.
      admin
        .from("jobs")
        .select("status")
        .eq("site_id", site.id)
        .eq("type", "generate_site")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("site_content")
        .select("version, created_at")
        .eq("site_id", site.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const allNotes = notes ?? [];
  const inProgress = allNotes.filter((n) => n.status === "open" || n.status === "in_progress").length;
  // Génération de site en cours : on ne propose pas de publier un site partiel
  // (le GenerationWatcher affiche déjà la bannière « en construction »).
  const building = genJob?.status === "pending" || genJob?.status === "running";
  const isLive = site.status === "live" && !!site.slug;
  const billing = (site.billing_status as string) ?? "none";
  // 1 site / N peaux : verrou = site ni en ligne ni débloqué (jamais souscrit).
  const locked = !isLive && ["none", "canceled", "payment_failed"].includes(billing);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const fullUrl = site.slug ? `${appUrl}/s/${site.slug}` : "";

  // Peau EN COURS D'ÉDITION (garantie d'avoir un snapshot) vs peau EN LIGNE.
  // L'aperçu du dashboard reflète ce que le client prépare ; un badge signale
  // les modifications non encore publiées.
  const currentSkin = site.template_id
    ? await loadOrCreateEditableSnapshot(admin, appUrl, site.id, site.template_id)
    : null;
  const publishedSkin = await loadPublishedSnapshot(admin, site.id);
  const hasUnpublishedSkin =
    !!currentSkin &&
    (currentSkin.template_id !== (publishedSkin?.template_id ?? null) || !currentSkin.is_published);

  // Badge de statut affiché sur le hero sombre (façon tier Traaaction).
  const statusBadge: { text: string; tone: "violet" | "amber" | "blue" | "gray" | "emerald" } =
    isLive && !hasUnpublishedSkin
      ? { text: "En ligne", tone: "emerald" }
      : isLive && hasUnpublishedSkin
        ? { text: "Non publié", tone: "amber" }
        : site.status === "revealed"
          ? { text: "Aperçu prêt", tone: "violet" }
          : { text: "En préparation", tone: "gray" };

  return (
    <>
      <PageHeader
        title="Mon site"
        subtitle="Votre portfolio, en un coup d'œil."
      />

      {billing === "trialing" && site.trial_ends_at && (
        <TrialBanner siteId={site.id} trialEndsAt={site.trial_ends_at as string} />
      )}

      {/* Hero sombre — réplique de la bannière revenue Traaaction */}
      <HeroBanner
        label="Votre portfolio"
        value={firstName || "Mon site"}
        badge={statusBadge}
        right={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {site.slug && (
              <code className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-200 ring-1 ring-inset ring-white/10">
                /s/{site.slug}
              </code>
            )}
            {isLive && fullUrl && (
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-colors hover:bg-gray-100"
              >
                Voir le site →
              </a>
            )}
          </div>
        }
      />

      {job && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <Spinner size={18} />
          <span className="text-[15px] font-medium text-gray-900">
            Claude travaille sur votre site… La mise à jour apparaîtra dans un instant.
          </span>
        </div>
      )}

      {/* Génération du site en tâche de fond (flux onboarding IA) — poll + relance. */}
      <GenerationWatcher
        siteId={site.id}
        initialStatus={(genJob?.status as string) ?? "none"}
      />

      {/* Aperçu de la peau en cours d'édition (ce que le client prépare) */}
      <div className="card-hover mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {currentSkin || lastContent ? (
          <SitePreview src={`/api/preview?siteId=${site.id}`} />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gray-50 text-center text-sm text-gray-400">
            {site.status === "revealed"
              ? "Votre aperçu est prêt — mettez-le en ligne pour le rendre public."
              : "Votre site est en préparation."}
          </div>
        )}
      </div>

      {/* Actions */}
      {isLive && hasUnpublishedSkin && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PublishButton siteId={site.id} balance={balance} />
          {fullUrl && (
            <Button href={fullUrl} variant="subtle" target="_blank">
              Voir la version en ligne →
            </Button>
          )}
        </div>
      )}

      {isLive && !hasUnpublishedSkin && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/editor">Modifier mon site</Button>
        </div>
      )}

      {!isLive && (
        <div className="mt-4 flex flex-wrap gap-3">
          {(currentSkin || lastContent) && (
            <Button href={`/api/preview?siteId=${site.id}`} variant="subtle" target="_blank">
              Visualiser mon site →
            </Button>
          )}
          {!building &&
            (locked ? (
              <PaywallModal
                siteId={site.id}
                firstName={firstName}
                defaultOpen={Boolean(sp.paywall) || Boolean(sp.fromChat)}
                trigger={<Button>Publier mon site</Button>}
              />
            ) : (
              lastContent && <Button href="/editor">Modifier mon site</Button>
            ))}
          {!building && locked && lastContent && (
            <PaywallModal
              siteId={site.id}
              firstName={firstName}
              trigger={<Button variant="subtle">Modifier mon site</Button>}
            />
          )}
        </div>
      )}

      {/* KPI façon Traaaction (carte unique découpée en colonnes) */}
      <div className="mt-6">
        <MetricsRow
          metrics={[
            { label: "Crédits disponibles", value: balance, tone: "violet" },
            { label: "Modifications en cours", value: inProgress, tone: "indigo" },
            { label: "Dernière mise à jour", value: fmtDate(lastContent?.created_at), tone: "sky" },
          ]}
        />
      </div>

      {/* Activité récente */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Activité récente
          </h2>
        </div>
        {allNotes.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500">
            Aucune demande pour l'instant. Quand vous demanderez une modification, son suivi apparaîtra ici.
          </Card>
        ) : (
          <div className="space-y-2">
            {allNotes.slice(0, 3).map((n) => (
              <Card key={n.id} className="card-hover flex items-start justify-between gap-4 p-4">
                <p className="line-clamp-2 text-sm text-gray-600">{n.message}</p>
                <StatusPill status={n.status} kind="note" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
