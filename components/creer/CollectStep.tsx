// components/creer/CollectStep.tsx
"use client";

// Écran unique de collecte (tunnel /creer), affiché PENDANT la génération des chartes.
// - Import « magique » : collez votre site / Instagram → liens & contacts pré-remplis.
// - Liens proposés par métier + « Ajouter un lien ».
// - Photos : drag & drop, aperçu instantané, compression navigateur, uploads
//   parallèles SANS compte (staging par draftId), réordonnancement (1re = hero).
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PLATFORMS,
  linkFieldsForTrade,
  toHref,
  type Collected,
  type LinkKind,
} from "@/lib/foundry/link-catalog";
import { classifyImportUrl, mergeScrapedIntoCollected } from "@/lib/foundry/collect-import";
import { compressImage } from "@/lib/client/compress-image";
import type { ScrapedSite } from "@/lib/scrape-site";
import type { TradeId } from "@/lib/foundry/da-personas";
import SocialIcon from "@/components/foundry/components/SocialIcon";

type Props = {
  trade: TradeId;
  chartesReady: boolean;          // génération des chartes terminée ?
  collected: Collected;
  onChange: (next: Collected) => void;
  onFinish: () => void;           // → va à la phase vibe (choisir la charte)
  onSkip: () => void;
};

const MAX_PHOTOS = 20;
const UPLOAD_CONCURRENCY = 3;

type PendingPhoto = { key: string; preview: string; status: "uploading" | "error"; file: File };

/** draftId stable du tunnel (sessionStorage) — clé du dépôt photos anonyme. */
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

/** Range une valeur saisie dans le bon seau de Collected selon le kind. */
function setValue(c: Collected, platform: string, kind: LinkKind, raw: string): Collected {
  const href = raw.trim() ? toHref(platform, raw) : "";
  const next: Collected = { ...c, contact: { ...c.contact }, socials: [...c.socials] };
  if (kind === "contact") {
    if (platform === "phone") next.contact.phone = href || undefined;
    else if (platform === "whatsapp") next.contact.whatsapp = href || undefined;
    else if (platform === "email") next.contact.email = href || undefined;
    else if (platform === "maps") next.contact.mapsUrl = href || undefined;
    return next;
  }
  if (kind === "booking") {
    next.booking = href ? { label: PLATFORMS[platform]?.label ?? "Réserver", href } : undefined;
    return next;
  }
  // social | link → liste socials (dédupliquée par platform)
  next.socials = next.socials.filter((s) => s.platform !== platform);
  if (href) next.socials.push({ platform, href, label: PLATFORMS[platform]?.label });
  return next;
}

/** Valeur brute courante d'un champ (pour le contrôle de l'input). */
function rawValue(c: Collected, platform: string, kind: LinkKind): string {
  if (kind === "contact") {
    const map: Record<string, string | undefined> = {
      phone: c.contact.phone, whatsapp: c.contact.whatsapp, email: c.contact.email, maps: c.contact.mapsUrl,
    };
    return map[platform] ?? "";
  }
  if (kind === "booking") return c.booking?.href ?? "";
  return c.socials.find((s) => s.platform === platform)?.href ?? "";
}

/** Plateformes qui portent une valeur dans Collected (pour les rendre visibles). */
function platformsWithValue(c: Collected): string[] {
  const keys = c.socials.map((s) => s.platform);
  if (c.contact.phone) keys.push("phone");
  if (c.contact.whatsapp) keys.push("whatsapp");
  if (c.contact.email) keys.push("email");
  if (c.contact.mapsUrl) keys.push("maps");
  if (c.booking?.href) keys.push("booking");
  return keys.filter((k) => PLATFORMS[k]);
}

