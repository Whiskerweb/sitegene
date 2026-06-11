// components/creer/ImportCharte.tsx
"use client";

// « J'ai déjà une identité visuelle » (étape charte de /creer), deux chemins :
//   1. COMPOSER  — mode, deux couleurs, fontes display/texte, coins ; aperçu
//      façon planche de design system (rampes de teintes, spécimens Aa,
//      boutons, pastilles hex) — inspiré des planches Stitch/Material.
//   2. FICHIER   — le client dépose sa charte (image ou PDF) ; Mistral vision
//      l'analyse et pré-remplit le composeur, ajustable avant application.
// Toute sortie passe par repairCharte (pur, partagé serveur) : contrastes
// WCAG, saturation plafonnée, fonts liste blanche — impossible de casser le site.
import { useMemo, useRef, useState } from "react";
import { CHARTE_FONTS, repairCharte, vibeToSpec, type CharteSpec } from "@/lib/foundry/charte";
import { compressImage } from "@/lib/client/compress-image";
import type { Vibe } from "@/lib/foundry/types";

export type ImportedCharte = { vibe: Vibe; spec: CharteSpec; reason: string };

type Props = {
  businessName: string;
  onApply: (charte: ImportedCharte) => void;
};

/** Paires typographiques curées (raccourcis ; les selects permettent tout le reste). */
const FONT_PAIRS: Array<{ label: string; heading: string; body: string }> = [
  { label: "Élégant", heading: "Fraunces", body: "Outfit" },
  { label: "Éditorial", heading: "Playfair Display", body: "Source Sans 3" },
  { label: "Moderne", heading: "Space Grotesk", body: "Figtree" },
  { label: "Affirmé", heading: "Bricolage Grotesque", body: "Manrope" },
  { label: "Sobre", heading: "Archivo", body: "Work Sans" },
  { label: "Littéraire", heading: "Newsreader", body: "DM Sans" },
];

const CORNER_OPTIONS = [
  { id: "sharp" as const, label: "Nets", radius: "8px" },
  { id: "soft" as const, label: "Doux", radius: "14px" },
  { id: "round" as const, label: "Ronds", radius: "999px" },
];

const HEX_RE = /^#?[0-9a-f]{6}$/i;

