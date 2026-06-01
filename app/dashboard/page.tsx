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

export const dynamic = "force-dynamic";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }) : "—";

export default async function MonSite() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: site } = await admin
    .from("sites")
    .select("id, slug, status, template_id, published_at, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const balance = await getBalance(admin, user.id);

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const fullUrl = site.slug ? `${appUrl}/s/${site.slug}` : "";

  return (
    <>
      <PageHeader
        title="Mon site"
        subtitle="Votre portfolio, en un coup d'œil."
      />

      {job && (
        <GlassCard className="mb-6 flex items-center gap-3 border border-sky-300 p-4">
          <Spinner size={18} />
          <span className="text-[15px] font-medium text-night">
            Claude travaille sur votre site… La mise à jour apparaîtra dans un instant.
          </span>
        </GlassCard>
      )}

      {/* Hero site */}
      <GlassCard className="relative overflow-hidden border border-sky-300 p-6 md:p-7">
        <BorderBeam size={320} duration={8} borderWidth={2.5} colorFrom="#2563eb" colorTo="#22d3ee" />
        <BorderBeam size={320} duration={8} delay={4} borderWidth={2.5} colorFrom="#7c3aed" colorTo="#22d3ee" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusPill status={site.status} kind="site" />
            {site.slug && (
              <code className="rounded-lg bg-white/70 px-3 py-1.5 text-sm text-slate">
                /s/{site.slug}
              </code>
            )}
          </div>
          {isLive && (
            <SiteActions editHref="/editor" viewHref="/apercu" link={fullUrl} />
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-[18px] border border-sky-300 bg-white">
          {isLive ? (
            <SitePreview slug={site.slug!} />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-surface-2 text-center text-sm text-mist">
              {site.status === "revealed"
                ? "Votre aperçu est prêt — mettez-le en ligne pour le rendre public."
                : "Votre site est en préparation."}
            </div>
          )}
        </div>

        {!isLive && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/dashboard/modifications" variant="subtle">
              Voir mes options
            </Button>
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
          {allNotes.length > 0 && (
            <a href="/dashboard/modifications" className="text-sm font-semibold text-brand hover:text-brand-700">
              Tout voir →
            </a>
          )}
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
