import type { Metadata } from "next";
import ModelesGrid from "@/components/marketing/ModelesGrid";

export const metadata: Metadata = {
  title: "Modèles · Akyra",
  description: "Parcourez les modèles de sites Akyra par métier : photographes, artisans, et bientôt plus.",
};

export default function ModelesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
          Modèles
        </p>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[rgb(var(--m-ink))] md:text-[32px]">
          Des sites déjà construits, par métier.
        </h1>
      </div>

      <ModelesGrid />
    </section>
  );
}
