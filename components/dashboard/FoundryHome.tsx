/**
 * Accueil dashboard d'un site ASSEMBLÉ (fonderie) — minimaliste et concret :
 * 1. l'essentiel en tête (nom, statut, adresse du site cliquable),
 * 2. UNE rangée d'actions (publier si besoin, ouvrir L'Atelier),
 * 3. le site lui-même en objet central (cliquer = éditer),
 * 4. une ligne de méta discrète. Une seule porte vers L'Atelier — pas trois.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { SitePreview } from "@/components/ui/SitePreview";
import PaywallModal from "@/components/dashboard/PaywallModal";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { PublishButton } from "@/components/dashboard/PublishButton";
import { loadRecipeDraft, recipeCards, pagesFromSnapshot } from "@/lib/foundry/server";
import { loadPublishedSnapshot } from "@/lib/site-content-store";
import { publicSiteUrl, prettySiteHost } from "@/lib/site-url";

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
  // Adresse mise en avant = le SOUS-DOMAINE du client (arelec.akyra.io), jamais /a/<slug>.
  const fullUrl = publicSiteUrl(site.slug);
  const prettyUrl = prettySiteHost(site.slug);

  const cards = draft ? recipeCards(draft.recipe) : [];
  const rareCount = cards.filter((c) => c.rarity !== "common").length;
  const pageCount = draft ? pagesFromSnapshot(draft.row).length : 0;

  const status = isLive && !hasUnpublished
    ? { dot: "bg-emerald-500", text: "En ligne" }
    : isLive
      ? { dot: "bg-amber-400", text: "Modifications non publiées" }
      : { dot: "bg-gray-300", text: "Pas encore en ligne" };

  // L'action de mise en ligne prime quand elle existe ; sinon L'Atelier est l'action.
  const needsPublish = isLive && hasUnpublished;

  return (
    <>
      {billing === "trialing" && site.trial_ends_at && (
        <TrialBanner siteId={site.id} trialEndsAt={site.trial_ends_at} />
      )}

      {/* ===== L'essentiel : qui, où, quoi faire ===== */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              {businessName || "Mon site"}
            </h1>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.text}
            </span>
          </div>
          {isLive && fullUrl ? (
            <a href={fullUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline">
              {prettyUrl} ↗
            </a>
          ) : (
            <p className="mt-1 text-sm text-gray-400">Vos visiteurs ne peuvent pas encore le voir.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {locked && (
            <PaywallModal
              siteId={site.id}
              firstName={businessName}
              defaultOpen={paywallOpen}
              trigger={<Button>Mettre en ligne</Button>}
            />
          )}
          {needsPublish && <PublishButton siteId={site.id} balance={balance} />}
          {draft && (
            <Button href="/atelier" variant={locked || needsPublish ? "subtle" : "primary"}>
              Ouvrir L'Atelier
            </Button>
          )}
        </div>
      </div>

      {/* ===== Le site, en objet central — cliquer = éditer ===== */}
      <a href="/atelier" className="group relative mt-6 block overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {draft ? (
          <SitePreview src={`/site-preview/${site.id}`} />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gray-50 text-center text-sm text-gray-400">
            Votre site n'a pas encore de recette — repassez par la création.
          </div>
        )}
        {draft && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <span className="translate-y-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-900 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
              Ouvrir L'Atelier
            </span>
          </div>
        )}
      </a>

      {/* ===== Méta discrète ===== */}
      {draft && (
        <p className="mt-4 text-[13px] text-gray-400">
          {cards.length} sections{pageCount > 0 ? ` · ${pageCount + 1} pages` : ""} · {rareCount} pièce{rareCount > 1 ? "s" : ""} rare{rareCount > 1 ? "s" : ""} ✦ ·{" "}
          <a href="/dashboard/credits" className="underline-offset-2 hover:text-gray-700 hover:underline">{balance} crédits</a>
        </p>
      )}
    </>
  );
}