function mixHex(a: string, b: string, t: number): string {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const c = [0, 2, 4].map((i) => {
    const va = parseInt(pa.slice(i, i + 2), 16);
    const vb = parseInt(pb.slice(i, i + 2), 16);
    return Math.round(va + (vb - va) * t);
  });
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Rampe de 4 teintes (clair → foncé) autour d'une couleur, façon planche DS. */
function ramp(hex: string): string[] {
  return [mixHex(hex, "#ffffff", 0.62), mixHex(hex, "#ffffff", 0.3), hex, mixHex(hex, "#000000", 0.28)];
}

const HEADING_FAMILIES = CHARTE_FONTS.filter((f) => f.roles.includes("heading")).map((f) => f.family);
const BODY_FAMILIES = CHARTE_FONTS.filter((f) => f.roles.includes("body")).map((f) => f.family);

export default function ImportCharte({ businessName, onApply }: Props) {
  const [tab, setTab] = useState<"compose" | "file">("compose");

  // Composeur
  const [accent, setAccent] = useState("#3d5a80");
  const [hexInput, setHexInput] = useState("#3d5a80");
  const [accent2, setAccent2] = useState<string | null>(null);
  const [hex2Input, setHex2Input] = useState("");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [headingFont, setHeadingFont] = useState("Fraunces");
  const [bodyFont, setBodyFont] = useState("Outfit");
  const [corners, setCorners] = useState<"sharp" | "soft" | "round">("soft");
  // Base extraite d'un fichier (couleurs de fond/encre incluses) — les contrôles
  // du composeur la raffinent sans la perdre.
  const [extractedBase, setExtractedBase] = useState<Record<string, unknown> | null>(null);

  // Fichier
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [fileMsg, setFileMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [fileDrag, setFileDrag] = useState(false);

  function commitHex(raw: string, set: (v: string) => void, setInput: (v: string) => void) {
    setInput(raw);
    const v = raw.trim().toLowerCase();
    if (HEX_RE.test(v)) set(v.startsWith("#") ? v : `#${v}`);
  }

  // Aperçu live : exactement la réparation appliquée au moment de générer.
  const preview = useMemo(() => {
    return repairCharte({
      ...(extractedBase ?? {}),
      name: businessName.trim() ? `Charte ${businessName.trim().slice(0, 30)}` : "Votre charte",
      mood: (extractedBase?.mood as string[] | undefined) ?? ["personnel", "fidèle", "cohérent"],
      mode,
      accent,
      ...(accent2 ? { accent2 } : {}),
      headingFont,
      bodyFont,
      corners,
    });
  }, [businessName, mode, accent, accent2, headingFont, bodyFont, corners, extractedBase]);

  function apply() {
    onApply({
      vibe: preview,
      spec: { ...vibeToSpec(preview) },
      reason: extractedBase
        ? "Extraite de votre charte graphique, ajustée par vos soins."
        : "Construite à partir de votre identité visuelle existante.",
    });
  }

  async function onExtractFile(file: File | null | undefined) {
    if (!file) return;
    setFileMsg(null);
    setExtracting(true);
    try {
      const payload = /^image\//.test(file.type) ? await compressImage(file) : file;
      const fd = new FormData();
      fd.append("file", payload);
      const res = await fetch("/api/foundry/charte/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.charte) {
        throw new Error(data?.error ?? "Lecture impossible.");
      }
      const spec = data.charte.spec as CharteSpec & { mode?: "light" | "dark" };
      setExtractedBase(spec as unknown as Record<string, unknown>);
      setMode(spec.mode === "dark" ? "dark" : "light");
      setAccent(spec.accent);
      setHexInput(spec.accent);
      setAccent2(spec.accent2 ?? null);
      setHex2Input(spec.accent2 ?? "");
      setHeadingFont(spec.headingFont);
      setBodyFont(spec.bodyFont);
      setCorners(spec.corners);
      setTab("compose");
      setFileMsg({ tone: "ok", text: "Charte reconnue ✓ — vérifiez et ajustez ci-dessous, puis appliquez." });
    } catch (e) {
      setFileMsg({ tone: "err", text: e instanceof Error ? e.message : "Lecture impossible." });
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const segBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
      active ? "bg-[rgb(var(--m-ink))] text-white shadow-sm" : "text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
    }`;

  return (
    <div className="mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-3xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-left shadow-cloud-sm">
      <link rel="stylesheet" href={preview.fontHref} precedence="foundry-fonts" />

      {/* Onglets */}
      <div className="flex items-center gap-1 border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]/60 px-4 py-2.5">
        <button type="button" onClick={() => setTab("compose")} className={segBtn(tab === "compose")}>
          Composer
        </button>
        <button type="button" onClick={() => setTab("file")} className={segBtn(tab === "file")}>
          Depuis un fichier ✦
        </button>
        {extractedBase && tab === "compose" ? (
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
            Base : votre fichier
          </span>
        ) : null}
      </div>

      {/* ============ Onglet fichier : dépôt + extraction IA ============ */}
      {tab === "file" && (
        <div className="p-5">
          <button
            type="button"
            disabled={extracting}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setFileDrag(true); }}
            onDragLeave={() => setFileDrag(false)}
            onDrop={(e) => { e.preventDefault(); setFileDrag(false); void onExtractFile(e.dataTransfer.files?.[0]); }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition ${
              fileDrag ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/5" : "border-[rgb(var(--m-line))] hover:border-[rgb(var(--m-accent))]"
            } disabled:opacity-60`}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-accent))]">
              {extracting ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.78-.68 1.78-1.59 0-.49-.2-.93-.5-1.22-.3-.3-.5-.74-.5-1.19a1.7 1.7 0 0 1 1.7-1.7H16a6 6 0 0 0 6-6c0-4.5-4.5-8.3-10-8.3" />
                </svg>
              )}
            </span>
            <span className="text-[15px] font-semibold text-[rgb(var(--m-ink))]">
              {extracting ? "Le directeur artistique lit votre charte…" : "Déposez votre charte graphique"}
            </span>
            <span className="text-[12.5px] leading-relaxed text-[rgb(var(--m-muted))]">
              Image (JPG, PNG, WebP) ou PDF — logo, couleurs, typographies :<br />
              l'IA reconnaît tout et pré-remplit le composeur.
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={(e) => void onExtractFile(e.target.files?.[0])} />
          {fileMsg ? (
            <p className={`mt-3 text-[12.5px] font-medium ${fileMsg.tone === "ok" ? "text-emerald-600" : "text-red-600"}`}>{fileMsg.text}</p>
          ) : null}
        </div>
      )}

      {/* ============ Onglet composeur ============ */}
      {tab === "compose" && (
        <div className="grid gap-0 md:grid-cols-[300px_1fr]">
          {/* Contrôles */}
          <div className="flex flex-col gap-5 border-b border-[rgb(var(--m-line))] p-5 md:border-b-0 md:border-r">
            {fileMsg?.tone === "ok" ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700">{fileMsg.text}</p>
            ) : null}

            {/* Mode */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Mode</span>
              <div className="mt-2 inline-flex rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]/60 p-0.5">
                <button type="button" onClick={() => setMode("light")} className={segBtn(mode === "light")}>☀ Clair</button>
                <button type="button" onClick={() => setMode("dark")} className={segBtn(mode === "dark")}>☾ Sombre</button>
              </div>
            </div>

            {/* Couleurs */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Couleur principale</span>
              <div className="mt-2 flex items-center gap-2">
                <input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setHexInput(e.target.value); }} aria-label="Couleur principale" className="h-10 w-12 cursor-pointer rounded-lg border border-[rgb(var(--m-line))] bg-transparent p-1" />
                <input value={hexInput} onChange={(e) => commitHex(e.target.value, setAccent, setHexInput)} placeholder="#3d5a80" spellCheck={false} className="h-10 w-28 rounded-xl border border-[rgb(var(--m-line))] bg-transparent px-3 font-mono text-[13px] uppercase outline-none transition focus:border-[rgb(var(--m-accent))]" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Couleur secondaire <span className="normal-case text-[rgb(var(--m-faint))]">(optionnelle)</span></span>
              <div className="mt-2 flex items-center gap-2">
                <input type="color" value={accent2 ?? mixHex(accent, "#ffffff", 0.45)} onChange={(e) => { setAccent2(e.target.value); setHex2Input(e.target.value); }} aria-label="Couleur secondaire" className="h-10 w-12 cursor-pointer rounded-lg border border-[rgb(var(--m-line))] bg-transparent p-1" />
                <input value={hex2Input} onChange={(e) => commitHex(e.target.value, (v) => setAccent2(v), setHex2Input)} placeholder="auto" spellCheck={false} className="h-10 w-28 rounded-xl border border-[rgb(var(--m-line))] bg-transparent px-3 font-mono text-[13px] uppercase outline-none transition focus:border-[rgb(var(--m-accent))]" />
                {accent2 ? (
                  <button type="button" onClick={() => { setAccent2(null); setHex2Input(""); }} className="text-[12px] text-[rgb(var(--m-faint))] underline-offset-2 hover:underline">auto</button>
                ) : null}
              </div>
            </div>

            {/* Typographies */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Typographies</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FONT_PAIRS.map((p) => {
                  const active = headingFont === p.heading && bodyFont === p.body;
                  return (
                    <button key={p.label} type="button" onClick={() => { setHeadingFont(p.heading); setBodyFont(p.body); }} className={`rounded-full border px-3 py-1 text-[12px] font-medium transition ${active ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-ink))]" : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))]"}`}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Display</span>
                  <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} className="h-9 rounded-xl border border-[rgb(var(--m-line))] bg-transparent px-2 text-[13px] outline-none transition focus:border-[rgb(var(--m-accent))]">
                    {HEADING_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Texte</span>
                  <select value={bodyFont} onChange={(e) => setBodyFont(e.target.value)} className="h-9 rounded-xl border border-[rgb(var(--m-line))] bg-transparent px-2 text-[13px] outline-none transition focus:border-[rgb(var(--m-accent))]">
                    {BODY_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Coins */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Coins</span>
              <div className="mt-2 flex gap-2">
                {CORNER_OPTIONS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCorners(c.id)} className={`border px-4 py-1.5 text-[13px] font-medium transition ${corners === c.id ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-ink))]" : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))]"}`} style={{ borderRadius: c.radius }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aperçu : planche de design system (rampes + spécimens + boutons) */}
          <div className="flex flex-col p-5">
            <div className="flex-1 overflow-hidden rounded-2xl border border-black/5 p-4" style={{ background: preview.palette.surface }}>
              <div className="grid grid-cols-[88px_1fr] gap-3">
                {/* Rampes de teintes */}
                <div className="flex flex-col gap-2">
                  {[preview.palette.accent, preview.palette.accent2].map((c, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-black/10" style={{ background: preview.palette.card }}>
                      <div className="px-2 pb-1 pt-1.5 font-mono text-[8.5px] uppercase" style={{ color: preview.palette.muted }}>{c.replace("#", "#").toUpperCase()}</div>
                      {ramp(c).map((shade, j) => (
                        <div key={j} className="h-5 w-full" style={{ background: shade }} />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Spécimens + boutons */}
                <div className="flex flex-col gap-2">
                  <div className="rounded-xl border border-black/10 px-3 py-2.5" style={{ background: preview.palette.card }}>
                    <div className="font-mono text-[8.5px] uppercase" style={{ color: preview.palette.muted }}>Display</div>
                    <div className="text-[34px] leading-none" style={{ fontFamily: preview.fonts.heading, color: preview.palette.ink }}>Aa</div>
                    <div className="mt-1 text-[10.5px] font-semibold" style={{ color: preview.palette.muted, fontFamily: preview.fonts.body }}>
                      {headingFont}
                    </div>
                  </div>
                  <div className="rounded-xl border border-black/10 px-3 py-2.5" style={{ background: preview.palette.card }}>
                    <div className="font-mono text-[8.5px] uppercase" style={{ color: preview.palette.muted }}>Texte</div>
                    <div className="text-[24px] leading-none" style={{ fontFamily: preview.fonts.body, color: preview.palette.ink }}>Aa</div>
                    <div className="mt-1 text-[10.5px]" style={{ color: preview.palette.muted, fontFamily: preview.fonts.body }}>
                      {bodyFont} — Vos couleurs, vos lettres, sur chaque section.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5" style={{ background: preview.palette.card }}>
                    <span className="px-3.5 py-1.5 text-[11px] font-semibold text-white" style={{ background: preview.palette.accent, borderRadius: preview.radius.pill }}>
                      Bouton principal
                    </span>
                    <span className="px-3.5 py-1.5 text-[11px] font-semibold" style={{ color: preview.palette.ink, border: `1px solid ${preview.palette.muted}66`, borderRadius: preview.radius.pill }}>
                      Secondaire
                    </span>
                  </div>
                </div>
              </div>
              {/* Pastilles de la palette complète */}
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {([["Encre", preview.palette.ink], ["Fond", preview.palette.surface], ["Carte", preview.palette.card], ["Muted", preview.palette.muted]] as const).map(([label, hex]) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="h-6 w-full rounded-lg border border-black/10" style={{ background: hex }} />
                    <span className="font-mono text-[8px] uppercase" style={{ color: preview.palette.muted }}>{label} {hex.replace("#", "")}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={apply}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[rgb(var(--m-accent))] px-5 text-[14px] font-semibold text-[rgb(var(--m-on-accent))] transition hover:opacity-90"
            >
              Utiliser ma charte ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