export default function CollectStep({ trade, chartesReady, collected, onChange, onFinish, onSkip }: Props) {
  const defaults = useMemo(() => linkFieldsForTrade(trade), [trade]);
  const [extra, setExtra] = useState<string[]>([]);   // plateformes ajoutées via « + » ou l'import
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Import magique
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Photos
  const draftIdRef = useRef<string | null>(null);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fiche technique (musiciens uniquement)
  const [riderUploading, setRiderUploading] = useState(false);
  const [riderError, setRiderError] = useState<string | null>(null);
  const riderRef = useRef<HTMLInputElement>(null);
  const collectedRef = useRef(collected);
  useEffect(() => {
    collectedRef.current = collected;
  }, [collected]);

  const shownKeys = useMemo(() => {
    const withValue = platformsWithValue(collected);
    const base = defaults.map((d) => d.platform).filter((k) => !dismissed.includes(k));
    const adds = [...extra, ...withValue].filter((k) => !base.includes(k) && !dismissed.includes(k));
    return [...base, ...Array.from(new Set(adds))];
  }, [defaults, extra, dismissed, collected]);

  const fields = shownKeys.map((platform) => {
    const def = PLATFORMS[platform] ?? PLATFORMS.link;
    return { platform, label: def.label, kind: def.kind, placeholder: def.placeholder };
  });

  function dismissField(platform: string) {
    setDismissed((d) => (d.includes(platform) ? d : [...d, platform]));
    setExtra((e) => e.filter((k) => k !== platform));
    // Vide aussi la valeur, sinon le champ réapparaîtrait (plateforme avec valeur).
    const def = PLATFORMS[platform];
    if (def) onChange(setValue(collectedRef.current, platform, def.kind, ""));
  }

  // --- Import magique -----------------------------------------------------------
  async function runImport() {
    const target = classifyImportUrl(importUrl);
    setImportMsg(null);
    if (!target) {
      setImportMsg({ tone: "err", text: "Collez une adresse valide (site, Instagram, Facebook…)." });
      return;
    }
    // Profil social / réservation : rangé directement, sans scrape.
    if (target.kind === "social") {
      const def = PLATFORMS[target.platform];
      onChange(setValue(collectedRef.current, target.platform, def?.kind ?? "social", target.href));
      setExtra((e) => (e.includes(target.platform) ? e : [...e, target.platform]));
      setDismissed((d) => d.filter((k) => k !== target.platform));
      setImportMsg({ tone: "ok", text: `${def?.label ?? "Lien"} ajouté ✓` });
      setImportUrl("");
      return;
    }
    // Site web : scrape serveur puis fusion (jamais d'écrasement de saisie).
    setImporting(true);
    try {
      const res = await fetch("/api/foundry/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.data) {
        throw new Error(data?.error ?? "Site inaccessible — vérifiez l'adresse.");
      }
      const { collected: merged, summary } = mergeScrapedIntoCollected(
        collectedRef.current,
        data.data as ScrapedSite,
        target.url,
      );
      onChange(merged);
      const found = summary.links + summary.contacts;
      setImportMsg(
        found > 0
          ? { tone: "ok", text: `${summary.links} lien${summary.links > 1 ? "s" : ""} et ${summary.contacts} contact${summary.contacts > 1 ? "s" : ""} importés ✓ — vérifiez ci-dessous.` }
          : { tone: "ok", text: "Site lisible, mais rien à importer — complétez à la main." },
      );
      setImportUrl("");
    } catch (e) {
      setImportMsg({ tone: "err", text: e instanceof Error ? e.message : "Import impossible." });
    } finally {
      setImporting(false);
    }
  }

  // --- Photos ---------------------------------------------------------------------
  // Ajout synchronisé via la ref : deux uploads parallèles qui aboutissent en
  // même temps ne s'écrasent pas (l'état React seul perdrait une photo).
  function appendPhoto(url: string) {
    const current = collectedRef.current;
    const next = { ...current, photos: [...current.photos, url].slice(0, MAX_PHOTOS) };
    collectedRef.current = next;
    onChange(next);
  }

  async function uploadOne(item: PendingPhoto): Promise<void> {
    if (!draftIdRef.current) draftIdRef.current = getDraftId();
    try {
      const compressed = await compressImage(item.file);
      const fd = new FormData();
      fd.append("draftId", draftIdRef.current);
      fd.append("file", compressed);
      const res = await fetch("/api/foundry/photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "Upload impossible.");
      appendPhoto(data.url as string);
      setPending((p) => p.filter((x) => x.key !== item.key));
      URL.revokeObjectURL(item.preview);
    } catch {
      setPending((p) => p.map((x) => (x.key === item.key ? { ...x, status: "error" } : x)));
    }
  }

  async function onFiles(files: FileList | File[] | null) {
    if (!files) return;
    const room = MAX_PHOTOS - collectedRef.current.photos.length - pending.length;
    const accepted = Array.from(files)
      .filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
      .slice(0, Math.max(0, room));
    if (accepted.length === 0) return;

    const items: PendingPhoto[] = accepted.map((file) => ({
      key: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      status: "uploading",
      file,
    }));
    setPending((p) => [...p, ...items]);

    // Pool d'uploads parallèles (3 max) — chaque succès apparaît dès qu'il aboutit.
    const queue = [...items];
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) await uploadOne(next);
      }),
    );
  }

  // --- Fiche technique (musiciens) -------------------------------------------------
  async function onRiderFile(file: File | null | undefined) {
    if (!file) return;
    if (!draftIdRef.current) draftIdRef.current = getDraftId();
    setRiderError(null);
    setRiderUploading(true);
    try {
      const fd = new FormData();
      fd.append("draftId", draftIdRef.current);
      fd.append("file", file);
      const res = await fetch("/api/foundry/document", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "Envoi impossible.");
      onChange({ ...collectedRef.current, techRider: { href: data.url as string, name: (data.name as string) ?? file.name } });
    } catch (e) {
      setRiderError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setRiderUploading(false);
      if (riderRef.current) riderRef.current.value = "";
    }
  }

  function retryUpload(key: string) {
    const item = pending.find((x) => x.key === key);
    if (!item) return;
    setPending((p) => p.map((x) => (x.key === key ? { ...x, status: "uploading" } : x)));
    void uploadOne({ ...item, status: "uploading" });
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const photos = [...collected.photos];
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    [photos[i], photos[j]] = [photos[j], photos[i]];
    onChange({ ...collected, photos });
  }

  const allPlatformKeys = Object.keys(PLATFORMS);
  const photoCount = collected.photos.length + pending.length;

  return (
    <section className="mx-auto max-w-2xl pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Personnalisez votre site</h1>
        <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
          Vos liens et vos photos — on les injecte dans votre site. Tout est optionnel.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3 py-1 text-[13px]">
          {chartesReady ? (
            <span className="font-semibold text-emerald-600">✓ Chartes prêtes</span>
          ) : (
            <span className="text-[rgb(var(--m-muted))]" style={{ animation: "sg-pulse 2s ease-in-out infinite" }}>
              On compose vos chartes…
            </span>
          )}
        </div>
      </div>

      {/* Import magique : un lien → tout se pré-remplit */}
      <div className="mt-6 rounded-2xl border border-[rgb(var(--m-accent))]/30 bg-[rgb(var(--m-accent))]/5 p-4">
        <label className="text-[13px] font-semibold">
          Vous êtes déjà quelque part en ligne ? <span className="font-normal text-[rgb(var(--m-muted))]">Collez un lien, on remplit pour vous.</span>
        </label>
        <div className="mt-2 flex gap-2">
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void runImport(); } }}
            placeholder="votre-site.fr, instagram.com/vous, calendly.com/vous…"
            inputMode="url"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-3.5 text-[14px] outline-none transition focus:border-[rgb(var(--m-accent))]"
          />
          <button
            type="button"
            disabled={importing || importUrl.trim().length < 4}
            onClick={() => void runImport()}
            className="h-11 shrink-0 rounded-xl bg-[rgb(var(--m-accent))] px-4 text-[14px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {importing ? "Lecture…" : "Importer"}
          </button>
        </div>
        {importMsg ? (
          <p className={`mt-2 text-[12.5px] font-medium ${importMsg.tone === "ok" ? "text-emerald-600" : "text-red-600"}`}>
            {importMsg.text}
          </p>
        ) : null}
      </div>

      {/* Liens */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgb(var(--m-line))]">
        {fields.map((f, i) => {
          const value = rawValue(collected, f.platform, f.kind);
          return (
            <div
              key={f.platform}
              className={`flex items-center gap-3 px-4 py-3 ${i !== fields.length - 1 ? "border-b border-[rgb(var(--m-line))]" : ""}`}
            >
              <SocialIcon platform={f.platform} className="h-5 w-5 shrink-0 text-[rgb(var(--m-muted))]" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">
                  {f.label}
                </span>
                <input
                  value={value}
                  onChange={(e) => onChange(setValue(collected, f.platform, f.kind, e.target.value))}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent text-[14px] text-[rgb(var(--m-ink))] outline-none placeholder:text-[rgb(var(--m-faint))]"
                />
              </div>
              {value ? <span className="shrink-0 text-[13px] text-emerald-600">✓</span> : null}
              <button
                type="button"
                onClick={() => dismissField(f.platform)}
                aria-label={`Retirer ${f.label}`}
                className="ml-1 shrink-0 rounded-full p-1 text-[rgb(var(--m-faint))] transition hover:text-[rgb(var(--m-ink))]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2l-8 8"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Ajouter un lien */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="rounded-full border border-dashed border-[rgb(var(--m-line))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
        >
          + Ajouter un lien
        </button>
        {pickerOpen && (
          <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl border border-[rgb(var(--m-line))] p-3 sm:grid-cols-4">
            {allPlatformKeys.filter((k) => !shownKeys.includes(k)).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setExtra((e) => e.includes(k) ? e : [...e, k]);
                  setDismissed((d) => d.filter((x) => x !== k));
                  setPickerOpen(false);
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgb(var(--m-line))] p-2.5 text-center transition hover:border-[rgb(var(--m-accent))]"
              >
                <SocialIcon platform={k} className="h-5 w-5 text-[rgb(var(--m-muted))]" />
                <span className="text-[11px] leading-tight text-[rgb(var(--m-ink))]">{PLATFORMS[k].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fiche technique — musiciens uniquement */}
      {trade === "musicien" && (
        <div className="mt-8 rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-accent))]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l11-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="15" r="3" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold">Votre fiche technique</span>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[rgb(var(--m-muted))]">
                Les organisateurs pourront la télécharger en un clic depuis votre site — le bouton
                principal s'en chargera.
              </p>
              {collected.techRider?.href ? (
                <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[rgb(var(--m-line))] px-3 py-2">
                  <span className="truncate text-[13px] font-medium">{collected.techRider.name ?? "fiche-technique.pdf"}</span>
                  <span className="text-[13px] text-emerald-600">✓</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...collected, techRider: undefined })}
                    aria-label="Retirer la fiche technique"
                    className="ml-auto shrink-0 rounded-full p-1 text-[rgb(var(--m-faint))] transition hover:text-[rgb(var(--m-ink))]"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={riderUploading}
                  onClick={() => riderRef.current?.click()}
                  className="mt-2.5 rounded-full border border-dashed border-[rgb(var(--m-line))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--m-muted))] transition hover:border-[rgb(var(--m-accent))] hover:text-[rgb(var(--m-ink))] disabled:opacity-40"
                >
                  {riderUploading ? "Envoi…" : "+ Déposer le PDF"}
                </button>
              )}
              {riderError ? <p className="mt-1.5 text-[12px] text-red-600">{riderError}</p> : null}
            </div>
          </div>
          <input ref={riderRef} type="file" accept="application/pdf" hidden onChange={(e) => { void onRiderFile(e.target.files?.[0]); }} />
        </div>
      )}

      {/* Photos */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Vos photos</span>
          <span className="text-[12px] text-[rgb(var(--m-faint))]">{photoCount}/{MAX_PHOTOS}</span>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); void onFiles(e.dataTransfer.files); }}
          className={`mt-2 rounded-3xl transition ${dragOver ? "ring-2 ring-[rgb(var(--m-accent))] ring-offset-2" : ""}`}
        >
          {photoCount === 0 ? (
            /* Dropzone vide premium : un seul grand geste, pas un petit carré perdu */
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[rgb(var(--m-line))] bg-gradient-to-b from-[rgb(var(--m-elevated))]/60 to-transparent px-6 py-12 text-center transition hover:border-[rgb(var(--m-accent))]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-accent))] shadow-cloud-sm transition group-hover:scale-105">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                </svg>
              </span>
              <span className="text-[15px] font-semibold text-[rgb(var(--m-ink))]">Glissez vos photos ici</span>
              <span className="text-[12.5px] leading-relaxed text-[rgb(var(--m-muted))]">
                ou cliquez pour parcourir · JPG, PNG, WebP
                <br />
                La première devient l'image principale de votre site.
              </span>
            </button>
          ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {collected.photos.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-[rgb(var(--m-line))]">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded-full bg-[rgb(var(--m-accent))] px-1.5 py-0.5 text-[9px] font-bold text-[rgb(var(--m-on-accent))]">
                    Principale
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 hidden items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent pb-1 pt-3 group-hover:flex">
                  <button
                    type="button"
                    onClick={() => movePhoto(i, -1)}
                    disabled={i === 0}
                    aria-label="Avancer la photo"
                    className="rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-neutral-800 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(i, 1)}
                    disabled={i === collected.photos.length - 1}
                    aria-label="Reculer la photo"
                    className="rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-neutral-800 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...collected, photos: collected.photos.filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 text-[11px] text-white group-hover:block"
                  aria-label="Retirer"
                >
                  ✕
                </button>
              </div>
            ))}
            {pending.map((p) => (
              <div key={p.key} className="relative aspect-square overflow-hidden rounded-xl border border-[rgb(var(--m-line))]">
                <img src={p.preview} alt="" className={`h-full w-full object-cover ${p.status === "uploading" ? "opacity-50" : "opacity-30"}`} />
                {p.status === "uploading" ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent drop-shadow" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => retryUpload(p.key)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-red-600"
                  >
                    <span>Échec</span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5">↻ Réessayer</span>
                  </button>
                )}
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]/50 text-[11.5px] font-medium text-[rgb(var(--m-muted))] transition hover:-translate-y-0.5 hover:border-[rgb(var(--m-accent))] hover:shadow-cloud-sm"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[rgb(var(--m-accent))]/10 text-[15px] leading-none text-[rgb(var(--m-accent))] transition group-hover:scale-110">+</span>
                <span>Ajouter</span>
              </button>
            )}
          </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {/* Actions */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--m-line))] px-5 text-[15px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
        >
          Passer
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition hover:opacity-90"
        >
          {chartesReady ? "Choisir ma charte →" : "Voir mes chartes →"}
        </button>
      </div>
    </section>
  );
}
