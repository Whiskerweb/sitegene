import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { BorderBeam } from "@/components/ui/border-beam";
import { SitePreview } from "@/components/ui/SitePreview";
import { SiteActions } from "@/components/ui/SiteActions";
import { IconCloud } from "@/components/ui/icons";
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

  const [{ data: notes }, { data: job }, { data: lastContent }] = await Promise.all([
    admin
      .from("notes")
      .select("id, message, status, created_at, resulting_content_version")
      .eq("site_id", site.id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("jobs")
      .select("status")
      .eq("site_id", site.id)
      .in("status", ["pending", "running"])
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

  return (
    <>
      <PageHeader
        title="Mon site"
        subtitle="Votre portfolio, en un coup d'œil."
      />

      {billing === "trialing" && site.trial_ends_at && (
        <TrialBanner siteId={site.id} trialEndsAt={site.trial_ends_at as string} />
      )}

      {job && (
        <GlassCard className="mb-6 flex items-center gap-3 border border-sky-300 p-4">
          <Spinner size={18} />
          <span className="text-[15px] font-medium text-night">
            Claude travaille sur votre site… La mise à jour apparaîtra dans un instant.
          </span>
        </GlassCard>
      )}

      {/* Hero site */}
      <GlassCard className="relative overflow-hidden p-6 md:p-7">
        <BorderBeam size={320} duration={8} borderWidth={2} colorFrom="#8b6bff" colorTo="#e8b468" />
        <BorderBeam size={320} duration={8} delay={4} borderWidth={2} colorFrom="#6d4aff" colorTo="#3de0a0" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusPill status={site.status} kind="site" />
            {site.slug && (
              <code className="rounded-lg border border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.06)] px-3 py-1.5 text-sm text-[rgb(var(--m-muted))]">
                /s/{site.slug}
              </code>
            )}
            {/* Statut de la peau en préparation vs en ligne. */}
            {currentSkin && (
              hasUnpublishedSkin ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/14 px-2.5 py-1 text-xs font-semibold text-gold-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> Non publié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-400/12 px-2.5 py-1 text-xs font-semibold text-mint-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-400" /> En ligne
                </span>
              )
            )}
          </div>
          {isLive && (
            <SiteActions editHref="/editor" viewHref="/apercu" link={fullUrl} />
          )}
        </div>

        {/* Aperçu de la peau EN COURS D'ÉDITION (ce que le client prépare). */}
        <div className="mt-5 overflow-hidden rounded-[18px] border border-sky-300 bg-white">
          {currentSkin || lastContent ? (
            <SitePreview src={`/api/preview?siteId=${site.id}`} />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-surface-2 text-center text-sm text-mist">
              {site.status === "revealed"
                ? "Votre aperçu est prêt — mettez-le en ligne pour le rendre public."
                : "Votre site est en préparation."}
            </div>
          )}
        </div>

        {/* Site en ligne : publier les modifications de peau non encore publiées. */}
        {isLive && hasUnpublishedSkin && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PublishButton siteId={site.id} balance={balance} />
            {fullUrl && (
              <Button href={fullUrl} variant="subtle" target="_blank">
                Voir la version en ligne →
              </Button>
            )}
          </div>
        )}

        {!isLive && (
          <div className="mt-5 flex flex-wrap gap-3">
            {locked ? (
              <PaywallModal
                siteId={site.id}
                firstName={firstName}
                defaultOpen={Boolean(sp.paywall) || Boolean(sp.fromChat)}
                trigger={<Button>Publier mon site</Button>}
              />
            ) : (
              lastContent && <Button href="/editor">Modifier mon site</Button>
            )}
            {locked && lastContent && (
              <PaywallModal
                siteId={site.id}
                firstName={firstName}
                trigger={<Button variant="subtle">Modifier mon site</Button>}
              />
            )}
          </div>
        )}
      </GlassCard>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Crédits disponibles" value={balance} tone="blue" />
        <StatCard label="Modifications en cours" value={inProgress} tone="lav" />
        <StatCard
          label="Dernière mise à jour"
          value={<span className="text-[20px]">{fmtDate(lastContent?.created_at)}</span>}
          tone="mint"
        />
      </div>

      {/* Activité récente */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-archivo text-lg font-semibold text-night">Activité récente</h2>
        </div>
        {allNotes.length === 0 ? (
          <Card className="p-6 text-sm text-slate">
            Aucune demande pour l'instant. Quand vous demanderez une modification, son suivi apparaîtra ici.
          </Card>
        ) : (
          <div className="space-y-2">
            {allNotes.slice(0, 3).map((n) => (
              <Card key={n.id} className="flex items-start justify-between gap-4 p-4">
                <p className="line-clamp-2 text-sm text-slate">{n.message}</p>
                <StatusPill status={n.status} kind="note" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
