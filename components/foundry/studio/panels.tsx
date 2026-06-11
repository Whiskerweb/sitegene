"use client";
// components/foundry/studio/panels.tsx
// Panneaux de L'Atelier (éditeur visuel) : aperçu rendu sur la charte du client,
// sélecteur d'image, panneau de contenu (sans jargon), tiroir de remplacement
// comparatif (filet rouge sur l'actuelle), palette live façon Stitch, ajout de bloc.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Eye,
  ImageIcon,
  Link2,
  Lock,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { COMPONENTS } from "@/components/foundry/registry";
import { vibeToCssVars } from "@/lib/foundry/vibes";
import { vibeToSpec, fontHref, fontCss, allFontsHref } from "@/lib/foundry/charte";
import { adaptContent } from "@/lib/foundry/agenceur";
import { fieldsFor, type FieldType } from "@/lib/foundry/fields";
import type { CatalogEntry, PageTab, StudioSection, StudioVibe } from "./types";

/* ============================== Aperçu thémé ============================== */

export function Themed({
  vibe,
  brandPrimary,
  children,
  style,
}: {
  vibe: StudioVibe;
  brandPrimary: string | null;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  const vars = vibeToCssVars(vibe, brandPrimary ? { primary: brandPrimary } : undefined) as unknown as CSSProperties;
  return (
    <div style={{ ...vars, fontFamily: "var(--font-body)", background: "var(--c-surface)", color: "var(--c-ink)", ...style }}>
      <link rel="stylesheet" href={vibe.fontHref} precedence="foundry-fonts" />
      {children}
    </div>
  );
}

/** Vignette d'un composant rendue sur la charte du client (non interactive). */
export function Preview({
  id,
  content,
  vibe,
  brandPrimary,
  width = 460,
  height = 250,
}: {
  id: string;
  content: Record<string, unknown>;
  vibe: StudioVibe;
  brandPrimary: string | null;
  width?: number;
  height?: number;
}) {
  const C = COMPONENTS[id];
  const scale = width / 1280;
  return (
    <div style={{ width, height, overflow: "hidden", position: "relative", background: "var(--c-surface)" }}>
      {C ? (
        <Themed
          vibe={vibe}
          brandPrimary={brandPrimary}
          style={{ position: "absolute", inset: 0, width: 1280, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
        >
          <C content={content} skin={{}} />
        </Themed>
      ) : null}
    </div>
  );
}

function RarityChip({ rarity }: { rarity: CatalogEntry["rarity"] }) {
  const map = {
    common: { label: "Inclus", cls: "bg-neutral-100 text-neutral-500" },
    rare: { label: "Rare", cls: "bg-violet-50 text-violet-600" },
    epic: { label: "Épique", cls: "bg-amber-50 text-amber-700" },
  } as const;
  const r = map[rarity];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.cls}`}>{r.label}</span>;
}

/* ============================ Sélecteur d'image ============================ */

export function ImagePicker({
  open,
  siteId,
  mediaBank,
  onPick,
  onClose,
}: {
  open: boolean;
  siteId: string;
  mediaBank: string[];
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"bank" | "upload" | "url">("bank");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("siteId", siteId);
      fd.append("file", file);
      const res = await fetch("/api/site/photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "Import impossible.");
      onPick(data.url as string);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
          <div className="flex gap-1">
            {([["bank", "Mes images"], ["upload", "Importer"], ["url", "Lien"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${tab === k ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto p-5">
          {err ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p> : null}
          {tab === "bank" && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {mediaBank.map((src) => (
                <button key={src} onClick={() => onPick(src)} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 hover:border-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                </button>
              ))}
              {mediaBank.length === 0 && <p className="col-span-full py-8 text-center text-sm text-neutral-400">Importez votre première image →</p>}
            </div>
          )}
          {tab === "upload" && (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-14 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void upload(f); }}
            >
              <Upload size={26} className="text-neutral-400" />
              <p className="text-sm text-neutral-500">Glissez une image ici, ou</p>
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Import…" : "Choisir un fichier"}
              </button>
              <p className="text-xs text-neutral-400">JPG, PNG ou WebP — 8 Mo max.</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
            </div>
          )}
          {tab === "url" && (
            <div className="flex flex-col gap-3">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900" />
              <button onClick={() => url.trim() && onPick(url.trim())} className="self-start rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">Utiliser ce lien</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================== Champs ================================= */

const inputCls = "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13.5px] text-neutral-800 outline-none transition focus:border-neutral-900";

function ImageField({ value, siteId, mediaBank, onChange }: { value: string; siteId: string; mediaBank: string[]; onChange: (v: string) => void }) {
  const [pick, setPick] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-neutral-300"><ImageIcon size={18} /></span>
        )}
      </div>
      <button onClick={() => setPick(true)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 hover:border-neutral-900">Changer l'image</button>
      <ImagePicker open={pick} siteId={siteId} mediaBank={mediaBank} onClose={() => setPick(false)} onPick={(u) => { onChange(u); setPick(false); }} />
    </div>
  );
}

function ScalarInput({ type, value, onChange }: { type: FieldType; value: unknown; onChange: (v: unknown) => void }) {
  if (type === "textarea") return <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={3} className={`${inputCls} resize-none leading-relaxed`} />;
  if (type === "number") return <input type="number" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />;
  if (type === "boolean") return (
    <button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition ${value ? "bg-neutral-900" : "bg-neutral-200"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
  return <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}

export function ContentPanel({
  section,
  siteId,
  mediaBank,
  pages = [],
  onChange,
}: {
  section: StudioSection;
  siteId: string;
  mediaBank: string[];
  /** Pages du site — destinations proposées pour les liens du menu. */
  pages?: PageTab[];
  onChange: (content: Record<string, unknown>) => void;
}) {
  const fields = fieldsFor(section.content);
  const patch = (key: string, value: unknown) => onChange({ ...section.content, [key]: value });
  // Les liens du menu (navbar) — et la rangée de liens plate de certains footers —
  // ont leur éditeur dédié : libellé + destination.
  const isNavLinks = (key: string) => (section.role === "navbar" || section.role === "footer") && key === "links";
  // Les colonnes du footer : menus déroulants (titre + liens avec destination).
  const isFooterColumns = (key: string) => section.role === "footer" && key === "columns";
  // Clé du titre de colonne selon le composant ("heading" pour Plumber Pro, sinon "title").
  const footerTitleKey = (() => {
    const cols = section.content.columns;
    if (Array.isArray(cols)) {
      const first = cols.find((c) => c && typeof c === "object") as Record<string, unknown> | undefined;
      if (first && "heading" in first && !("title" in first)) return "heading";
    }
    return "title";
  })();

  const fieldLabel = (key: string, fallback: string) =>
    isNavLinks(key) ? (section.role === "footer" ? "Liens du pied de page" : "Boutons du menu") : isFooterColumns(key) ? "Colonnes & liens" : fallback;

  return (
    <div className="flex flex-col gap-5">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{fieldLabel(f.key, f.label)}</label>

          {isNavLinks(f.key) && Array.isArray(f.value) ? (
            <NavLinksField value={f.value} pages={pages} onChange={(v) => patch(f.key, v)} />
          ) : isFooterColumns(f.key) && Array.isArray(f.value) ? (
            <FooterColumnsField value={f.value} pages={pages} titleKey={footerTitleKey} onChange={(v) => patch(f.key, v)} />
          ) : f.key === "ctaHref" ? (
            <CtaHrefField value={String(f.value ?? "")} pages={pages} onChange={(v) => patch(f.key, v)} />
          ) : (
            <>
          {(f.type === "text" || f.type === "textarea" || f.type === "number" || f.type === "boolean") && (
            <ScalarInput type={f.type} value={f.value} onChange={(v) => patch(f.key, v)} />
          )}

          {f.type === "image" && (
            <ImageField value={String(f.value ?? "")} siteId={siteId} mediaBank={mediaBank} onChange={(v) => patch(f.key, v)} />
          )}

          {f.type === "imageList" && Array.isArray(f.value) && (
            <div className="flex flex-col gap-2">
              {(f.value as string[]).map((src, i) => (
                <ImageField
                  key={i}
                  value={src}
                  siteId={siteId}
                  mediaBank={mediaBank}
                  onChange={(v) => { const next = [...(f.value as string[])]; next[i] = v; patch(f.key, next); }}
                />
              ))}
            </div>
          )}

          {f.type === "stringList" && Array.isArray(f.value) && (
            <div className="flex flex-col gap-1.5">
              {(f.value as string[]).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input value={s} onChange={(e) => { const next = [...(f.value as string[])]; next[i] = e.target.value; patch(f.key, next); }} className={inputCls} />
                  <button onClick={() => patch(f.key, (f.value as string[]).filter((_, j) => j !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => patch(f.key, [...(f.value as string[]), ""])} className="self-start text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-900">+ Ajouter</button>
            </div>
          )}

          {f.type === "objectList" && Array.isArray(f.value) && (
            <div className="flex flex-col gap-2.5">
              {(f.value as Array<Record<string, unknown>>).map((item, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-400">#{i + 1}</span>
                    <button onClick={() => patch(f.key, (f.value as unknown[]).filter((_, j) => j !== i))} className="grid h-7 w-7 place-items-center rounded-lg text-neutral-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(f.itemFields ?? []).map((sub) => (
                      <div key={sub.key} className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-neutral-400">{sub.label}</span>
                        {sub.type === "image" ? (
                          <ImageField value={String(item[sub.key] ?? "")} siteId={siteId} mediaBank={mediaBank} onChange={(v) => { const next = [...(f.value as Array<Record<string, unknown>>)]; next[i] = { ...next[i], [sub.key]: v }; patch(f.key, next); }} />
                        ) : (
                          <ScalarInput type={sub.type} value={item[sub.key]} onChange={(v) => { const next = [...(f.value as Array<Record<string, unknown>>)]; next[i] = { ...next[i], [sub.key]: v }; patch(f.key, next); }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => { const arr = f.value as Array<Record<string, unknown>>; patch(f.key, [...arr, { ...(arr[0] ?? {}) }]); }}
                className="self-start text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-900"
              >
                + Ajouter un élément
              </button>
            </div>
          )}
            </>
          )}
        </div>
      ))}
      {fields.length === 0 && <p className="text-sm text-neutral-400">Cette section n'a pas de contenu modifiable.</p>}
    </div>
  );
}

/* ===================== Boutons du menu (liens de navbar) ===================== */

type NavLinkValue = string | { label?: string; target?: string };

/** Cible normalisée d'un lien stocké (chaîne = pas de destination). */
function navTargetOf(l: NavLinkValue): string {
  return typeof l === "object" && typeof l.target === "string" ? l.target : "";
}
function navLabelOf(l: NavLinkValue): string {
  return typeof l === "string" ? l : (l.label ?? "");
}

/**
 * Une ligne d'édition de lien : libellé + destination (Accueil, une page du
 * site, ou un lien externe). Partagée par le menu (navbar) et les colonnes du
 * footer. Le parent stocke une chaîne simple sans destination, sinon
 * {label, target} — le format que le site publié sait résoudre.
 */
function LinkRow({
  label,
  target,
  pages,
  onChange,
  onRemove,
}: {
  label: string;
  target: string;
  pages: PageTab[];
  onChange: (label: string, target: string) => void;
  onRemove: () => void;
}) {
  const isExternal = (t: string) => /^https?:\/\//.test(t);
  // Valeur du sélecteur : "" (aucune), "home", slug de page, "__ext" (externe).
  const selectValue = isExternal(target) ? "__ext" : target;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
      <div className="flex items-center gap-1.5">
        <input
          value={label}
          onChange={(e) => onChange(e.target.value, target)}
          placeholder="Libellé"
          className={inputCls}
        />
        <button
          onClick={onRemove}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-300 hover:bg-red-50 hover:text-red-500"
          title="Retirer ce lien"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Link2 size={13} className="shrink-0 text-neutral-300" />
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange(label, v === "__ext" ? "https://" : v);
          }}
          className="h-8 w-full rounded-lg border border-neutral-200 bg-white px-2 text-[12.5px] text-neutral-700 outline-none focus:border-neutral-900"
        >
          <option value="">Sans lien</option>
          <option value="home">Accueil</option>
          {pages.map((p) => (
            <option key={p.id} value={p.slug}>Page « {p.title} »</option>
          ))}
          <option value="__ext">Lien externe…</option>
        </select>
      </div>
      {isExternal(target) && (
        <input
          value={target}
          onChange={(e) => onChange(label, e.target.value)}
          placeholder="https://…"
          className={`${inputCls} mt-1.5`}
        />
      )}
    </div>
  );
}

/** Réécrit l'entrée i d'une liste de liens (chaîne si pas de cible, sinon objet). */
function writeLink(links: NavLinkValue[], i: number, label: string, target: string): NavLinkValue[] {
  const next = [...links];
  next[i] = target ? { label, target } : label;
  return next;
}

/**
 * Destination d'un bouton CTA (heros) : section contact de la page, accueil,
 * une page du site, ou un lien externe. Le LIBELLÉ du bouton reste le champ
 * « Bouton » (cta) — ici on ne configure QUE la cible.
 */
function CtaHrefField({
  value,
  pages,
  onChange,
}: {
  value: string;
  pages: PageTab[];
  onChange: (v: string) => void;
}) {
  const isExternal = /^https?:\/\//.test(value);
  // "" → section contact (#…) ; "home"/slug → page ; "__ext" → externe.
  const selectValue = isExternal ? "__ext" : !value || value.startsWith("#") ? "" : value;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
      <div className="flex items-center gap-1.5">
        <Link2 size={13} className="shrink-0 text-neutral-300" />
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "#contact" : v === "__ext" ? "https://" : v);
          }}
          className="h-8 w-full rounded-lg border border-neutral-200 bg-white px-2 text-[12.5px] text-neutral-700 outline-none focus:border-neutral-900"
        >
          <option value="">Section contact (bas de page)</option>
          <option value="home">Accueil</option>
          {pages.map((p) => (
            <option key={p.id} value={p.slug}>Page « {p.title} »</option>
          ))}
          <option value="__ext">Lien externe…</option>
        </select>
      </div>
      {isExternal && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={`${inputCls} mt-1.5`}
        />
      )}
    </div>
  );
}

/**
 * Éditeur des boutons du menu : une ligne par lien (libellé + destination).
 */
function NavLinksField({
  value,
  pages,
  onChange,
}: {
  value: unknown[];
  pages: PageTab[];
  onChange: (v: unknown[]) => void;
}) {
  const links = value as NavLinkValue[];
  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => (
        <LinkRow
          key={i}
          label={navLabelOf(l)}
          target={navTargetOf(l)}
          pages={pages}
          onChange={(label, target) => onChange(writeLink(links, i, label, target))}
          onRemove={() => onChange(links.filter((_, j) => j !== i))}
        />
      ))}
      <button
        onClick={() => onChange([...links, "Nouveau"])}
        className="self-start text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-900"
      >
        + Ajouter un bouton
      </button>
    </div>
  );
}

/* ===================== Colonnes du footer (menus + liens) ===================== */

type FooterColumnValue = Record<string, unknown> & { links?: NavLinkValue[] };

/**
 * Éditeur des colonnes du footer : chaque colonne est un menu déroulant
 * (titre + ses liens). Chaque lien a un libellé et une destination, et se
 * supprime individuellement ; on ajoute / supprime aussi des colonnes entières.
 * `titleKey` = clé du titre selon le composant ("title" ou "heading").
 */
function FooterColumnsField({
  value,
  pages,
  titleKey,
  onChange,
}: {
  value: unknown[];
  pages: PageTab[];
  titleKey: string;
  onChange: (v: unknown[]) => void;
}) {
  const columns = value as FooterColumnValue[];
  const [open, setOpen] = useState<number | null>(0);

  const patchCol = (i: number, col: FooterColumnValue) => {
    const next = [...columns];
    next[i] = col;
    onChange(next);
  };
  const setLinks = (i: number, links: NavLinkValue[]) => patchCol(i, { ...columns[i], links });
  const titleOf = (col: FooterColumnValue) => (typeof col[titleKey] === "string" ? (col[titleKey] as string) : "");

  return (
    <div className="flex flex-col gap-2">
      {columns.map((col, i) => {
        const links = Array.isArray(col.links) ? (col.links as NavLinkValue[]) : [];
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/60">
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(isOpen ? null : i)} className="flex flex-1 items-center gap-2 px-3 py-2.5 text-left">
                <ChevronDown size={15} className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <span className="truncate text-[13px] font-semibold text-neutral-800">{titleOf(col).trim() || `Colonne ${i + 1}`}</span>
                <span className="shrink-0 text-[11px] text-neutral-400">· {links.length} lien{links.length > 1 ? "s" : ""}</span>
              </button>
              <button
                onClick={() => onChange(columns.filter((_, j) => j !== i))}
                className="mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neutral-300 hover:bg-red-50 hover:text-red-500"
                title="Supprimer cette colonne"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-neutral-200 p-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-400">Titre de la colonne</span>
                  <input
                    value={titleOf(col)}
                    onChange={(e) => patchCol(i, { ...col, [titleKey]: e.target.value })}
                    placeholder="Ex. Liens, Écouter…"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-neutral-400">Liens</span>
                  {links.map((l, j) => (
                    <LinkRow
                      key={j}
                      label={navLabelOf(l)}
                      target={navTargetOf(l)}
                      pages={pages}
                      onChange={(label, target) => setLinks(i, writeLink(links, j, label, target))}
                      onRemove={() => setLinks(i, links.filter((_, k) => k !== j))}
                    />
                  ))}
                  <button
                    onClick={() => setLinks(i, [...links, "Nouveau lien"])}
                    className="self-start text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-900"
                  >
                    + Ajouter un lien
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={() => { onChange([...columns, { [titleKey]: "Nouvelle colonne", links: [] }]); setOpen(columns.length); }}
        className="self-start text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-900"
      >
        + Ajouter une colonne
      </button>
    </div>
  );
}

/* ===================== Tiroir « Remplacer » (comparatif) ===================== */

export function ReplaceDrawer({
  section,
  allSections,
  index,
  candidates,
  vibe,
  brandPrimary,
  onChoose,
  onBuy,
  onClose,
}: {
  section: StudioSection;
  /** Toutes les sections de la page — pour l'essai « sur votre site ». */
  allSections: StudioSection[];
  index: number;
  candidates: CatalogEntry[];
  vibe: StudioVibe;
  brandPrimary: string | null;
  onChoose: (id: string) => void;
  onBuy: (entry: CatalogEntry) => Promise<boolean>;
  onClose: () => void;
}) {
  const others = candidates.filter((c) => c.id !== section.component);
  const [tryOn, setTryOn] = useState<CatalogEntry | null>(null);
  if (tryOn) {
    return (
      <TryOnOverlay
        candidate={tryOn}
        sections={allSections}
        index={index}
        vibe={vibe}
        brandPrimary={brandPrimary}
        onBack={() => setTryOn(null)}
        onBuy={onBuy}
        onConfirm={() => onChoose(tryOn.id)}
      />
    );
  }
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-neutral-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-neutral-900">Remplacer « {section.roleLabel} »</h2>
            <p className="text-[12.5px] text-neutral-500">Choisissez une autre forme — vos textes et images suivront quand c'est possible.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Section actuelle, barrée d'un filet rouge */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-red-500">Sera remplacée</p>
          <div className="relative mb-7 overflow-hidden rounded-2xl border-2 border-red-300">
            <Preview id={section.component} content={section.content} vibe={vibe} brandPrimary={brandPrimary} width={600} height={230} />
            <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(239,68,68,0.14)" }} />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(239,68,68,0.55)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">Actuelle</span>
          </div>

          {/* Remplaçantes */}
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Remplacer par</p>
          <div className="grid grid-cols-1 gap-4">
            {others.map((c) => {
              const locked = !c.owned && c.price > 0;
              // Aperçu ADAPTÉ : titre/texte/images de la section en place reportés
              // sur la charte du client — pleinement visible, même avant l'achat.
              const previewContent = adaptContent(c.id, section.content);
              return (
                <div key={c.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <div className="relative border-b border-neutral-100">
                    <Preview id={c.id} content={previewContent} vibe={vibe} brandPrimary={brandPrimary} width={600} height={230} />
                    {locked && <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow"><Lock size={12} /> {c.price} ✦ pour l'utiliser</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-neutral-800">{c.label}</span>
                      <RarityChip rarity={c.rarity} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTryOn(c)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-[12.5px] font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                      >
                        <Eye size={13} /> Aperçu
                      </button>
                      {locked ? (
                        <button onClick={() => void onBuy(c)} className="rounded-full bg-amber-500 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-amber-600">Débloquer · {c.price} ✦</button>
                      ) : (
                        <button onClick={() => onChoose(c.id)} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-neutral-700"><ArrowLeftRight size={13} /> Choisir</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {others.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Pas encore d'autre forme pour ce type de section.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Essai « sur votre site » (try-on) ===================== */

/**
 * Aperçu plein écran du site COMPLET avec la candidate posée à la place de la
 * section remplacée (contenu du client reporté). Le client juge en contexte,
 * puis revient en arrière ou valide — l'achat est chaîné si la pièce est
 * verrouillée (rien n'est payé avant la validation).
 */
function TryOnOverlay({
  candidate,
  sections,
  index,
  vibe,
  brandPrimary,
  onBack,
  onBuy,
  onConfirm,
}: {
  candidate: CatalogEntry;
  sections: StudioSection[];
  index: number;
  vibe: StudioVibe;
  brandPrimary: string | null;
  onBack: () => void;
  onBuy: (entry: CatalogEntry) => Promise<boolean>;
  onConfirm: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const locked = !candidate.owned && candidate.price > 0;

  useEffect(() => {
    const t = setTimeout(() => targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  async function confirm() {
    if (locked) {
      setPaying(true);
      const ok = await onBuy(candidate);
      setPaying(false);
      if (!ok) return; // solde insuffisant / erreur : on reste sur l'essai
    }
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-neutral-100">
      {/* Bandeau d'essai */}
      <div className="flex h-12 shrink-0 items-center justify-center gap-2 border-b border-neutral-200 bg-white/95 px-4 text-[13px] backdrop-blur">
        <Eye size={14} className="text-neutral-400" />
        <span className="font-semibold text-neutral-800">Essai sur votre site</span>
        <span className="text-neutral-400">— « {candidate.label} » à la place de votre section. Rien n'est encore changé.</span>
      </div>

      {/* Le site entier, candidate en place */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto my-6 max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <Themed vibe={vibe} brandPrimary={brandPrimary}>
            {sections.map((s, i) => {
              const isSwap = i === index;
              const id = isSwap ? candidate.id : s.component;
              const content = isSwap ? adaptContent(candidate.id, s.content) : s.content;
              const C = COMPONENTS[id];
              if (!C) return null;
              return (
                <div key={`${id}-${i}`} ref={isSwap ? targetRef : undefined} className="relative">
                  <C content={content} skin={{}} />
                  {isSwap && (
                    <>
                      <div className="pointer-events-none absolute inset-0" style={{ outline: "3px solid var(--c-accent)", outlineOffset: -3 }} />
                      <span className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11.5px] font-bold text-white shadow-lg" style={{ background: "var(--c-accent)" }}>
                        Nouvelle section
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </Themed>
        </div>
        <div className="h-24" />
      </div>

      {/* Barre de décision */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 p-2 pl-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur">
          <span className="hidden items-center gap-2 pr-2 sm:flex">
            <span className="text-[13px] font-semibold text-neutral-800">{candidate.label}</span>
            <RarityChip rarity={candidate.rarity} />
          </span>
          <button
            onClick={onBack}
            disabled={paying}
            className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-neutral-500 transition hover:text-neutral-900 disabled:opacity-50"
          >
            ← Revenir
          </button>
          <button
            onClick={() => void confirm()}
            disabled={paying}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-60 ${locked ? "bg-amber-500 hover:bg-amber-600" : "bg-neutral-900 hover:bg-neutral-700"}`}
          >
            {paying ? (
              "Déblocage…"
            ) : locked ? (
              <><Lock size={13} /> Valider et débloquer · {candidate.price} ✦</>
            ) : (
              <><Check size={14} /> Valider ce remplacement</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================== Sélecteur de typo (façon Canva) ====================== */

/**
 * Chaque police est montrée DANS sa propre fonte : grand spécimen « Ag » +
 * nom rendu dans la typo — on choisit à l'œil, pas sur un nom. Les fontes de
 * la liste ne sont chargées (Google Fonts) que quand le sélecteur est ouvert.
 */
function FontPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (family: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left transition hover:border-neutral-400"
      >
        <span className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
        <span className="min-w-0 flex-1 truncate text-[16px] leading-none text-neutral-900" style={{ fontFamily: fontCss(value) }}>
          {value}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Toutes les fontes de la liste, pour rendre chaque option dans sa typo. */}
          <link rel="stylesheet" href={allFontsHref()} precedence="foundry-fonts" />
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1.5 shadow-2xl">
            {options.map((f) => {
              const active = f === value;
              return (
                <button
                  key={f}
                  onClick={() => { onChange(f); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition hover:bg-neutral-50 ${active ? "bg-neutral-50" : ""}`}
                >
                  <span className="w-10 shrink-0 text-[22px] leading-none text-neutral-900" style={{ fontFamily: fontCss(f) }}>Ag</span>
                  <span className="min-w-0 flex-1 truncate text-[14.5px] text-neutral-700" style={{ fontFamily: fontCss(f) }}>{f}</span>
                  {active && <Check size={15} className="shrink-0 text-neutral-900" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================== Palette live (Stitch) =========================== */

const RADIUS_PRESETS: Record<string, { card: string; xl: string }> = {
  Net: { card: "6px", xl: "12px" },
  Doux: { card: "16px", xl: "24px" },
  Rond: { card: "24px", xl: "32px" },
};
const COLOR_FIELDS: Array<{ key: keyof StudioVibe["palette"]; label: string; hint: string }> = [
  { key: "accent", label: "Accent", hint: "Boutons, liens" },
  { key: "ink", label: "Texte", hint: "Titres & paragraphes" },
  { key: "surface", label: "Fond", hint: "Arrière-plan des pages" },
  { key: "card", label: "Cartes", hint: "Encarts, blocs" },
  { key: "accent2", label: "Accent 2", hint: "Touches secondaires" },
  { key: "muted", label: "Texte doux", hint: "Légendes" },
];

// Nuancier curé — teintes harmonieuses (jamais de néon), 9 familles × 7 nuances.
const SWATCHES: string[][] = [
  ["#1c1917", "#44403c", "#78716c", "#a8a29e", "#d6d3d1", "#e7e5e4", "#faf9f7"], // pierre
  ["#3a2418", "#6b4423", "#8d6959", "#a78a7a", "#c9b3a6", "#e1937d", "#f6e7df"], // terre / clay
  ["#1a2e05", "#3f6212", "#5a7d52", "#84a98c", "#a7c4a0", "#cad2c5", "#eef2e7"], // sauge
  ["#0c1626", "#1d4ed8", "#2456e6", "#3b82f6", "#6ea8fe", "#bfdbfe", "#eff6ff"], // océan
  ["#082f2a", "#0f766e", "#14b8a6", "#5eead4", "#99f6e4", "#ccfbf1", "#f0fdfa"], // émeraude
  ["#3b0a18", "#9d174d", "#b03a64", "#db2777", "#f472b6", "#fbcfe8", "#fdf2f8"], // framboise
  ["#2e1065", "#5b21b6", "#7c3aed", "#9d4edd", "#c4b5fd", "#ddd6fe", "#f5f3ff"], // améthyste
  ["#431407", "#9a3412", "#c2410c", "#e8543f", "#fb923c", "#fed7aa", "#fff7ed"], // corail
  ["#422006", "#854d0e", "#b07d2e", "#d8a23a", "#facc15", "#fde68a", "#fefce8"], // ambre
];
const FLAT_SWATCHES = SWATCHES.flat();

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Sélecteur de couleur moderne : nuancier curé + saisie hex + réglage fin. */
function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const commitHex = (v: string) => {
    setHex(v);
    if (HEX6.test(v.trim())) onChange(v.trim().toLowerCase());
  };
  const current = value.toLowerCase();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2 text-left transition ${open ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}
      >
        <span className="h-8 w-8 shrink-0 rounded-lg border border-black/10 shadow-inner" style={{ background: value }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-neutral-800">{label}</span>
          <span className="block truncate text-[10.5px] text-neutral-400">{hint}</span>
        </span>
        <span className="font-mono text-[10px] uppercase text-neutral-400">{value.replace("#", "")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[71]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[72] rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl">
            <div className="grid grid-cols-7 gap-1.5">
              {FLAT_SWATCHES.map((c) => {
                const sel = c.toLowerCase() === current;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onChange(c); setHex(c); setOpen(false); }}
                    title={c}
                    className={`relative h-6 w-full rounded-md border transition hover:scale-110 ${sel ? "ring-2 ring-neutral-900 ring-offset-1" : "border-black/10"}`}
                    style={{ background: c }}
                  >
                    {sel && <Check size={11} className="absolute inset-0 m-auto" style={{ color: tone(c) }} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
              <label className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-neutral-200" style={{ background: value }} title="Réglage fin">
                <input type="color" value={HEX6.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <span className="font-mono text-[13px] text-neutral-400">#</span>
              <input
                value={hex.replace("#", "")}
                onChange={(e) => commitHex("#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
                placeholder="8d6959"
                className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-[12px] uppercase text-neutral-700 outline-none focus:border-neutral-900"
              />
              <span className="ml-auto text-[11px] text-neutral-400">Réglage fin →</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Couleur de coche lisible sur un fond donné (noir/blanc selon luminance). */
function tone(hex: string): string {
  if (!HEX6.test(hex)) return "#fff";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? "#111" : "#fff";
}

export function PalettePanel({
  vibe,
  presets,
  fonts,
  onLive,
  onPersistCharte,
  onPersistPreset,
}: {
  vibe: StudioVibe;
  presets: StudioVibe[];
  fonts: { heading: string[]; body: string[] };
  onLive: (v: StudioVibe) => void;
  onPersistCharte: (spec: ReturnType<typeof vibeToSpec>) => void;
  onPersistPreset: (vibeId: string) => void;
}) {
  const headingFamily = vibe.fonts.heading.split(",")[0].replace(/['"]/g, "").trim();
  const bodyFamily = vibe.fonts.body.split(",")[0].replace(/['"]/g, "").trim();

  // Toute édition manuelle → charte « custom » (live + persistée, re-réparée serveur).
  function edit(next: StudioVibe) {
    const custom = { ...next, id: "custom" as const };
    onLive(custom);
    onPersistCharte(vibeToSpec(custom));
  }
  const setColor = (key: keyof StudioVibe["palette"], val: string) => edit({ ...vibe, palette: { ...vibe.palette, [key]: val } });
  const setFont = (which: "heading" | "body", family: string) =>
    edit({ ...vibe, fonts: { ...vibe.fonts, [which]: family }, fontHref: which === "heading" ? fontHref(family, bodyFamily) : fontHref(headingFamily, family) });
  const setRadius = (name: keyof typeof RADIUS_PRESETS) => edit({ ...vibe, radius: { ...vibe.radius, ...RADIUS_PRESETS[name] } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Ambiances</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = vibe.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPersistPreset(p.id)}
                title={p.label}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition ${active ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}
              >
                <span className="flex">
                  {[p.palette.accent, p.palette.accent2, p.palette.ink].map((c, i) => (
                    <span key={i} className="h-3.5 w-3.5 rounded-full border border-white" style={{ background: c, marginLeft: i ? -5 : 0 }} />
                  ))}
                </span>
                <span className="text-[12px] font-semibold text-neutral-700">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Couleurs</p>
        <div className="flex flex-col gap-2">
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <ColorField key={key} label={label} hint={hint} value={vibe.palette[key]!} onChange={(v) => setColor(key, v)} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Typographies</p>
        <div className="flex flex-col gap-2">
          <FontPicker label="Titres" value={headingFamily} options={fonts.heading} onChange={(f) => setFont("heading", f)} />
          <FontPicker label="Texte" value={bodyFamily} options={fonts.body} onChange={(f) => setFont("body", f)} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Coins</p>
        <div className="flex gap-2">
          {(Object.keys(RADIUS_PRESETS) as Array<keyof typeof RADIUS_PRESETS>).map((name) => {
            const active = vibe.radius.card === RADIUS_PRESETS[name].card;
            return (
              <button key={name} onClick={() => setRadius(name)} className={`flex-1 rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition ${active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>{name}</button>
            );
          })}
        </div>
      </div>
      <p className="text-[11.5px] leading-relaxed text-neutral-400">Vos couleurs s'appliquent à tout le site en direct. Les contrastes illisibles sont corrigés automatiquement.</p>
    </div>
  );
}

/* ============================ Ajouter un bloc ============================ */

export function AddPanel({
  groups,
  vibe,
  brandPrimary,
  onAdd,
  onBuy,
  onClose,
}: {
  groups: Array<{ role: string; roleLabel: string; recommended: boolean; entries: CatalogEntry[] }>;
  vibe: StudioVibe;
  brandPrimary: string | null;
  onAdd: (entry: CatalogEntry) => void;
  onBuy: (entry: CatalogEntry) => void;
  onClose: () => void;
}) {
  const [openRole, setOpenRole] = useState<string | null>(groups.find((g) => g.recommended)?.role ?? groups[0]?.role ?? null);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-neutral-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-neutral-900">Ajouter un bloc</h2>
            <p className="text-[12.5px] text-neutral-500">Choisissez une section à ajouter à votre site.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {groups.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Votre site contient déjà tous les types de blocs.</p>}
          <div className="flex flex-col gap-2.5">
            {groups.map((g) => {
              const open = openRole === g.role;
              return (
                <div key={g.role} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <button onClick={() => setOpenRole(open ? null : g.role)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-neutral-800">{g.roleLabel}</span>
                      {g.recommended && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">Recommandé</span>}
                    </span>
                    <span className="text-[12px] text-neutral-400">{g.entries.length} forme{g.entries.length > 1 ? "s" : ""}</span>
                  </button>
                  {open && (
                    <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 p-3">
                      {g.entries.map((c) => {
                        const locked = !c.owned && c.price > 0;
                        return (
                          <div key={c.id} className="overflow-hidden rounded-xl border border-neutral-200">
                            <div className="relative border-b border-neutral-100">
                              <Preview id={c.id} content={c.sample} vibe={vibe} brandPrimary={brandPrimary} width={600} height={210} />
                              {locked && <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow"><Lock size={12} /> {c.price} ✦</span>}
                            </div>
                            <div className="flex items-center justify-between gap-2 p-2.5">
                              <RarityChip rarity={c.rarity} />
                              {locked ? (
                                <button onClick={() => onBuy(c)} className="rounded-full bg-amber-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-amber-600">Débloquer · {c.price} ✦</button>
                              ) : (
                                <button onClick={() => onAdd(c)} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-neutral-700"><Plus size={13} /> Ajouter</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { RarityChip };
