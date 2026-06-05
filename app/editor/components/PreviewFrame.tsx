"use client";

import type { RefObject } from "react";
import { IconEdit, IconPin, IconStar4 } from "@/components/ui/icons";

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "834px",
  mobile: "390px",
};

type Props = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  initialSrc: string;
  device: Device;
  tool: "edit" | "note";
  integratingName: string | null;
  showEditHint: boolean;
  onSwitchTool: (t: "edit" | "note") => void;
};

/**
 * Cadre « appareil » de l'aperçu : iframe du site, bandeaux d'aide selon le
 * mode, et dock flottant ✎ Modifier / ⌖ Cibler (déplacé depuis le bas de page).
 * Nécessite <GlassFilter /> monté une fois dans la page (filtre #radio-glass).
 */
export default function PreviewFrame({
  iframeRef,
  initialSrc,
  device,
  tool,
  integratingName,
  showEditHint,
  onSwitchTool,
}: Props) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-cloud transition-[width,max-width] duration-300 ease-out"
      style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
    >
      <iframe
        ref={iframeRef}
        src={initialSrc}
        title="Éditeur de votre site"
        className="h-full w-full border-0"
      />

      {tool === "note" && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
          {integratingName ? (
            <>
              <IconStar4 size={14} className="text-[#d8b4fe]" /> Choisissez la section où intégrer
              «&nbsp;{integratingName}&nbsp;»
            </>
          ) : (
            <>
              <IconPin size={14} /> Touchez l&apos;endroit dont vous voulez parler à l&apos;IA
            </>
          )}
        </div>
      )}
      {tool === "edit" && showEditHint && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
          Touchez un texte ou une photo pour le modifier
        </div>
      )}

      {/* Dock ✎ / ⌖ — flottant en bas de l'aperçu (liquid glass) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-4">
        <div className="gem-dock pointer-events-auto" style={{ width: "min(320px, 100%)" }}>
          <div className="gem-distort" style={{ filter: 'url("#radio-glass")' }} aria-hidden />
          <span
            className="gem-thumb"
            aria-hidden
            style={{ left: tool === "note" ? "50%" : "4px", width: "calc(50% - 4px)" }}
          />
          <button type="button" data-on={tool === "edit"} onClick={() => onSwitchTool("edit")}>
            <IconEdit size={16} style={{ color: tool === "edit" ? "#2563eb" : undefined }} />
            Modifier
          </button>
          <button type="button" data-on={tool === "note"} onClick={() => onSwitchTool("note")}>
            <IconPin size={16} style={{ color: tool === "note" ? "#9b72cb" : undefined }} />
            <span className={tool === "note" ? "gem-text" : undefined}>Cibler</span>
          </button>
        </div>
      </div>
    </div>
  );
}
