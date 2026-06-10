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

  // Charte effective : preset connu OU charte sur mesure embarquée.
  const vibe = draft ? (draft.recipe.customVibe ?? getVibe(draft.recipe.vibe)) : undefined;
  const cards = draft ? recipeCards(draft.recipe) : [];
  const rareCount = cards.filter((c) => c.rarity !== "common").length;

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

      {/* Aperçu cliquable → ouvre L'Atelier */}
      <a href="/atelier" className="group relative mt-5 block overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {draft ? (
          <SitePreview src={`/site-preview/${site.id}`} />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gray-50 text-center text-sm text-gray-400">
            Votre site n'a pas encore de recette — repassez par la création.
          </div>
        )}
        {draft && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
            <span className="translate-y-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-900 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
              ✏️ Modifier mon site
            </span>
          </div>
        )}
      </a>

      {/* Actions principales */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {draft && <Button href="/atelier">Modifier mon site</Button>}
        {locked ? (
          <PaywallModal
            siteId={site.id}
            firstName={businessName}
            defaultOpen={paywallOpen}
            trigger={<Button variant="subtle">Mettre en ligne</Button>}
          />
        ) : isLive && hasUnpublished ? (
          <PublishButton siteId={site.id} balance={balance} />
        ) : null}
      </div>

      <div className="mt-6">
        <MetricsRow
          metrics={[
            { label: "Crédits disponibles", value: balance, tone: "violet" },
            { label: "Sections du site", value: cards.length, tone: "indigo" },
            { label: "Pièces rares ✦", value: rareCount, tone: "sky" },
          ]}
        />
      </div>

      {/* Invitation à l'éditeur — tout se passe dans L'Atelier */}
      <a
        href="/atelier"
        className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 transition hover:border-violet-300 hover:shadow-md"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            L'Atelier — votre site, à votre main
          </h2>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Changez vos textes et vos photos, déplacez les blocs, remplacez une section par une autre,
            ajustez vos couleurs. Tout en visuel, comme sur une feuille de design.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
          Ouvrir →
        </span>
      </a>
    </>
  );
}
