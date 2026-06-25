"use client";
// components/creer/ResalibImport.tsx
// Étape pitch de /creer (coachs / médecine douce) : le praticien colle le lien
// de sa page profil resalib.fr → on extrait nom, présentation, spécialités,
// avis, adresse et photos pour pré-remplir le site, et le lien Resalib devient
// le bouton « Prendre rendez-vous ». N'écrase jamais une saisie existante.
import { useState } from "react";
import {
  isResalibUrl,
  mergeResalibIntoCollected,
  resalibBriefAddition,
  type ResalibProfile,
} from "@/lib/foundry/resalib";
import type { Collected } from "@/lib/foundry/link-catalog";

/** draftId stable du tunnel (même clé que CollectStep) — dépôt photos anonyme. */
function getDraftId(): string {
  try {
    const existing = sessionStorage.getItem("akyra_draft_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem("akyra_draft_id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function ResalibImport({
  collected,
  onChange,
  brief,
  onBrief,
  onName,
}: {
  collected: Collected;
  onChange: (c: Collected) => void;
  brief: string;
  onBrief: (next: string) => void;
  onName: (name: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!isResalibUrl(url)) {
      setErr("Collez l'adresse de votre page profil Resalib (resalib.fr/praticien/…).");
      setOk(null);
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/foundry/resalib/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), draftId: getDraftId() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Import impossible. Réessayez.");

      const profile = data.profile as ResalibProfile;
      const photos = (Array.isArray(data.photos) ? data.photos : []) as string[];
      const bookingUrl = (data.bookingUrl as string) || url.trim();

      if (profile.name) onName(profile.name);
      const addition = resalibBriefAddition(profile);
      // Bornage à 6000 (plafond des routes charte/generate) — la bio peut être longue.
      if (addition) onBrief((brief.trim() ? `${brief.trim()}\n\n${addition}` : addition).slice(0, 6000));
      onChange(mergeResalibIntoCollected(collected, profile, bookingUrl, photos));

      const bits: string[] = [];
      if (profile.bio) bits.push("présentation complète");
      if (profile.specialties?.length) bits.push("spécialités");
      if (profile.credentials?.length) bits.push("diplômes");
      if (profile.reviews?.length) bits.push(`${profile.reviews.length} avis`);
      if (profile.address) bits.push("adresse");
      if (photos.length) bits.push(`${photos.length} photo${photos.length > 1 ? "s" : ""}`);
      bits.push("lien rendez-vous");
      setOk(`Importé : ${bits.join(", ")}. Vous pourrez tout ajuster à l'étape suivante.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--m-accent))]/30 bg-gradient-to-br from-[rgb(var(--m-accent))]/5 to-transparent p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-[15px]">✨</span>
        <span className="text-sm font-semibold">Vous êtes sur Resalib&nbsp;?</span>
      </div>
      <p className="mt-1 text-[13px] text-[rgb(var(--m-muted))]">
        Collez le lien de votre page profil&nbsp;: on pré-remplit votre présentation, vos avis et votre prise de rendez-vous.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && run()}
          inputMode="url"
          placeholder="https://www.resalib.fr/praticien/…"
          className="min-w-0 flex-1 rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[rgb(var(--m-accent))]"
        />
        <button
          type="button"
          onClick={run}
          disabled={busy || !url.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--m-accent))] px-5 text-[14px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Import…" : "Importer"}
        </button>
      </div>
      {ok && <p className="mt-2 text-[13px] font-medium text-emerald-600">✓ {ok}</p>}
      {err && <p className="mt-2 text-[13px] font-medium text-red-600">{err}</p>}
    </div>
  );
}
