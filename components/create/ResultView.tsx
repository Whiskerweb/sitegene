"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import type { Category } from "@/lib/categories";
import { IconCheck } from "@/components/ui/icons";

/**
 * Révélation du résultat : UN seul site (le plus adapté) en grand, dans un cadre
 * navigateur (iframe /r/{token}?embed=1 — filigrane gardé, barre interne retirée).
 * Le CTA de paiement vit AU NIVEAU DE LA PAGE (barre sticky, form POST natif →
 * `/api/checkout` → Stripe en plein écran → /welcome → onboarding). Mise en scène
 * conversion : pic de désir (le site est là), ancrage de prix, réassurance,
 * momentum ; CTA dominant à la 1ʳᵉ personne. « voir d'autres modèles » reste
 * secondaire.
 */
const REASSURANCE = [
  "En ligne en 30 secondes",
  "Hébergement & adresse inclus",
  "Modifiable à volonté",
  "Résiliable quand vous voulez",
];

export default function ResultView({
  token,
  templateId,
  usedDemoPhotos,
  category,
  onSwitchTemplate,
  switching,
  onEdit,
}: {
  token: string;
  templateId: string;
  usedDemoPhotos: boolean;
  category: Category;
  onSwitchTemplate: (templateId: string) => void;
  switching: boolean;
  onEdit?: () => void;
}) {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-[180px] pt-12 md:px-6 md:pb-[150px] md:pt-16 bg-ink-900">
        {/* Glow decorative background */}
        <div aria-hidden className="absolute right-[6%] top-[8%] h-64 w-64 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />
        <div aria-hidden className="absolute left-[6%] bottom-[8%] h-64 w-64 rounded-full bg-gold-400/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative z-10 mx-auto max-w-[1080px]"
        >
          <div className="mb-8 text-center">
            <motion.p
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3.5 py-1.5 text-[12px] font-semibold text-violet-400 border border-violet-500/20"
            >
              <span className="dot-live h-1.5 w-1.5 rounded-full bg-mint-400" />
              Votre site est prêt
            </motion.p>
            <h1 className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-paper md:text-[50px]">
              Voici votre site. <span className="em text-violet-400">Le vrai.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[46ch] text-[15px] sm:text-[16px] leading-[1.6] text-muted">
              On l&apos;a construit d&apos;après votre description. Il ne reste plus qu&apos;à le mettre en ligne.
            </p>
          </div>

          {/* cadre navigateur — site réel sans barre interne */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="overflow-hidden rounded-[22px] border border-white/10 bg-ink-800 shadow-[0_20px_50px_rgba(109,74,255,0.15)]"
          >
            <div className="flex h-10 flex-none items-center gap-1.5 border-b border-white/5 bg-ink-900/60 px-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <span className="mx-auto flex items-center gap-1.5 rounded-md bg-ink-800 px-3.5 py-1 text-[11px] text-muted border border-white/5">
                {category.exampleDomain}
              </span>
            </div>
            <div className="relative">
              <iframe
                key={token}
                src={`/r/${token}?embed=1`}
                title="Votre site"
                className="h-[600px] w-full bg-ink-900 md:h-[760px]"
              />
              {switching && (
                <div className="absolute inset-0 grid place-items-center bg-ink-900/80 backdrop-blur-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-ink-800 px-4 py-2 text-[14px] font-semibold text-paper border border-white/5 shadow-2xl">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
                    Nouveau design…
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* réassurance + ancrage */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {REASSURANCE.map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <IconCheck size={14} className="text-mint-400" /> {r}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-[52ch] text-center text-[13px] text-faint">
            {usedDemoPhotos
              ? "Photos de démo pour l'aperçu. Vous mettrez les vôtres après la mise en ligne. "
              : "Vos photos sont déjà en place. "}
            Un site d&apos;agence coûte <span className="text-muted line-through">1&nbsp;500&nbsp;€+</span>. Le vôtre&nbsp;: 50&nbsp;€/an, soit moins de 5&nbsp;€/mois.
          </p>

          {/* Réassurance : c'est modifiable, à la main ou via l'IA */}
          <p className="mx-auto mt-2 max-w-[56ch] text-center text-[13px] text-muted">
            Rien n&apos;est figé. Vous changez les textes et les photos à la main,
            et pour la mise en page ou les couleurs, vous demandez à l&apos;IA.
          </p>

          {/* autres modèles — secondaire */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {category.templateIds.length > 1 && (
              <>
                <span className="text-[13px] text-muted">Voir sur d&apos;autres modèles&nbsp;:</span>
                {category.templateIds.map((tid, i) => {
                  const active = tid === templateId;
                  return (
                    <button
                      key={tid}
                      type="button"
                      disabled={switching || active}
                      onClick={() => onSwitchTemplate(tid)}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
                        active
                          ? "bg-violet-500 text-white shadow-[0_4px_12px_rgba(109,74,255,0.3)] border border-violet-400/20"
                          : "bg-ink-800 text-paper border border-white/5 hover:bg-ink-700 hover:border-white/10 disabled:opacity-50"
                      }`}
                    >
                      Modèle {i + 1}
                    </button>
                  );
                })}
              </>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full px-4 py-1.5 text-[13px] font-semibold bg-ink-800 text-violet-400 border border-violet-500/20 hover:bg-violet-500/10 hover:border-violet-500/30 transition"
              >
                ✏️ Modifier mon brief
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Barre CTA sticky — paiement réel, redirige la PAGE (pas l'iframe) */}
      <motion.form
        action="/api/checkout"
        method="post"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink-800/80 px-4 py-4 backdrop-blur-xl md:px-6"
      >
        <input type="hidden" name="token" value={token} />
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-[16px] font-semibold text-paper">
              Publiez votre site&nbsp;:{" "}
              <span className="text-violet-400">50 €/an</span>, tout compris.
            </p>
            <p className="text-[12.5px] text-faint">
              ≈ 4 €/mois · hébergement &amp; adresse inclus · paiement sécurisé (CB &amp; Apple&nbsp;Pay)
            </p>
          </div>
          <button
            type="submit"
            className="btn-violet inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-[16px] font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto"
          >
            Mettre mon site en ligne <span aria-hidden>→</span>
          </button>
        </div>
      </motion.form>
    </>
  );
}

