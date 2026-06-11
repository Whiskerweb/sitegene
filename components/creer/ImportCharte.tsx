// components/creer/ImportCharte.tsx
"use client";

// « J'ai déjà une identité visuelle » (étape charte de /creer) : le client
// apporte SA couleur, son ambiance (clair/sombre), sa paire typographique et
// ses coins — on en fait une charte au même format que les 3 propositions IA.
// La sortie passe par repairCharte (pur, partagé serveur) : contrastes WCAG,
// saturation plafonnée, fonts liste blanche — impossible de casser le site.
import { useMemo, useState } from "react";
import { repairCharte, vibeToSpec, type CharteSpec } from "@/lib/foundry/charte";
import type { Vibe } from "@/lib/foundry/types";

export type ImportedCharte = { vibe: Vibe; spec: CharteSpec; reason: string };

type Props = {
  businessName: string;
  onApply: (charte: ImportedCharte) => void;
};

/** Paires typographiques curées (display + body de la liste blanche). */
const FONT_PAIRS: Array<{ label: string; heading: string; body: string }> = [
  { label: "Élégant", heading: "Fraunces", body: "Outfit" },
  { label: "Éditorial", heading: "Playfair Display", body: "Source Sans 3" },
  { label: "Moderne", heading: "Space Grotesk", body: "Figtree" },
  { label: "Affirmé", heading: "Bricolage Grotesque", body: "Manrope" },
  { label: "Sobre", heading: "Archivo", body: "Work Sans" },
  { label: "Littéraire", heading: "Newsreader", body: "DM Sans" },
];

const CORNER_OPTIONS = [
  { id: "sharp" as const, label: "Nets" },
  { id: "soft" as const, label: "Doux" },
  { id: "round" as const, label: "Ronds" },
];

const HEX_RE = /^#?[0-9a-f]{6}$/i;

export default function ImportCharte({ businessName, onApply }: Props) {
  const [accent, setAccent] = useState("#3d5a80");
  const [hexInput, setHexInput] = useState("#3d5a80");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [pairIdx, setPairIdx] = useState(0);
  const [corners, setCorners] = useState<"sharp" | "soft" | "round">("soft");

  function commitHex(raw: string) {
    setHexInput(raw);
    const v = raw.trim().toLowerCase();
    if (HEX_RE.test(v)) setAccent(v.startsWith("#") ? v : `#${v}`);
  }

  // Aperçu live : la même réparation que celle appliquée au moment de générer.
  const preview = useMemo(() => {
    const pair = FONT_PAIRS[pairIdx];
    return repairCharte({
      name: businessName.trim() ? `Charte ${businessName.trim().slice(0, 30)}` : "Votre charte",
      mood: ["personnel", "fidèle", "cohérent"],
      mode,
      accent,
      headingFont: pair.heading,
      bodyFont: pair.body,
      corners,
    });
  }, [businessName, mode, accent, pairIdx, corners]);

  function apply() {
    onApply({
      vibe: preview,
      spec: vibeToSpec(preview),
      reason: "Construite à partir de votre identité visuelle existante.",
    });
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-2xl rounded-3xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-5 text-left shadow-cloud-sm">
      <link rel="stylesheet" href={preview.fontHref} precedence="foundry-fonts" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          {/* Couleur */}
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">
              Votre couleur principale
            </span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => { setAccent(e.target.value); setHexInput(e.target.value); }}
                aria-label="Couleur principale"
                className="h-10 w-12 cursor-pointer rounded-lg border border-[rgb(var(--m-line))] bg-transparent p-1"
              />
              <input
                value={hexInput}
                onChange={(e) => commitHex(e.target.value)}
                placeholder="#3d5a80"
                spellCheck={false}
                className="h-10 w-28 rounded-xl border border-[rgb(var(--m-line))] bg-transparent px-3 font-mono text-[13px] uppercase outline-none transition focus:border-[rgb(var(--m-accent))]"
              />
            </div>
          </div>

          {/* Ambiance */}
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Ambiance</span>
            <div className="mt-2 flex gap-2">
              {([["light", "Claire"], ["dark", "Sombre"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition ${
                    mode === id
                      ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-ink))]"
                      : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Typographies */}
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Caractère typographique</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FONT_PAIRS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPairIdx(i)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                    pairIdx === i
                      ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-ink))]"
                      : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coins */}
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Coins</span>
            <div className="mt-2 flex gap-2">
              {CORNER_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCorners(c.id)}
                  className={`border px-4 py-1.5 text-[13px] font-medium transition ${
                    corners === c.id
                      ? "border-[rgb(var(--m-accent))] bg-[rgb(var(--m-accent))]/10 text-[rgb(var(--m-ink))]"
                      : "border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))]"
                  }`}
                  style={{ borderRadius: c.id === "sharp" ? "8px" : c.id === "soft" ? "14px" : "999px" }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aperçu live (réparé : exactement ce que le site utilisera) */}
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[rgb(var(--m-faint))]">Aperçu</span>
          <div className="mt-2 flex-1 overflow-hidden rounded-2xl border border-black/5" style={{ background: preview.palette.surface }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ background: preview.palette.card }}>
              <span className="text-[11px] font-bold" style={{ color: preview.palette.ink, fontFamily: preview.fonts.heading }}>
                {(businessName.trim() || "Studio").slice(0, 16)}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-semibold text-white" style={{ background: preview.palette.accent, borderRadius: preview.radius.pill }}>
                Contact
              </span>
            </div>
            <div className="px-3 py-4">
              <div className="text-[17px] leading-snug" style={{ color: preview.palette.ink, fontFamily: preview.fonts.heading }}>
                Un site à votre image
              </div>
              <div className="mt-1.5 text-[11px] leading-relaxed" style={{ color: preview.palette.muted, fontFamily: preview.fonts.body }}>
                Vos couleurs, vos lettres — sur chaque section du site.
              </div>
              <div className="mt-3 flex gap-1.5">
                {[preview.palette.ink, preview.palette.surface, preview.palette.card, preview.palette.accent, preview.palette.accent2].map((c, i) => (
                  <span key={i} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={apply}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-[rgb(var(--m-accent))] px-5 text-[14px] font-semibold text-[rgb(var(--m-on-accent))] transition hover:opacity-90"
          >
            Utiliser ma charte ✦
          </button>
        </div>
      </div>
    </div>
  );
}
