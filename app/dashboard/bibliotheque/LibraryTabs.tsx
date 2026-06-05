"use client";

import { useState } from "react";
import { LibraryGrid } from "./LibraryGrid";
import type { SitePhoto } from "@/lib/site-photos";
import { SitePreview } from "@/components/ui/SitePreview";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { IconAlert, IconCheck } from "@/components/ui/icons";

type Effect = {
  id: string;
  name: string;
  description: string;
  accentFrom: string;
  accentTo: string;
  kind: "global" | "component";
};

type Skin = {
  templateId: string;
  name: string;
  isCurrent: boolean;
  isLive: boolean;
};

type SyncReport = {
  transcribed: string[];
  unmatchedFromSource: string[];
  emptyInTarget: string[];
};

type Props = {
  defaultTab: string;
  siteId: string;
  initialPhotos: SitePhoto[];
  usedUrls: string[];
  effects: Effect[];
  skins: Skin[];
};

type Tab = "photos" | "composants" | "templates";

export function LibraryTabs({ defaultTab, siteId, initialPhotos, usedUrls, effects, skins }: Props) {
  const tab: Tab = (["photos", "composants", "templates"].includes(defaultTab)
    ? defaultTab
    : "photos") as Tab;
  // Compat ancien lien ?tab=sites → templates.
  const initial: Tab = defaultTab === "sites" ? "templates" : tab;
  const [activeTab, setActiveTab] = useState<Tab>(initial);

  const labels: Record<Tab, string> = {
    photos: "Photos",
    composants: "Composants",
    templates: "Templates",
  };

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.04)] p-1">
        {(["photos", "composants", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              activeTab === t ? "bg-white text-night shadow-cloud" : "text-[rgb(var(--m-muted))] hover:text-night"
            }`}
          >
            {labels[t]}
            {t === "templates" && skins.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)] px-1.5 py-0.5 text-[11px]">
                {skins.length}
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
      {activeTab === "templates" && <SkinsGrid skins={skins} siteId={siteId} />}
    </div>
  );
}

// --- Composants possédés ----------------------------------------------------

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
        <div key={fx.id} className="overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-white">
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

// --- Galerie de peaux (templates) -------------------------------------------

type Choice = { templateId: string; name: string } | null;

function SkinsGrid({ skins, siteId }: { skins: Skin[]; siteId: string }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{ name: string; report: SyncReport } | null>(null);

  async function activate(templateId: string, sync: boolean, name: string) {
    setBusy(true);
    setError(null);
    try {
      const url = sync ? "/api/site/template/sync" : "/api/site/template/activate";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Action impossible pour le moment.");
        setChoice(null);
        return;
      }
      if (sync && json.report) {
        // Afficher le rapport avant de filer à l'éditeur.
        setChoice(null);
        setReport({ name, report: json.report as SyncReport });
        return;
      }
      window.location.href = "/editor";
    } finally {
      setBusy(false);
    }
  }

  if (skins.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300 p-10 text-center">
        <p className="font-archivo text-base font-semibold text-night">Aucun template pour l'instant</p>
        <p className="mt-1 text-sm text-slate">Votre template actuel et ceux que vous achetez apparaîtront ici.</p>
        <Button href="/dashboard/marketplace" size="sm" className="mt-4">
          Explorer les templates →
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#fde8e8] px-4 py-2.5 text-sm text-danger">
          <IconAlert size={16} /> {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skins.map((s) => (
          <div
            key={s.templateId}
            className="overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-white"
          >
            <div className="relative overflow-hidden border-b border-[rgb(var(--m-line))]">
              <SitePreview src={`/api/preview?siteId=${siteId}&templateId=${s.templateId}`} />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-archivo text-sm font-semibold leading-snug text-night">{s.name}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {s.isCurrent && <Badge tone="brand">En édition</Badge>}
                  {s.isLive && <Badge tone="success">En ligne</Badge>}
                </div>
              </div>
              {s.isCurrent ? (
                <Button href="/editor" size="sm" variant="ghost" className="mt-3 w-full">
                  Modifier →
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setChoice({ templateId: s.templateId, name: s.name })}
                >
                  Utiliser ce template →
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modale : activer / synchroniser */}
      {choice && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-4"
          onClick={() => !busy && setChoice(null)}
        >
          <div
            className="w-full max-w-[460px] rounded-[22px] border border-sky-300 bg-white p-7 shadow-cloud"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-archivo text-lg font-semibold text-night">
              Passer à «&nbsp;{choice.name}&nbsp;» ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Voulez-vous que l'IA reprenne automatiquement vos textes et photos sur ce nouveau
              template, ou démarrer à partir de son contenu d'origine ?
            </p>

            {busy ? (
              <div className="mt-6 flex justify-center gap-2 text-sm text-slate">
                <Spinner size={16} /> Application en cours…
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                <Button onClick={() => void activate(choice.templateId, true, choice.name)}>
                  Oui, synchroniser mon contenu
                </Button>
                <Button variant="ghost" onClick={() => void activate(choice.templateId, false, choice.name)}>
                  Non, garder ce template tel quel
                </Button>
                <button
                  type="button"
                  className="mt-1 text-center text-[13px] text-mist hover:text-slate"
                  onClick={() => setChoice(null)}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rapport de synchronisation */}
      {report && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-4">
          <div className="w-full max-w-[480px] rounded-[22px] border border-sky-300 bg-white p-7 shadow-cloud">
            <h3 className="font-archivo text-lg font-semibold text-night">
              Contenu repris sur «&nbsp;{report.name}&nbsp;»
            </h3>

            {report.report.transcribed.length > 0 && (
              <ReportBlock
                tone="ok"
                title="Repris avec succès"
                items={report.report.transcribed}
              />
            )}
            {report.report.emptyInTarget.length > 0 && (
              <ReportBlock
                tone="warn"
                title="Sections de ce template sans contenu fourni"
                items={report.report.emptyInTarget}
                note="Vous pourrez les remplir ou les masquer dans l'éditeur."
              />
            )}
            {report.report.unmatchedFromSource.length > 0 && (
              <ReportBlock
                tone="warn"
                title="Présent sur l'ancien template mais sans place ici"
                items={report.report.unmatchedFromSource}
              />
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => (window.location.href = "/editor")}>Ouvrir l'éditeur →</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReportBlock({
  tone,
  title,
  items,
  note,
}: {
  tone: "ok" | "warn";
  title: string;
  items: string[];
  note?: string;
}) {
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-night">
        {tone === "ok" ? (
          <IconCheck size={15} />
        ) : (
          <IconAlert size={15} />
        )}
        {title}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <li
            key={it}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              tone === "ok" ? "bg-mint-400/12 text-mint-500" : "bg-gold-400/14 text-gold-500"
            }`}
          >
            {it}
          </li>
        ))}
      </ul>
      {note && <p className="mt-1.5 text-[12px] text-mist">{note}</p>}
    </div>
  );
}
