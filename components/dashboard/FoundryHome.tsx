/**
 * Accueil dashboard d'un site ASSEMBLÉ (fonderie) — plug-and-play :
 * aperçu du site, statut/mise en ligne (essai 3 j ou republication), et les
 * sections de la recette en cartes (remplacer / retirer / ajouter).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { MetricsRow } from "@/components/ui/MetricsRow";
import { Button } from "@/components/ui/Button";
import { SitePreview } from "@/components/ui/SitePreview";
import PaywallModal from "@/components/dashboard/PaywallModal";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { PublishButton } from "@/components/dashboard/PublishButton";
import FoundrySections, { type SectionItem } from "@/components/dashboard/FoundrySections";
import { loadRecipeDraft, recipeCards } from "@/lib/foundry/server";
import { loadPublishedSnapshot } from "@/lib/site-content-store";
import { getVibe } from "@/lib/foundry/vibes";

export interface FoundryHomeProps {
  user: { id: string };
  site: {
    id: string;
    slug: string | null;
    status: string;
    billing_status: string | null;
    trial_ends_at: string | null;
  };
  balance: number;
  businessName: string | null;
  paywallOpen: boolean;
}

export default async function FoundryHome({ site, balance, businessName, paywallOpen }: FoundryHomeProps) {
  const admin = createAdminClient();
  const draft = await loadRecipeDraft(admin, site.id);
  const published = await loadPublishedSnapshot(admin, site.id);

  const isLive = site.status === "live" && !!site.slug;
  const billing = site.billing_status ?? "none";
  const locked = !isLive && ["none", "canceled", "payment_failed"].includes(billing);
  const hasUnpublished = !!draft && (!published || published.id !== draft.row.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const fullUrl = site.slug ? `${appUrl}/a/${site.slug}` : "";

  const vibe = draft ? getVibe(draft.recipe.vibe) : undefined;
  const cards = draft ? recipeCards(draft.recipe) : [];
  const rareCount = cards.filter((c) => c.rarity !== "common").length;
  const items: SectionItem[] = cards.map((c, index) => ({
    index,
    component: c.component,
    role: c.role,
    roleLabel: c.roleLabel,
    rarity: c.rarity,
    locked: c.role === "hero" || c.role === "footer",
  }));

  const statusBadge: { text: string; tone: "violet" | "amber" | "blue" | "gray" | "emerald" } =
    isLive && !hasUnpublished
      ? { text: "En ligne", tone: "emerald" }
      : isLive
        ? { text: "Modifications à publier", tone: "amber" }
        : { text: "Prêt à publier", tone: "violet" };

  return (
    <>
      <PageHeader title="Mon site" subtitle="Assemblé en composants — remplacez, ajoutez, publiez." />

      {billing === "trialing" && site.trial_ends_at && (
        <TrialBanner siteId={site.id} trialEndsAt={site.trial_ends_at} />
      )}

      <HeroBanner
        label={vibe ? `Ambiance · ${vibe.label}` : "Votre site"}
        value={businessName || "Mon site"}
        badge={statusBadge}
        right={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {site.slug && (
              <code className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-200 ring-1 ring-inset ring-white/10">
                /a/{site.slug}
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

      {/* Aperçu du brouillon (ce que le client prépare) */}
      <div className="card-hover mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {draft ? (
          <SitePreview src={`/site-preview/${site.id}`} />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gray-50 text-center text-sm text-gray-400">
            Votre site n'a pas encore de recette — repassez par la création.
          </div>
        )}
      </div>

      {/* Actions de publication */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {locked ? (
          <PaywallModal
            siteId={site.id}
            firstName={businessName}
            defaultOpen={paywallOpen}
            trigger={<Button>Publier mon site</Button>}
          />
        ) : isLive && hasUnpublished ? (
          <PublishButton siteId={site.id} balance={balance} />
        ) : null}
        {draft && (
          <Button href={`/site-preview/${site.id}`} variant="subtle" target="_blank">
            Visualiser en plein écran →
          </Button>
        )}
      </div>

      <div className="mt-6">
        <MetricsRow
          metrics={[
            { label: "Crédits disponibles", value: balance, tone: "violet" },
            { label: "Sections du site", value: items.length, tone: "indigo" },
            { label: "Pièces rares ✦", value: rareCount, tone: "sky" },
          ]}
        />
      </div>

      {/* Les sections de la recette — le cœur plug-and-play */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            Les sections de votre site
          </h2>
          <span className="text-sm text-gray-400">
            Remplacez une section par une autre forme — le design reste accordé.
          </span>
        </div>
        {draft ? <FoundrySections siteId={site.id} items={items} /> : null}
      </div>
    </>
  );
}
