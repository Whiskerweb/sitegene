"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, stagger, pop } from "@/lib/motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { CheckoutButton } from "./CheckoutButton";
import { IconSpark, IconCheck, IconCredit } from "@/components/ui/icons";
import {
  CREDIT_PACKS,
  formatEuros,
  SUBSCRIPTION_PRICE_CENTS,
  SUBSCRIPTION_ANNUAL_PRICE_CENTS,
} from "@/lib/pricing";

const PERKS = [
  "Votre nom de domaine (au lieu de vous.akyra.io)",
  "Badge « Propulsé par Akyra » retiré",
  "Toute la boutique offerte (templates & effets)",
  "Modifications illimitées (éditeur + IA)",
];

export function BillingPanel({
  isSub,
  balance,
  periodEnd,
}: {
  isSub: boolean;
  balance: number;
  periodEnd: string | null;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const renew = periodEnd
    ? new Date(periodEnd).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  // Économie annuelle affichée (mensuel × 12 vs annuel).
  const annualSavePct = Math.round(
    (1 - SUBSCRIPTION_ANNUAL_PRICE_CENTS / (SUBSCRIPTION_PRICE_CENTS * 12)) * 100,
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Ligne plan actuel + offre illimitée */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Carte plan actuel */}
        <motion.div variants={fadeUp}>
          <GlassCard className="relative h-full overflow-hidden border border-sky-300 p-7">
            {isSub && (
              <BorderBeam size={320} duration={8} borderWidth={2.5} colorFrom="#2563eb" colorTo="#22d3ee" />
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate">Votre plan</p>
              {isSub ? (
                <Badge tone="success">
                  <span className="dot-live h-1.5 w-1.5 rounded-full bg-success" /> Illimité
                </Badge>
              ) : (
                <Badge tone="neutral">Gratuit</Badge>
              )}
            </div>

            {isSub ? (
              <>
                <p className="mt-3 flex items-center gap-2 font-archivo text-[34px] font-bold leading-none text-night">
                  <IconSpark size={26} /> Tout compris
                </p>
                <p className="mt-3 text-sm text-slate">
                  Domaine custom, boutique offerte et modifications illimitées.
                </p>
                {renew && <p className="mt-1 text-sm text-mist">Renouvelé le {renew}</p>}
                <div className="mt-5">
                  <CheckoutButton endpoint="/api/billing/portal" variant="ghost" size="sm">
                    Gérer l'abonnement
                  </CheckoutButton>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 font-archivo text-[52px] font-bold leading-none text-brand">
                  {balance}
                </p>
                <p className="mt-2 text-sm text-mist">
                  crédit{balance > 1 ? "s" : ""} · 1 crédit = 1 modification de votre site.
                </p>
              </>
            )}
          </GlassCard>
        </motion.div>

        {/* Offre illimitée (upsell) */}
        <motion.div variants={fadeUp}>
          <div className="relative h-full overflow-hidden rounded-[24px] border border-brand/30 bg-gradient-to-br from-blue via-surface to-lav p-7 shadow-cloud-sm">
            <BorderBeam size={300} duration={9} borderWidth={2} colorFrom="#7c3aed" colorTo="#22d3ee" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand">Offre tout compris</p>
              <Badge tone="brand">Le plus populaire</Badge>
            </div>

            {/* Toggle cadence — mensuel affiché par défaut, annuel poussé. */}
            <div className="mt-3 inline-flex rounded-full border border-sky-300 bg-white/70 p-0.5 text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  interval === "month" ? "bg-brand text-white" : "text-slate hover:text-night"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  interval === "year" ? "bg-brand text-white" : "text-slate hover:text-night"
                }`}
              >
                Annuel −{annualSavePct}%
              </button>
            </div>

            <motion.p
              variants={pop}
              className="mt-3 font-archivo text-[40px] font-bold leading-none text-night"
            >
              {interval === "year"
                ? formatEuros(SUBSCRIPTION_ANNUAL_PRICE_CENTS)
                : formatEuros(SUBSCRIPTION_PRICE_CENTS)}
              <span className="ml-1 text-base font-semibold text-slate">
                {interval === "year" ? "/ an" : "/ mois"}
              </span>
            </motion.p>
            <p className="mt-1 text-[13px] text-mist">
              {interval === "year"
                ? `Soit ${formatEuros(Math.round(SUBSCRIPTION_ANNUAL_PRICE_CENTS / 12))}/mois — 2 mois offerts.`
                : `Passez à l'annuel : 2 mois offerts (−${annualSavePct}%).`}
            </p>

            <ul className="mt-4 space-y-2">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-50 text-success">
                    <IconCheck size={13} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {isSub ? (
                <Badge tone="success">
                  <IconCheck size={13} /> Abonnement actif
                </Badge>
              ) : (
                <CheckoutButton
                  endpoint="/api/billing/subscribe"
                  payload={{ interval }}
                  className="w-full"
                >
                  <IconSpark size={16} /> Passer à l'abonnement
                </CheckoutButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Packs de crédits */}
      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-archivo text-lg font-semibold text-night">
            {isSub ? "Acheter des crédits (optionnel)" : "Recharger en crédits"}
          </h2>
          {isSub && (
            <span className="text-sm text-mist">Inutile tant que l'illimité est actif</span>
          )}
        </div>

        <div className={`grid gap-4 sm:grid-cols-3 ${isSub ? "opacity-60" : ""}`}>
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative overflow-hidden rounded-[20px] border bg-surface p-6 shadow-cloud-sm transition-transform duration-200 hover:-translate-y-0.5 ${
                pack.popular ? "border-brand/40" : "border-sky-300"
              }`}
            >
              {pack.popular && (
                <>
                  <BorderBeam size={240} duration={7} borderWidth={2} colorFrom="#2563eb" colorTo="#22d3ee" />
                  <div className="absolute right-4 top-4">
                    <Badge tone="brand">Populaire</Badge>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 text-slate">
                <IconCredit size={18} />
                <span className="text-sm font-medium">{pack.label}</span>
              </div>
              <p className="mt-3 font-archivo text-[34px] font-bold leading-none text-night">
                {pack.credits}
                <span className="ml-1 text-sm font-semibold text-slate">crédits</span>
              </p>
              <p className="mt-1 text-sm text-mist">{formatEuros(pack.priceCents)}</p>
              <div className="mt-5">
                <CheckoutButton
                  endpoint="/api/billing/topup"
                  payload={{ packId: pack.id }}
                  variant={pack.popular ? "primary" : "subtle"}
                  size="sm"
                  className="w-full"
                >
                  Acheter
                </CheckoutButton>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
