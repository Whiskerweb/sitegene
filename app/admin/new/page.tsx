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
  const [photos, setPhotos] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [message, setMessage] = useState("");
  const [revealPath, setRevealPath] = useState("");
  const [progress, setProgress] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  useEffect(() => {
    setDefaultContent(null);
    fetch(`/_templates/${templateId}/default-content.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDefaultContent(d))
      .catch(() => {});
  }, [templateId]);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    },
    [],
  );

  const required = defaultContent ? collectImageSlots(defaultContent, templateId).length : 0;
  const countOk = required > 0 && photos.length === required;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...imgs]);
  }

  function pollJob(jobId: string) {
    const supabase = createClient();
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("jobs")
        .select("status, progress, result, error")
        .eq("id", jobId)
        .maybeSingle();
      if (!data) return;
      setJobStatus((data.status as string) ?? "");
      setProgress((data.progress as string) ?? "");
      if (data.status === "done") {
        clearTimers();
        setRevealPath((data.result as { revealPath?: string })?.revealPath ?? "");
        setPhase("done");
      } else if (data.status === "error") {
        clearTimers();
        setMessage(data.error ?? "Erreur de génération.");
        setPhase("error");
      }
    }, 2000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("pending");
    setMessage("");
    setProgress("");
    setJobStatus("pending");
    setElapsed(0);
    tickRef.current = setInterval(() => setElapsed((x) => x + 1), 1000);
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("firstName", firstName);
    fd.set("email", email);
    fd.set("rawText", rawText);
    photos.forEach((f) => fd.append("photos", f));

    let res: Response;
    try {
      res = await fetch("/api/operator/intake", { method: "POST", body: fd });
    } catch {
      clearTimers();
      setMessage("Connexion au serveur impossible. Le dev server tourne-t-il ?");
      setPhase("error");
      return;
    }
    const text = await res.text();
    let json: { jobId?: string; error?: string } = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }
    if (!res.ok) {
      clearTimers();
      setMessage(json.error ?? `Erreur serveur (${res.status}).`);
      setPhase("error");
      return;
    }
    if (!json.jobId) {
      clearTimers();
      setMessage("Réponse inattendue du serveur (pas de jobId).");
      setPhase("error");
      return;
    }
    pollJob(json.jobId);
  }

  if (phase === "pending") {
    const stalled = jobStatus === "pending" && elapsed > 8;
    return (
      <div className="mx-auto max-w-[560px] py-16 text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-violet-500" />
        <h1 className="font-display text-[24px] font-medium">Claude fabrique le site…</h1>
        <p className="mt-3 text-sm text-paper">
          {progress ||
            (jobStatus === "running"
              ? "Traitement en cours…"
              : "Job en file, en attente du worker…")}
        </p>
        <p className="mt-1 text-xs text-faint">
          {elapsed}s · statut : {jobStatus || "…"}
        </p>

        {stalled && (
          <div className="mt-7 rounded-xl border border-gold-400/40 bg-ink-700 p-4 text-left text-sm text-muted">
            <p className="font-semibold text-gold-400">
              ⚠ Le worker ne semble pas démarré.
            </p>
            <p className="mt-1.5">
              Le job attend depuis {elapsed}s sans être pris en charge. Ouvre un
              terminal, lance la commande ci-dessous et laisse-la tourner :
            </p>
            <code className="mt-2 block rounded-lg bg-ink-900 px-3 py-2 text-paper">
              cd sitegene &amp;&amp; npm run worker
            </code>
            <p className="mt-2 text-xs">
              Dès qu'il tourne, il traitera ce job automatiquement (et les suivants).
            </p>
          </div>
        )}
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
        Choisis un template, colle les infos brutes et dépose les photos. Claude structure le texte et place les photos au bon endroit.
      </p>

      <section className="mt-8">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Template</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button type="button" key={t.id} onClick={() => { setTemplateId(t.id); setPhotos([]); }}
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
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Infos brutes du photographe</label>
        <textarea rows={6} value={rawText} onChange={(e) => setRawText(e.target.value)}
          placeholder="Nom/marque, style, prestations, ville, bio, tarifs… Claude structure tout dans le site."
          className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm leading-relaxed text-paper outline-none focus:border-violet-500" />
      </section>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-faint">Photos</label>
          <span className={`text-[13px] ${countOk ? "text-mint-400" : photos.length > required ? "text-gold-400" : "text-faint"}`}>
            {photos.length} / {required || "—"} requises
          </span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-violet-500 bg-ink-700" : "border-line bg-ink-800"}`}
        >
          <input id="photo-input" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => addFiles(e.target.files)} />
          <p className="text-sm text-muted">
            Glisse-dépose {required ? `les ${required} photos` : "les photos"} ici, ou{" "}
            <label htmlFor="photo-input" className="cursor-pointer font-semibold text-violet-400 hover:text-violet-500">parcours tes fichiers</label>.
          </p>
          <p className="mt-1 text-xs text-faint">Claude choisit automatiquement la meilleure photo pour chaque emplacement.</p>
        </div>

        {photos.length > 0 && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {photos.map((f, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-900/80 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPhotos([])} className="mt-2 text-xs text-faint hover:text-paper">Tout retirer</button>
          </>
        )}

        {photos.length > 0 && !countOk && (
          <p className="mt-3 text-[13px] text-gold-400">
            {photos.length < required
              ? `Il manque ${required - photos.length} photo(s).`
              : `Retire ${photos.length - required} photo(s) — il en faut exactement ${required}.`}
          </p>
        )}
      </section>

      {phase === "error" && <p className="mt-6 text-sm text-gold-400">{message}</p>}

      <button type="submit" disabled={!firstName || !countOk}
        className="btn-violet mt-8 w-full rounded-full px-6 py-4 text-[15px] font-semibold text-white disabled:opacity-50">
        Générer le site (via Claude)
      </button>
    </form>
  );
}
