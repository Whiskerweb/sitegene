"use client";

import { useEffect, useState } from "react";
import { collectImageSlots } from "@/lib/content-overlay";

const TEMPLATES = [
  { id: "alice-r", name: "Aurelia — sombre & chaud" },
  { id: "potozon", name: "Potozon — pop & coloré" },
  { id: "target", name: "Target — éditorial & net" },
];

type Field = { path: string; label: string; type: string; maxLen?: number };

function getPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

export default function NewSitePage() {
  const [templateId, setTemplateId] = useState("alice-r");
  const [manifest, setManifest] = useState<{ fields?: { editable?: Field[] } } | null>(null);
  const [defaultContent, setDefaultContent] = useState<Record<string, unknown> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ revealPath: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setManifest(null);
    setDefaultContent(null);
    setValues({});
    setFiles({});
    // Chargements indépendants : un échec n'empêche pas l'autre de s'afficher.
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/_templates/${templateId}/manifest.json`);
        if (r.ok && !cancelled) setManifest(await r.json());
      } catch {
        /* ignore */
      }
      try {
        const r = await fetch(`/_templates/${templateId}/default-content.json`);
        if (r.ok && !cancelled) setDefaultContent(await r.json());
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const scalarFields = (manifest?.fields?.editable ?? []).filter(
    (f) => !f.path.includes("[]"),
  );
  const imageSlots = defaultContent
    ? collectImageSlots(defaultContent, templateId)
    : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("firstName", firstName);
    fd.set("email", email);
    fd.set("overrides", JSON.stringify(values));
    for (const [slot, file] of Object.entries(files)) {
      fd.append(`photo:${slot}`, file);
    }
    const res = await fetch("/api/operator/generate", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Erreur.");
    else setResult(json);
  }

  if (result) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}${result.revealPath}`;
    return (
      <div className="mx-auto max-w-[600px] text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-mint-400/15 text-3xl text-mint-400">
          ✓
        </div>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
          Site généré
        </h1>
        <p className="mt-2 text-muted">Envoyez ce lien au prospect :</p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-ink-700 p-2 pl-4">
          <code className="flex-1 truncate text-left text-sm text-paper">{url}</code>
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="rounded-lg bg-ink-600 px-3 py-2 text-sm text-paper hover:bg-ink-500"
          >
            Copier
          </button>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <a href={result.revealPath} target="_blank" rel="noreferrer" className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            Voir le reveal
          </a>
          <a href="/admin" className="rounded-full border border-line px-5 py-2.5 text-sm text-muted hover:text-paper">
            Retour
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[720px]">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
        Nouveau site
      </h1>

      <section className="mt-8">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
          Template
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`rounded-xl border p-4 text-left text-sm transition-colors ${
                templateId === t.id
                  ? "border-violet-500 bg-ink-700 text-paper"
                  : "border-line bg-ink-800 text-muted hover:text-paper"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
            Prénom (code prospect) *
          </label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-paper outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
            Email (optionnel)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-paper outline-none focus:border-violet-500"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-paper">Textes</h2>
        <div className="grid gap-4">
          {scalarFields.map((f) => {
            const def = (getPath(defaultContent, f.path) ?? "") as string;
            return (
              <div key={f.path}>
                <label className="mb-1.5 block text-[13px] text-muted">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    maxLength={f.maxLen}
                    placeholder={def}
                    value={values[f.path] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.path]: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-sm text-paper outline-none focus:border-violet-500"
                  />
                ) : (
                  <input
                    maxLength={f.maxLen}
                    placeholder={def}
                    value={values[f.path] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.path]: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-sm text-paper outline-none focus:border-violet-500"
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-faint">
          Laissé vide = on garde le texte par défaut (placeholder). Les listes (services, œuvres) gardent les valeurs du template pour l'instant.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-paper">
          Photos ({imageSlots.length} emplacements)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageSlots.map((slot) => (
            <label
              key={slot}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-line bg-ink-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={files[slot] ? URL.createObjectURL(files[slot]) : slot}
                alt=""
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
              <span className="absolute inset-x-0 bottom-0 bg-ink-900/70 py-1 text-center text-[11px] text-paper">
                {files[slot] ? "✓ remplacée" : "remplacer"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFiles((f) => ({ ...f, [slot]: file }));
                }}
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">
          Cliquez une vignette pour remplacer par la photo du client. Non remplacée = image de démo.
        </p>
      </section>

      {error && <p className="mt-6 text-sm text-gold-400">{error}</p>}

      <button
        type="submit"
        disabled={busy || !firstName}
        className="btn-violet mt-8 w-full rounded-full px-6 py-4 text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Génération…" : "Générer le site + le lien"}
      </button>
    </form>
  );
}
