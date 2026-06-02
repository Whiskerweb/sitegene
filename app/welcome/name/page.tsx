"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NameSitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveSlug, setLiveSlug] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setToken(p.get("token") ?? "");
  }, []);

  // Une fois le site en ligne, on emmène le client DIRECTEMENT sur son dashboard.
  useEffect(() => {
    if (!liveSlug) return;
    const t = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1600);
    return () => clearTimeout(t);
  }, [liveSlug, router]);

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
      <main className="relative flex min-h-screen items-center justify-center bg-ink-900 px-6 text-center text-paper">
        <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-[440px] opacity-70" />
        <div className="relative max-w-[520px]">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mint-400/15 text-3xl text-mint-400">
            ✓
          </div>
          <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-paper">
            Votre site est en ligne 🎉
          </h1>
          <p className="mt-3 text-muted">
            Redirection vers votre tableau de bord… Vous pourrez y voir votre site
            et le modifier vous-même.
          </p>
          <a
            href={`/s/${liveSlug}`}
            className="mt-5 inline-block rounded-full border border-line bg-ink-700 px-5 py-3 font-medium text-violet-400 transition-colors hover:border-violet-500 hover:text-violet-500"
          >
            /s/{liveSlug}
          </a>
          <div className="mt-8">
            <a
              href="/dashboard"
              className="btn-violet inline-block rounded-full px-6 py-3.5 text-[15px] font-bold text-white"
            >
              Accéder à mon tableau de bord
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-ink-900 px-6 text-paper">
      <div className="glow-violet pointer-events-none absolute inset-x-0 top-0 h-[440px] opacity-70" />
      <div className="relative w-full max-w-[460px]">
        <h1 className="text-center font-display text-[28px] font-semibold tracking-[-0.02em] text-paper">
          Nommez votre site
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          C'est l'adresse de votre portfolio. Vous pourrez brancher votre propre
          domaine plus tard.
        </p>

        <form onSubmit={submit} className="mt-7 rounded-2xl border border-line bg-ink-700 p-8">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
            Nom du site
          </label>
          <input
            autoFocus
            required
            suppressHydrationWarning
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex : studio-lumen"
            className="w-full rounded-xl border border-line bg-ink-800 px-4 py-3 text-paper placeholder:text-faint outline-none transition-colors focus:border-violet-500"
          />
          <p className="mt-3 text-sm text-faint">
            Votre adresse :{" "}
            <span className="text-paper">/s/{slug || "votre-nom"}</span>
          </p>
          {error && <p className="mt-3 text-sm text-gold-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || slug.length < 2}
            className="btn-violet mt-6 w-full rounded-full px-6 py-4 text-[15px] font-bold text-white transition-opacity disabled:opacity-50"
          >
            {busy ? "Mise en ligne…" : "Mettre en ligne 🚀"}
          </button>
        </form>
      </div>
    </main>
  );
}
