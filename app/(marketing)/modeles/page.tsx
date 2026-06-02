import type { Metadata } from "next";
import ModelesGrid from "@/components/marketing/ModelesGrid";

export const metadata: Metadata = {
  title: "Modèles · Akyra",
  description: "Parcourez les modèles de sites Akyra par métier : photographes, artisans, et bientôt plus.",
};

export default function ModelesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
          Modèles
        </p>
        <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-[rgb(var(--m-ink))] md:text-[48px]">
          Des sites déjà construits, par métier.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[rgb(var(--m-muted))]">
          Choisissez un modèle, on le remplit avec vos photos et vos infos. En ligne en 30 secondes,
          modifiable quand vous voulez.
        </p>
      </div>

      <ModelesGrid />
    </section>
  );
}
