"use client";

import * as React from "react";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { AkyraMark } from "@/components/ui/Logo";

type SubmitResult = { error?: string } | void;

/** Dégradé du panneau gauche — froid → chaud aux couleurs Akyra (bleu encre →
 *  bleu marque → violet → terracotta signature), rehaussé de halos lumineux. */
const PANEL_BG: React.CSSProperties = {
  backgroundColor: "#0c1b39",
  backgroundImage: [
    "radial-gradient(120% 85% at 12% 8%, rgba(56,99,210,0.55), transparent 55%)",
    "radial-gradient(110% 95% at 96% 100%, rgba(201,84,59,0.62), transparent 55%)",
    "radial-gradient(80% 70% at 82% 12%, rgba(124,92,180,0.32), transparent 60%)",
    "linear-gradient(140deg, #0a1730 0%, #14274b 34%, #2b3f8c 58%, #6d4a86 80%, #b34e39 100%)",
  ].join(","),
};

/**
 * Écran d'auth en deux colonnes — simple, épuré, professionnel.
 * Gauche (desktop) : panneau dégradé + grande accroche qui dit ce qu'Akyra fait
 * pour vous. Droite : formulaire OTP (email → code à 6 chiffres) sur fond blanc.
 * Mobile : le formulaire blanc, coiffé d'une accroche courte.
 */
export function AuthSplit({
  brandName = "Akyra",
  homeHref = "/",
  title = "Connexion",
  subtitle = "Entrez votre email, on vous envoie un code à 6 chiffres.",
  headline = "Votre site web professionnel, assemblé en quelques minutes.",
  tagline = "Choisissez une direction artistique — Akyra compose votre site, vous n'avez plus qu'à le publier.",
  onSubmitEmail,
  onVerifyCode,
  initialError,
}: {
  brandName?: string;
  homeHref?: string;
  title?: string;
  subtitle?: string;
  headline?: string;
  tagline?: string;
  onSubmitEmail: (email: string) => Promise<SubmitResult>;
  /** Si fourni : flux OTP (code à 6 chiffres) au lieu du lien magique. */
  onVerifyCode?: (email: string, code: string) => Promise<SubmitResult>;
  initialError?: string;
}) {
  const emailId = useId();
  const codeId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState(initialError ?? "");

  // Étape 2 (OTP) : saisie du code à 6 chiffres.
  const [code, setCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading" | "error">("idle");
  const [verifyError, setVerifyError] = useState("");

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const codeOk = /^\d{6}$/.test(code);

  useEffect(() => {
    if (initialError) setStatus("error");
  }, [initialError]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk || status === "loading") return;
    setStatus("loading");
    setError("");
    const res = await onSubmitEmail(email);
    if (res && res.error) {
      setError(res.error);
      setStatus("error");
    } else {
      setCode("");
      setVerifyStatus("idle");
      setVerifyError("");
      setStatus("sent");
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeOk || verifyStatus === "loading" || !onVerifyCode) return;
    setVerifyStatus("loading");
    setVerifyError("");
    const res = await onVerifyCode(email, code);
    if (res && res.error) {
      setVerifyError(res.error);
      setVerifyStatus("error");
    }
    // Succès : la page parente s'occupe de la redirection.
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-sky-200 bg-white px-4 text-sm text-night outline-none transition placeholder:text-mist focus:border-brand focus:ring-2 focus:ring-brand/15";
  const btnCls =
    "inline-flex h-11 items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white shadow-cloud-sm transition enabled:hover:bg-brand-700 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-2">
      {/* ===== Gauche — panneau dégradé + accroche (desktop) ===== */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-white md:flex" style={PANEL_BG}>
        {/* grain/halo très doux pour le relief */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[6%] h-[46%] w-[55%] rounded-full bg-white/10 blur-[120px]" />
        </div>

        <Link href={homeHref} aria-label="Retour à l'accueil" className="relative z-10 flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <AkyraMark size={26} tone="dark" />
          <span className="font-display text-lg font-semibold tracking-tight">{brandName}</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-[clamp(2.2rem,3.2vw,3.1rem)] font-extrabold leading-[1.06] tracking-tight">
            {headline}
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/75">{tagline}</p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[13px] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          Sans code. Sans engagement. Annulable à tout moment.
        </div>
      </div>

      {/* ===== Droite — formulaire (blanc) ===== */}
      <div className="relative flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[372px]">
          {/* Accroche courte — mobile uniquement (le panneau gauche est masqué) */}
          <p className="mb-8 text-center text-[15px] font-medium leading-snug text-slate md:hidden">
            <span className="font-display text-lg font-bold text-night">{headline}</span>
          </p>

          {status === "sent" && onVerifyCode ? (
            <form onSubmit={submitCode} className="flex flex-col gap-7">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-xl text-brand">✦</div>
                <h1 className="font-display text-[26px] font-bold tracking-tight text-night">Entrez le code</h1>
                <p className="text-balance text-sm text-slate">
                  On a envoyé un code à 6 chiffres à <span className="font-semibold text-night">{email}</span>.
                </p>
              </div>

              <div className="grid gap-2 text-left">
                <label htmlFor={codeId} className="text-sm font-medium text-slate">Code à 6 chiffres</label>
                <input
                  id={codeId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 w-full rounded-xl border border-sky-200 bg-white px-4 text-center font-display text-2xl tracking-[0.5em] text-night outline-none transition placeholder:text-mist focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {verifyStatus === "error" && verifyError && <p className="-mt-3 text-sm text-danger">{verifyError}</p>}

              <button type="submit" disabled={!codeOk || verifyStatus === "loading"} className={btnCls}>
                {verifyStatus === "loading" ? "Vérification…" : "Me connecter"}
              </button>

              <button type="button" onClick={() => setStatus("idle")} className="text-center text-sm text-slate underline-offset-4 hover:text-night hover:underline">
                Renvoyer / changer d&apos;email
              </button>
            </form>
          ) : status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-success-50 text-xl text-success">✓</div>
              <h1 className="font-display text-[26px] font-bold text-night">Vérifiez vos emails</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate">
                On a envoyé un lien de connexion à <span className="font-semibold text-night">{email}</span>. Cliquez dessus pour entrer.
              </p>
              <button type="button" onClick={() => setStatus("idle")} className="mt-6 text-sm text-slate underline-offset-4 hover:text-night hover:underline">
                Renvoyer / changer d&apos;email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-7">
              <div className="flex flex-col items-center gap-3 text-center">
                <AkyraMark size={34} tone="light" />
                <div>
                  <h1 className="font-display text-[26px] font-bold tracking-tight text-night">{title}</h1>
                  <p className="mt-1.5 text-balance text-sm text-slate">{subtitle}</p>
                </div>
              </div>

              <div className="grid gap-2 text-left">
                <label htmlFor={emailId} className="text-sm font-medium text-slate">Email</label>
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              {status === "error" && error && <p className="-mt-3 text-sm text-danger">{error}</p>}

              <button type="submit" disabled={!emailOk || status === "loading"} className={btnCls}>
                {status === "loading" ? "Envoi du code…" : onVerifyCode ? "Recevoir mon code" : "Recevoir mon lien de connexion"}
              </button>

              <p className="text-center text-xs text-mist">
                Pas de mot de passe. {onVerifyCode ? "Un code à 6 chiffres suffit." : "Un lien sécurisé suffit."}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
