"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import RotatingText from "@/components/ui/RotatingText";
import { CircledText } from "@/components/ui/hand-writing-text";

export type AuraHeroProps = {
  title?: string;
  subtitle?: string;
  onPromptSubmit?: (value: string, photos: File[]) => void;
};

/**
 * Hero clair, inspiré d'Aura.build : fond blanc, léger halo coloré diffus,
 * badge fin, gros titre noir, sous-titre + lien discret, champ central glassy.
 * Conserve la logique métier (upload photos optionnel, submit → tunnel).
 */
export function AuraHero({
  title = "Votre site pro,",
  subtitle = "Quelques photos, une courte description, et votre site est prêt en 30 secondes.",
  onPromptSubmit,
}: AuraHeroProps) {
  const [prompt, setPrompt] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...imgs].slice(0, 12));
  }

  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Halo coloré diffus en bas (signature Aura), très subtil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-30%] -z-10 h-[70%]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 100%, rgba(109,74,255,0.16), transparent 70%), radial-gradient(40% 40% at 20% 90%, rgba(232,180,104,0.12), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(61,224,200,0.10), transparent 70%)",
        }}
      />

      <Navbar />

      <div className="mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-center px-6 pt-28 text-center">
        {/* Badge fin */}
        <div className="mb-7 inline-block">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3.5 py-1.5 text-[12px] font-medium text-slate">
            <span className="font-semibold text-night">À partir de 50 €/an</span>
            <span className="h-3 w-px bg-black/10" />
            <RotatingText
              messages={[
                "votre site en 30 secondes",
                "un vrai design d'agence",
                "aucune compétence requise",
                "modifiable à la voix",
                "votre adresse en ligne incluse",
                "déjà adopté par 2 400 créateurs",
              ]}
              className="text-brand"
            />
          </span>
        </div>

        {/* Titre noir, façon Aura */}
        <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-night sm:text-6xl">
          {title}{" "}
          <CircledText stroke="var(--color-brand)" delay={0.7} className="text-brand">
            déjà construit.
          </CircledText>
        </h1>

        {/* Sous-titre + lien discret */}
        <p className="mx-auto mt-5 max-w-[46ch] text-[16px] leading-relaxed text-slate sm:text-[17px]">
          {subtitle}{" "}
          <a
            href="#templates"
            className="whitespace-nowrap font-medium text-night underline decoration-black/25 underline-offset-4 transition hover:decoration-night"
          >
            Voir un exemple.
          </a>
        </p>

        {/* Champ central */}
        <form
          className="mt-9 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            onPromptSubmit?.(prompt, photos);
          }}
        >
          <div className="mx-auto w-full max-w-[680px] rounded-[22px] border border-black/[0.08] bg-white p-[1px] text-left shadow-[0_20px_60px_-24px_rgba(20,30,80,0.25)] transition focus-within:border-brand/40 focus-within:shadow-[0_24px_70px_-24px_rgba(109,74,255,0.35)]">
            <div className="rounded-[21px] bg-white">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez votre activité en deux lignes : qui vous êtes, ce que vous proposez…"
                className="h-24 w-full resize-none rounded-t-[21px] bg-transparent px-4 pt-4 text-[15px] leading-relaxed text-night outline-none placeholder:text-mist sm:h-28"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] px-3 pb-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] bg-black/[0.02] px-2.5 py-1 text-[12px] font-semibold text-slate transition hover:text-night hover:bg-black/[0.05]"
                  >
                    📎{" "}
                    {photos.length > 0
                      ? `${photos.length} photo${photos.length > 1 ? "s" : ""}`
                      : "Ajouter des photos"}
                  </button>
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPhotos([])}
                      className="text-[12px] font-medium text-mist transition hover:text-slate"
                    >
                      retirer
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-violet flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition hover:scale-[1.03] active:scale-[0.97]"
                >
                  <span>Générer</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[12.5px] text-mist">
            Déjà adopté par plus de{" "}
            <span className="font-semibold text-slate">2 400 créateurs</span>.
          </p>
        </form>
      </div>
    </section>
  );
}
