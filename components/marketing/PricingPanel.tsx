import Link from "next/link";
import { Check } from "lucide-react";
import { CREDIT_PACKS, formatEuros, SUBSCRIPTION_PRICE_CENTS } from "@/lib/pricing";

const perks = [
  "Votre site en ligne sur vous.akyra.com",
  "Hébergement & adresse compris, rien à gérer",
  "Vos photos, votre nom, vos prestations",
  "Des crédits offerts pour le faire évoluer",
];

/** Bloc tarifs : offre principale 50 €/an + packs de crédits. Tokens scopés. */
export default function PricingPanel({ showPacks = true }: { showPacks?: boolean }) {
  return (
    <div className="mx-auto max-w-[1040px]">
      <div className="relative mx-auto max-w-[480px]">
        <div className="pop-in absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-gold-400 px-3.5 py-1.5 text-[13px] font-bold text-ink-900 shadow-[0_10px_24px_-8px_rgba(232,180,104,0.55)]">
          Tout compris
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-8 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.3)] md:p-10">
          <div className="flex items-end gap-2">
            <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-[rgb(var(--m-ink))]">
              50€
            </span>
            <span className="mb-2 text-[15px] text-[rgb(var(--m-faint))]">/ an</span>
          </div>
          <p className="mt-3 text-[15px] leading-[1.6] text-[rgb(var(--m-muted))]">
            Tout compris : hébergement, mises à jour et votre adresse. Facturé une fois par an,
            comme un nom de domaine. Ça fait moins de 5&nbsp;€/mois.
          </p>
          <ul className="mt-7 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px]">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-mint-400/20 bg-mint-400/10 text-mint-400">
                  <Check size={13} />
                </span>
                <span className="text-[rgb(var(--m-ink))]">{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/#demo"
            className="btn-violet mt-8 block rounded-full px-7 py-4 text-center text-[15px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Lancer mon site · 50 €/an
          </Link>
          <p className="mt-4 text-center font-hand text-[20px] text-gold-400">
            tout compris, moins de 5 €/mois ✦
          </p>
        </div>
      </div>

      {showPacks && (
        <div className="mt-16">
          <div className="mb-2 text-center">
            <h3 className="text-[22px] font-semibold text-[rgb(var(--m-ink))]">
              Besoin de plus de modifications ?
            </h3>
            <p className="mt-2 text-[14px] text-[rgb(var(--m-muted))]">
              Rechargez des crédits à l&apos;unité, ou passez en illimité pour{" "}
              <span className="font-semibold text-[rgb(var(--m-ink))]">
                {formatEuros(SUBSCRIPTION_PRICE_CENTS)}/mois
              </span>
              . Facultatif, jamais obligatoire.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={[
                  "relative rounded-2xl border bg-[rgb(var(--m-surface))] p-6 text-center transition-colors",
                  pack.popular
                    ? "border-[rgb(var(--m-accent)/0.4)]"
                    : "border-[rgb(var(--m-line))] hover:border-[rgb(var(--m-overlay)/0.16)]",
                ].join(" ")}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[rgb(var(--m-accent))] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--m-on-accent))]">
                    Populaire
                  </span>
                )}
                <p className="text-[13px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">
                  {pack.label}
                </p>
                <p className="mt-3 text-[34px] font-bold text-[rgb(var(--m-ink))]">
                  {formatEuros(pack.priceCents)}
                </p>
                <p className="mt-1 text-[13px] text-[rgb(var(--m-muted))]">{pack.credits} crédits</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
