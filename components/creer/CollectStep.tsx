// components/creer/CollectStep.tsx
"use client";

// Écran unique de collecte (tunnel /creer), affiché PENDANT l'assemblage.
// Liens proposés par métier + bouton « Ajouter un lien » + upload photos (max 20).
import { useMemo, useRef, useState } from "react";
import {
  PLATFORMS,
  linkFieldsForTrade,
  toHref,
  type Collected,
  type LinkKind,
} from "@/lib/foundry/link-catalog";
import type { TradeId } from "@/lib/foundry/da-personas";

type Props = {
  trade: TradeId;
  siteId: string | null;          // dispo dès que la génération a renvoyé l'id
  assemblyReady: boolean;          // génération terminée ?
  collected: Collected;
  onChange: (next: Collected) => void;
  onFinish: () => void;            // « Voir mon site »
  onSkip: () => void;
};

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

export default function CollectStep({ trade, siteId, assemblyReady, collected, onChange, onFinish, onSkip }: Props) {
  const defaults = useMemo(() => linkFieldsForTrade(trade), [trade]);
  const [extra, setExtra] = useState<string[]>([]);   // plateformes ajoutées via « + »
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const shownKeys = useMemo(() => {
    const base = defaults.map((d) => d.platform);
    return [...base, ...extra.filter((k) => !base.includes(k))];
  }, [defaults, extra]);

  const fields = shownKeys.map((platform) => {
    const def = PLATFORMS[platform] ?? PLATFORMS.link;
    return { platform, label: def.label, kind: def.kind, placeholder: def.placeholder };
  });

  async function onFiles(files: FileList | null) {
    if (!files || !siteId) return;
    setUploadError(null);
    setUploading(true);
    try {
      const remaining = 20 - collected.photos.length;
      const toSend = Array.from(files).slice(0, Math.max(0, remaining));
      const urls: string[] = [];
      for (const file of toSend) {
        const fd = new FormData();
        fd.append("siteId", siteId);
        fd.append("file", file);
        const res = await fetch("/api/site/photo", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) throw new Error(data?.error ?? "Upload impossible.");
        urls.push(data.url as string);
      }
      onChange({ ...collected, photos: [...collected.photos, ...urls].slice(0, 20) });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const allPlatformKeys = Object.keys(PLATFORMS);

  return (
    <section className="mx-auto max-w-2xl pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pendant qu&apos;on assemble votre site…</h1>
        <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
          Ajoutez vos liens et vos photos — tout est optionnel. On ne met sur le site que ce que vous nous donnez.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3 py-1 text-[13px]">
          {assemblyReady ? (
            <span className="font-semibold text-emerald-600">✓ Votre site est prêt</span>
          ) : (
            <span className="text-[rgb(var(--m-muted))]" style={{ animation: "sg-pulse 2s ease-in-out infinite" }}>
              Assemblage en cours…
            </span>
          )}
        </div>
      </div>

      {/* Liens */}
      <div className="mt-8 space-y-3">
        {fields.map((f) => (
          <label key={f.platform} className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold">{f.label}</span>
            <input
              value={rawValue(collected, f.platform, f.kind)}
              onChange={(e) => onChange(setValue(collected, f.platform, f.kind, e.target.value))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[rgb(var(--m-accent))]"
            />
          </label>
        ))}
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
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-[rgb(var(--m-line))] p-3">
            {allPlatformKeys.filter((k) => !shownKeys.includes(k)).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setExtra((e) => e.includes(k) ? e : [...e, k]); setPickerOpen(false); }}
                className="rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[12px] transition hover:border-[rgb(var(--m-accent))]"
              >
                {PLATFORMS[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Vos photos</span>
          <span className="text-[12px] text-[rgb(var(--m-faint))]">{collected.photos.length}/20</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {collected.photos.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-[rgb(var(--m-line))]">
              <img src={url} alt="" className="h-full w-full object-cover" />
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
          {collected.photos.length < 20 && (
            <button
              type="button"
              disabled={!siteId || uploading}
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[rgb(var(--m-line))] text-[12px] text-[rgb(var(--m-muted))] transition hover:border-[rgb(var(--m-accent))] disabled:opacity-40"
            >
              {uploading ? "…" : "+ Ajouter"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        {uploadError ? <p className="mt-2 text-[12px] text-red-600">{uploadError}</p> : null}
        {!siteId ? <p className="mt-2 text-[12px] text-[rgb(var(--m-faint))]">Préparation du dépôt photos…</p> : null}
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
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {assemblyReady ? "Voir mon site →" : "On termine l'assemblage…"}
        </button>
      </div>
    </section>
  );
}
