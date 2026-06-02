import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/components/marketing/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ · Akyra",
  description: "Toutes vos questions sur Akyra : tarif, modifications, photos, nom de domaine.",
};

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-[820px] px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
          FAQ
        </p>
        <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-[rgb(var(--m-ink))] md:text-[48px]">
          Vos questions, nos réponses.
        </h1>
      </div>

      <FaqAccordion />

      <div className="mt-12 rounded-[22px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))] p-8 text-center">
        <p className="text-[20px] font-semibold text-[rgb(var(--m-ink))]">Une autre question ?</p>
        <p className="mt-2 text-[14px] text-[rgb(var(--m-muted))]">
          Lancez votre site, vous verrez par vous-même — c&apos;est plus rapide qu&apos;une réponse.
        </p>
        <Link
          href="/#demo"
          className="btn-violet mt-5 inline-block rounded-full px-6 py-3 text-[14px] font-bold text-white transition-transform hover:scale-[1.02]"
        >
          Créer mon site · 50 €/an
        </Link>
      </div>
    </section>
  );
}
