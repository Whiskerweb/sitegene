"use client";

import { useState } from "react";
import { LibraryGrid } from "./LibraryGrid";
import type { SitePhoto } from "@/lib/site-photos";
import { SitePreview } from "@/components/ui/SitePreview";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { IconAlert } from "@/components/ui/icons";

type Effect = {
  id: string;
  name: string;
  description: string;
  accentFrom: string;
  accentTo: string;
  kind: "global" | "component";
};

type SiteItem = {
  id: string;
  templateId: string;
  templateName: string;
  status: string;
  isActive: boolean;
  slug: string | null;
  createdAt: string;
};

type Props = {
  defaultTab: string;
  siteId: string;
  initialPhotos: SitePhoto[];
  usedUrls: string[];
  effects: Effect[];
  sites: SiteItem[];
  activeSiteId: string;
};

type Tab = "photos" | "composants" | "sites";

export function LibraryTabs({
  defaultTab,
  siteId,
  initialPhotos,
  usedUrls,
  effects,
  sites,
  activeSiteId,
}: Props) {
  const tab: Tab = (["photos", "composants", "sites"].includes(defaultTab) ? defaultTab : "photos") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(tab);

  return (
    <div>
      {/* Onglets */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.04)] p-1">
        {(["photos", "composants", "sites"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition-colors ${
              activeTab === t
                ? "bg-white text-night shadow-cloud"
                : "text-[rgb(var(--m-muted))] hover:text-night"
            }`}
          >
            {t === "photos" ? "Photos" : t === "composants" ? "Composants" : "Sites"}
            {t === "sites" && sites.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)] px-1.5 py-0.5 text-[11px]">
                {sites.length}
              </span>
            )}
            {t === "composants" && effects.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)] px-1.5 py-0.5 text-[11px]">
                {effects.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "photos" && (
        <LibraryGrid siteId={siteId} initialPhotos={initialPhotos} usedUrls={usedUrls} />
      )}
      {activeTab === "composants" && <EffectsGrid effects={effects} />}
      {activeTab === "sites" && <SitesGrid sites={sites} activeSiteId={activeSiteId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grille des composants (effets) possédés
// ---------------------------------------------------------------------------

function EffectsGrid({ effects }: { effects: Effect[] }) {
  if (effects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300 p-10 text-center">
        <p className="font-archivo text-base font-semibold text-night">Aucun composant pour l'instant</p>
        <p className="mt-1 text-sm text-slate">Débloquez des animations et effets dans la page Formules.</p>
        <Button href="/dashboard/marketplace" size="sm" className="mt-4">
          Découvrir les composants →
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {effects.map((fx) => (
        <div
          key={fx.id}
          className="overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-white"
        >
          {/* Prévisualisation réelle de l'effet via /api/fx-demo */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0b0d14]">
            <iframe
              src={`/api/fx-demo?id=${fx.id}`}
              title={fx.name}
              loading="lazy"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-archivo text-sm font-semibold text-night">{fx.name}</p>
              <Badge tone={fx.kind === "global" ? "neutral" : "brand"}>
                {fx.kind === "global" ? "Global" : "Composant"}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate">{fx.description}</p>
            <Button href="/editor" variant="ghost" size="sm" className="mt-3 w-full">
              Utiliser dans l'éditeur →
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grille des sites
// ---------------------------------------------------------------------------

type SyncModal = { targetId: string; targetName: string } | null;

function SitesGrid({ sites, activeSiteId }: { sites: SiteItem[]; activeSiteId: string }) {
  const [syncModal, setSyncModal] = useState<SyncModal>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doSwitch(targetId: string, sync: boolean) {
    setSwitching(true);
    setError(null);
    try {
      const res = await fetch("/api/site/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetSiteId: targetId, sync }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Erreur lors du changement de site.");
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setSwitching(false);
      setSyncModal(null);
    }
  }

  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300 p-10 text-center">
        <p className="font-archivo text-base font-semibold text-night">Aucun site dans la bibliothèque</p>
        <p className="mt-1 text-sm text-slate">Votre site actuel apparaîtra ici.</p>
      </div>
    );
  }

  // Source de vérité unique : le site retourné par primarySiteForUser.
  // On ignore s.isActive (tous à true après la migration par défaut).
  const activeSites = sites.filter((s) => s.id === activeSiteId);
  const librarySites = sites.filter((s) => s.id !== activeSiteId);

  return (
    <>
      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#fde8e8] px-4 py-2.5 text-sm text-danger">
          <IconAlert size={16} /> {error}
        </p>
      )}

      {activeSites.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-archivo text-sm font-semibold uppercase tracking-wide text-[rgb(var(--m-muted))]">
            Site actif
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSites.map((s) => (
              <SiteCard key={s.id} site={s} isActive onSwitch={() => {}} />
            ))}
          </div>
        </div>
      )}

      {librarySites.length > 0 && (
        <div>
          <h2 className="mb-3 font-archivo text-sm font-semibold uppercase tracking-wide text-[rgb(var(--m-muted))]">
            Bibliothèque
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {librarySites.map((s) => (
              <SiteCard
                key={s.id}
                site={s}
                isActive={false}
                onSwitch={() => setSyncModal({ targetId: s.id, targetName: s.templateName })}
              />
            ))}
          </div>
        </div>
      )}

      {syncModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-4"
          onClick={() => !switching && setSyncModal(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-[22px] border border-sky-300 bg-white p-7 shadow-cloud"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-archivo text-lg font-semibold text-night">
              Passer à «&nbsp;{syncModal.targetName}&nbsp;» ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Votre site actuel sera conservé dans la bibliothèque. Souhaitez-vous
              copier votre contenu (textes et photos) vers ce nouveau site ?
            </p>
            <p className="mt-3 text-[13px] text-mist">
              Si vous choisissez <b>Non</b>, le nouveau site partira du contenu par défaut du template.
            </p>

            {switching ? (
              <div className="mt-6 flex justify-center gap-2 text-sm text-slate">
                <Spinner size={16} /> Changement en cours…
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setSyncModal(null)}>
                  Annuler
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => void doSwitch(syncModal.targetId, false)}
                >
                  Non, repartir de zéro
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => void doSwitch(syncModal.targetId, true)}
                >
                  Oui, copier le contenu
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SiteCard({
  site,
  isActive,
  onSwitch,
}: {
  site: SiteItem;
  isActive: boolean;
  onSwitch: () => void;
}) {
  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-white">
      {/* Prévisualisation réelle du site via /api/preview */}
      <div className="relative overflow-hidden rounded-t-2xl border-b border-[rgb(var(--m-line))]">
        <SitePreview src={`/api/preview?siteId=${site.id}`} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-archivo text-sm font-semibold text-night leading-snug">{site.templateName}</p>
          {isActive && <Badge tone="brand">Actif</Badge>}
        </div>
        {site.slug && (
          <p className="mt-0.5 text-[12px] text-slate">/s/{site.slug}</p>
        )}
        <p className="mt-1 text-[12px] text-mist">Créé le {fmtDate(site.createdAt)}</p>
        {isActive ? (
          <Button href="/editor" size="sm" variant="ghost" className="mt-3 w-full">
            Modifier →
          </Button>
        ) : (
          <Button size="sm" className="mt-3 w-full" onClick={onSwitch}>
            Activer ce site →
          </Button>
        )}
      </div>
    </div>
  );
}
