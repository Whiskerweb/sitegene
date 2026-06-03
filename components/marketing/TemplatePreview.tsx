"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, ArrowLeft, ArrowRight } from "lucide-react";

type DeviceId = "desktop" | "tablet" | "mobile";

const DEVICES: { id: DeviceId; label: string; width: string; Icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", width: "100%", Icon: Monitor },
  { id: "tablet", label: "Tablette", width: "820px", Icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
];

/**
 * Aperçu public d'un template : chrome neutre (barre responsive en haut) autour
 * d'une iframe qui rend le template statique (/_templates/<id>/index.html), +
 * CTA flottant « Tester cette template » vers la connexion. On ne style QUE le
 * chrome, jamais le template rendu.
 */
export default function TemplatePreview({ src, title }: { src: string; title: string }) {
  const [device, setDevice] = useState<DeviceId>("desktop");
  const width = DEVICES.find((d) => d.id === device)!.width;

  return (
    <div className="flex h-[100dvh] flex-col bg-neutral-200">
      {/* Barre du haut : retour + sélecteur responsive */}
      <header className="z-20 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-2.5 shadow-sm">
        <a
          href="/modeles"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
          <ArrowLeft size={15} /> Modèles
        </a>

        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-neutral-50 p-1">
          {DEVICES.map((d) => {
            const active = d.id === device;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                aria-pressed={active}
                title={d.label}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors " +
                  (active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-900")
                }
              >
                <d.Icon size={14} />
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden max-w-[28ch] truncate text-[13px] font-medium text-neutral-700 md:inline">
          {title}
        </span>
      </header>

      {/* Scène : iframe centrée, largeur selon l'appareil */}
      <div className="flex flex-1 justify-center overflow-auto p-4 md:p-6">
        <iframe
          key={device}
          src={src}
          title={title}
          className="h-full rounded-lg border-0 bg-white shadow-2xl"
          style={{ width, maxWidth: "100%" }}
        />
      </div>

      {/* CTA flottant → connexion */}
      <a
        href="/login"
        className="fixed bottom-6 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.03]"
      >
        Tester cette template <ArrowRight size={17} />
      </a>
    </div>
  );
}
