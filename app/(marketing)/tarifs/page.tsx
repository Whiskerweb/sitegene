import type { Metadata } from "next";
import PricingPanel from "@/components/marketing/PricingPanel";

export const metadata: Metadata = {
  title: "Tarifs · Akyra",
  description: "Un prix, pas de surprise : 50 €/an tout compris. Packs de crédits et illimité en option.",
};

export default function TarifsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
          Tarif
        </p>
        <h1 className="mx-auto max-w-[20ch] text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-[rgb(var(--m-ink))] md:text-[48px]">
          Un prix. Pas de surprise.
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-[rgb(var(--m-muted))]">
          Tout compris, comme un nom de domaine. Vous renouvelez une fois par an et vous arrêtez
          quand vous voulez.
        </p>
      </div>

      <PricingPanel />
    </section>
  );
}
