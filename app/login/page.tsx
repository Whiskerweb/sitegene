"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") ?? "/dashboard");
    if (params.get("error") === "not-operator") {
      setMessage("Ce compte n'a pas accès à l'espace opérateur.");
      setStatus("error");
    } else if (params.get("error")) {
      setMessage("Lien invalide ou expiré. Réessayez.");
      setStatus("error");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-[400px]" />
      <div className="relative w-full max-w-[420px]">
        <a
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full btn-violet text-sm font-bold text-white">
            S
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Sitegene
          </span>
        </a>

        <div className="rounded-[24px] border border-line bg-ink-700 p-8">
          {status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-mint-400/15 text-2xl text-mint-400">
                ✓
              </div>
              <h1 className="font-display text-[24px] font-medium tracking-[-0.01em]">
                Vérifiez vos emails
              </h1>
              <p className="mt-3 text-[15px] leading-[1.6] text-muted">
                On a envoyé un lien de connexion à{" "}
                <span className="text-paper">{email}</span>. Cliquez dessus pour
                vous connecter.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[24px] font-medium tracking-[-0.01em]">
                Connexion
              </h1>
              <p className="mt-2 text-[14px] text-muted">
                Entrez votre email, on vous envoie un lien sécurisé.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-[15px] text-paper outline-none transition-colors placeholder:text-faint focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-violet w-full rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {status === "sending" ? "Envoi…" : "Recevoir mon lien"}
                </button>
                {status === "error" && (
                  <p className="text-center text-[13px] text-gold-400">
                    {message}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
