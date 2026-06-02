"use client";

import * as React from "react";
import { useEffect, useId, useState } from "react";
import Link from "next/link";

/* ---------- Typewriter ---------- */
export function Typewriter({
  text,
  speed = 60,
  cursor = "|",
  className,
}: {
  text: string;
  speed?: number;
  cursor?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= text.length) return;
    const t = setTimeout(() => {
      setDisplay((p) => p + text[i]);
      setI((p) => p + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [i, text, speed]);

  return (
    <span className={className}>
      {display}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

type SubmitResult = { error?: string } | void;

/**
 * Écran d'auth en deux colonnes posé sur le fond fourni (ciel cosmique du hero).
 * Gauche : le vrai formulaire magic-link (email → lien sécurisé). Droite :
 * illustration qui flotte + citation typewriter. Caché sur mobile.
 */
export function AuthSplit({
  logo,
  brandName = "Akyra",
  homeHref = "/",
  title = "Connexion",
  subtitle = "Entrez votre email, on vous envoie un lien sécurisé.",
  quote = "Votre site pro vous attend.",
  quoteAuthor = "Akyra",
  imageSrc = "/landing/showcase.jpg",
  background,
  onSubmitEmail,
  initialError,
}: {
  logo?: React.ReactNode;
  brandName?: string;
  homeHref?: string;
  title?: string;
  subtitle?: string;
  quote?: string;
  quoteAuthor?: string;
  imageSrc?: string;
  background?: React.ReactNode;
  onSubmitEmail: (email: string) => Promise<SubmitResult>;
  initialError?: string;
}) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState(initialError ?? "");

  const emailOk = /\S+@\S+\.\S+/.test(email);

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
      setStatus("sent");
    }
  }

  return (
    <div className="relative grid min-h-screen w-full md:grid-cols-2">
      <div className="absolute inset-0 z-0">{background}</div>

      <Link
        href={homeHref}
        aria-label="Retour à l'accueil"
        className="absolute left-5 top-5 z-20 flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        {logo}
        <span className="font-display text-base font-semibold text-white">
          {brandName}
        </span>
      </Link>

      {/* Colonne gauche — formulaire magic link */}
      <div className="relative z-10 flex items-center justify-center px-6 py-16 md:py-12">
        <div className="w-full max-w-[360px]">
          {status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#f8cf55]/20 text-2xl text-[#f8cf55]">
                ✓
              </div>
              <h1 className="font-display text-3xl font-medium text-white">
                Vérifiez vos emails
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-sky-100/80">
                On a envoyé un lien de connexion à{" "}
                <span className="font-semibold text-white">{email}</span>.
                Cliquez dessus pour entrer.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm text-sky-100/70 underline-offset-4 hover:text-white hover:underline"
              >
                Renvoyer / changer d&apos;email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-7">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="font-display text-3xl font-medium tracking-tight text-white">
                  {title}
                </h1>
                <p className="text-balance text-sm text-sky-100/75">
                  {subtitle}
                </p>
              </div>

              <div className="grid gap-2 text-left">
                <label
                  htmlFor={emailId}
                  className="text-sm font-medium text-sky-100/90"
                >
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white shadow-sm backdrop-blur-md outline-none transition placeholder:text-sky-100/40 focus:border-white/45 focus:bg-white/15"
                />
              </div>

              {status === "error" && error && (
                <p className="-mt-3 text-sm text-[#ffb4a8]">{error}</p>
              )}

              <button
                type="submit"
                disabled={!emailOk || status === "loading"}
                className="btn-gold inline-flex h-11 items-center justify-center rounded-full text-[15px] font-bold transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "loading"
                  ? "Envoi du lien…"
                  : "Recevoir mon lien de connexion"}
              </button>

              <p className="text-center text-xs text-sky-100/50">
                Pas de mot de passe. Un lien sécurisé suffit.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Colonne droite — image flottante + citation (caché mobile) */}
      <div className="relative z-10 hidden md:flex">
        <div className="relative m-3 flex flex-1 flex-col items-center justify-between overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.04] p-8 backdrop-blur-[2px]">
          <div className="flex flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="drift-y max-h-[62vh] w-auto max-w-[80%] rounded-2xl object-contain shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
            />
          </div>

          <blockquote className="relative z-10 space-y-2 pb-2 text-center">
            <p className="font-display text-2xl font-medium leading-snug text-white drop-shadow-[0_2px_24px_rgba(10,25,45,0.7)]">
              «{" "}
              <Typewriter text={quote} speed={55} className="text-[#f8cf55]" />{" "}
              »
            </p>
            <cite className="block text-sm font-light not-italic text-sky-100/80">
              — {quoteAuthor}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
