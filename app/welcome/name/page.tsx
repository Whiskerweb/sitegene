"use client";

import { useEffect, useState } from "react";

export default function NameSitePage() {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveSlug, setLiveSlug] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setToken(p.get("token") ?? "");
  }, []);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/sites/golive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, slug }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Erreur.");
    else setLiveSlug(json.slug);
  }

  if (liveSlug) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-6 text-center">
        <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-[400px]" />
        <div className="relative max-w-[520px]">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mint-400/15 text-3xl text-mint-400">
            ✓
          </div>
          <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em]">
            Votre site est en ligne 🎉
          </h1>
          <p className="mt-3 text-muted">Votre portfolio est joignable ici :</p>
          <a
            href={`/s/${liveSlug}`}
            className="mt-5 inline-block rounded-xl border border-line bg-ink-700 px-5 py-3 font-medium text-violet-400 hover:text-violet-500"
          >
            /s/{liveSlug}
          </a>
          <div className="mt-8">
            <a
              href={`/s/${liveSlug}`}
              className="btn-violet rounded-full px-6 py-3.5 text-[15px] font-semibold text-white"
            >
              Voir mon site
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-[400px]" />
      <div className="relative w-full max-w-[460px]">
        <h1 className="text-center font-display text-[28px] font-semibold tracking-[-0.02em]">
          Nommez votre site
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          C'est l'adresse de votre portfolio. Vous pourrez brancher votre propre
          domaine plus tard.
        </p>

        <form onSubmit={submit} className="mt-7 rounded-[24px] border border-line bg-ink-700 p-8">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
            Nom du site
          </label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex : studio-lumen"
            className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-paper outline-none focus:border-violet-500"
          />
          <p className="mt-3 text-sm text-faint">
            Votre adresse :{" "}
            <span className="text-paper">/s/{slug || "votre-nom"}</span>
          </p>
          {error && <p className="mt-3 text-sm text-gold-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || slug.length < 2}
            className="btn-violet mt-6 w-full rounded-full px-6 py-4 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Mise en ligne…" : "Mettre en ligne 🚀"}
          </button>
        </form>
      </div>
    </main>
  );
}
