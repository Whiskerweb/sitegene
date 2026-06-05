"use client";

import { IconStar4 } from "@/components/ui/icons";
import type { OwnedEffect } from "../EditorClient";

type Props = {
  effects: OwnedEffect[];
  onPick: (fx: OwnedEffect) => void;
  onClose: () => void;
};

/** Galerie visuelle des effets POSSÉDÉS (boutique Formules), ancrée au-dessus du composer. */
export default function GalleryPopover({ effects, onPick, onClose }: Props) {
  return (
    <div className="absolute inset-x-3 bottom-full z-30 mb-2 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-cloud-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-night">Mes composants</p>
        <button type="button" className="text-xs text-slate underline" onClick={onClose}>
          Fermer
        </button>
      </div>
      {effects.length === 0 ? (
        <a
          className="block rounded-xl border border-dashed border-sky-300 p-4 text-center text-sm text-slate"
          href="/dashboard/marketplace"
        >
          Débloquez des effets dans <b>Formules</b> →
        </a>
      ) : (
        <>
          <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto">
            {effects.map((fx) => (
              <button
                key={fx.id}
                type="button"
                disabled={!fx.compatible}
                className="rounded-xl border border-white/70 bg-white p-2 text-left shadow-cloud transition hover:ring-2 hover:ring-brand disabled:opacity-50 disabled:hover:ring-0"
                title={
                  fx.compatible
                    ? `Intégrer « ${fx.name} »`
                    : "Indisponible sur votre template actuel"
                }
                onClick={() => onPick(fx)}
              >
                <span
                  className="block h-10 w-full rounded-lg"
                  style={{
                    background: `linear-gradient(120deg, ${fx.accentFrom}, ${fx.accentTo})`,
                  }}
                />
                <span className="mt-1.5 flex items-center gap-1 text-[12.5px] font-medium text-night">
                  <IconStar4 size={12} className="text-[#9b72cb]" /> {fx.name}
                  {!fx.compatible && (
                    <em className="ml-auto text-[10px] not-italic text-mist">bientôt</em>
                  )}
                </span>
              </button>
            ))}
          </div>
          <a
            href="/dashboard/marketplace"
            className="mt-2 block text-center text-[12px] text-slate underline"
          >
            Débloquer plus d&apos;effets → Formules
          </a>
        </>
      )}
    </div>
  );
}
