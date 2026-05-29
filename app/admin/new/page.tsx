"use client";

import { useEffect, useRef, useState } from "react";
import { collectImageSlots } from "@/lib/content-overlay";
import { createClient } from "@/lib/supabase/client";

const TEMPLATES = [
  { id: "alice-r", name: "Aurelia — sombre & chaud" },
  { id: "potozon", name: "Potozon — pop & coloré" },
  { id: "target", name: "Target — éditorial & net" },
];

type Phase = "form" | "pending" | "done" | "error";

export default function NewSitePage() {
  const [templateId, setTemplateId] = useState("alice-r");
  const [defaultContent, setDefaultContent] = useState<Record<string, unknown> | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [rawText, setRawText] = useState("");
  const [files, setFiles] = useState<Record<string, File>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [message, setMessage] = useState("");
  const [revealPath, setRevealPath] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDefaultContent(null);
    setFiles({});
    fetch(`/_templates/${templateId}/default-content.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDefaultContent(d))
      .catch(() => {});
  }, [templateId]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const imageSlots = defaultContent ? collectImageSlots(defaultContent, templateId) : [];

  function pollJob(jobId: string) {
    const supabase = createClient();
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("jobs")
        .select("status, result, error")
        .eq("id", jobId)
        .maybeSingle();
      if (!data) return;
      if (data.status === "done") {
        clearInterval(pollRef.current!);
        setRevealPath((data.result as { revealPath?: string })?.revealPath ?? "");
        setPhase("done");
      } else if (data.status === "error") {
        clearInterval(pollRef.current!);
        setMessage(data.error ?? "Erreur de génération.");
        setPhase("error");
      }
    }, 2000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("pending");
    setMessage("");
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("firstName", firstName);
    fd.set("email", email);
    fd.set("rawText", rawText);
    for (const [slot, file] of Object.entries(files)) fd.append(`photo:${slot}`, file);

    const res = await fetch("/api/operator/intake", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "Erreur.");
      setPhase("error");
      return;
    }
    pollJob(json.jobId);
  }

  if (phase === "pending") {
    return (
      <div className="mx-auto max-w-[520px] py-16 text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-violet-500" />
        <h1 className="font-display text-[24px] font-medium">Claude fabrique le site…</h1>
        <p className="mt-2 text-sm text-muted">
          Le worker structure le texte et assemble le contenu. Ça prend quelques secondes.
        </p>
      </div>
    );
  }

  if (phase === "done") {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}${revealPath}`;
    return (
      <div className="mx-auto max-w-[600px] text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-mint-400/15 text-3xl text-mint-400">✓</div>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Site généré</h1>
        <p className="mt-2 text-muted">Envoyez ce lien au prospect :</p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-ink-700 p-2 pl-4">
          <code className="flex-1 truncate text-left text-sm text-paper">{url}</code>
          <button onClick={() => navigator.clipboard.writeText(url)} className="rounded-lg bg-ink-600 px-3 py-2 text-sm text-paper">Copier</button>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <a href={revealPath} target="_blank" rel="noreferrer" className="btn-violet rounded-full px-5 py-2.5 text-sm font-semibold text-white">Voir le reveal</a>
          <a href="/admin" className="rounded-full border border-line px-5 py-2.5 text-sm text-muted hover:text-paper">Retour au CRM</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[720px]">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Nouveau site</h1>
      <p className="mt-1 text-sm text-muted">
        Choisis un template, colle les infos brutes du photographe et dépose ses photos. Claude structure tout.
      </p>

      <section className="mt-8">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Template</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button type="button" key={t.id} onClick={() => setTemplateId(t.id)}
              className={`rounded-xl border p-4 text-left text-sm transition-colors ${templateId === t.id ? "border-violet-500 bg-ink-700 text-paper" : "border-line bg-ink-800 text-muted hover:text-paper"}`}>
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Prénom (code prospect) *</label>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-paper outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Email (optionnel)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-paper outline-none focus:border-violet-500" />
        </div>
      </section>

      <section className="mt-8">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">
          Infos brutes du photographe
        </label>
        <textarea
          rows={7}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Colle ici tout ce que tu sais : nom/marque, style, prestations, ville, bio, tarifs, citations… Claude s'occupe de structurer le tout dans le site."
          className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm leading-relaxed text-paper outline-none focus:border-violet-500"
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold text-paper">Photos ({imageSlots.length} emplacements)</h2>
        <p className="mb-3 text-xs text-faint">Clique une vignette pour déposer la photo du client. Non remplacée = image de démo.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageSlots.map((slot) => (
            <label key={slot} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-line bg-ink-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={files[slot] ? URL.createObjectURL(files[slot]) : slot} alt=""
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="absolute inset-x-0 bottom-0 bg-ink-900/70 py-1 text-center text-[11px] text-paper">
                {files[slot] ? "✓ déposée" : "déposer"}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles((s) => ({ ...s, [slot]: f })); }} />
            </label>
          ))}
        </div>
      </section>

      {phase === "error" && <p className="mt-6 text-sm text-gold-400">{message}</p>}

      <button type="submit" disabled={!firstName}
        className="btn-violet mt-8 w-full rounded-full px-6 py-4 text-[15px] font-semibold text-white disabled:opacity-60">
        Générer le site (via Claude)
      </button>
    </form>
  );
}
