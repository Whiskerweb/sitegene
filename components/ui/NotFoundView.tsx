import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Page 404 — alignée DA Cloud (paper chaud + accent brand bleu, titre Fraunces).
 * Présentationnelle et server-friendly : pas de hook, pas de "use client".
 * Branchée par `app/not-found.tsx` (convention Next.js 16).
 */
export function NotFoundView() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-24 text-foreground">
      {/* Halo doux brand/sky en fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-ink-800 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          <Compass className="h-3.5 w-3.5 text-violet-400" />
          Erreur 404
        </span>

        <p className="font-display text-[clamp(5rem,18vw,11rem)] font-medium leading-none tracking-tight text-paper">
          404
        </p>

        <h1 className="mt-4 text-balance font-display text-3xl font-medium text-paper sm:text-4xl">
          Cette page n&apos;existe pas
        </h1>

        <p className="mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-muted">
          Le lien est cassé ou la page a été déplacée. Pas de panique — votre
          site, lui, est déjà prêt. Revenez à l&apos;accueil.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="primary" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
          <Button href="/dashboard" variant="ghost" size="lg">
            Mon tableau de bord
          </Button>
        </div>
      </div>
    </section>
  );
}
