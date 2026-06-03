"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AkyraMark } from "@/components/ui/Logo";

/**
 * Gate compte du tunnel self-serve : l'utilisateur a commencé à décrire son
 * projet dans la bulle de la landing, on lui crée un compte sans casser l'élan.
 *  - Email + code OTP inline (aucun départ de la page).
 *  - « Continuer avec Google » (OAuth ; le brief est mis de côté avant le redirect).
 * DA : surface .akyra (verre clair, encre, accent bleu) — identique à la landing.
 */
const BRIEF_KEY = "akyra_brief";

export default function AuthGate({
  open,
  onClose,
  brief,
  onAuthed,
}: {
  open: boolean;
  onClose: () => void;
  brief: string;
  onAuthed: () => void;
}) {
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On garde le brief au chaud (survit au redirect OAuth).
  useEffect(() => {
    if (open && brief) {
      try {
        sessionStorage.setItem(BRIEF_KEY, brief);
      } catch {
        /* sessionStorage indispo : on continue, le composer repartira du vide */
      }
    }
  }, [open, brief]);

  if (!open) return null;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) throw new Error(error.message);
      setPhase("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (error) throw new Error(error.message);
      onAuthed();
    } catch {
      setError("Code incorrect ou expiré.");
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw new Error(error.message);
    } catch {
      setError("Google n'est pas encore disponible. Utilisez votre email.");
      setBusy(false);
    }
  }

  return (
    <div
      className="akyra fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Voile */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(var(--m-ink)/0.45)] backdrop-blur-md"
      />

      {/* Carte */}
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-8 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col items-center text-center">
          <AkyraMark size={40} />
          <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[rgb(var(--m-ink))]">
            {phase === "email" ? "On garde votre projet au chaud" : "Vérifiez votre boîte mail"}
          </h2>
          <p className="mt-2 max-w-[34ch] text-[14.5px] leading-relaxed text-[rgb(var(--m-muted))]">
            {phase === "email"
              ? "Créez votre compte en 10 secondes pour lancer la construction de votre site."
              : `Code envoyé à ${email}. Saisissez-le ci-dessous.`}
          </p>
        </div>

        {phase === "email" ? (
          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-[14.5px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)] disabled:opacity-50"
            >
              <GoogleIcon />
              Continuer avec Google
            </button>

            <div className="my-1 flex items-center gap-3 text-[12px] text-[rgb(var(--m-faint))]">
              <span className="h-px flex-1 bg-[rgb(var(--m-line))]" />
              ou
              <span className="h-px flex-1 bg-[rgb(var(--m-line))]" />
            </div>

            <form onSubmit={sendCode} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="h-12 w-full rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 text-[15px] text-[rgb(var(--m-ink))] outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] text-[14.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Recevoir mon code
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={verify} className="mt-7 flex flex-col gap-3">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="h-14 w-full rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-center text-[24px] font-semibold tracking-[0.4em] text-[rgb(var(--m-ink))] outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:tracking-[0.4em] placeholder:text-[rgb(var(--m-faint))]"
            />
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] text-[14.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Lancer mon site
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("email");
                setCode("");
                setError(null);
              }}
              className="text-[13px] text-[rgb(var(--m-faint))] transition-colors hover:text-[rgb(var(--m-muted))]"
            >
              Changer d&apos;email
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-center text-[13px] text-[#dc2626]">{error}</p>
        )}

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-[rgb(var(--m-faint))]">
          Aucune carte demandée. Vous ne payez que lorsque votre site vous plaît.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
