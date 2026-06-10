"use client";
// components/foundry/studio/StudioEditor.tsx
// « L'Atelier » — éditeur visuel plug-and-play. Le client voit SON site en vrai
// (canvas central), survole une section pour la sélectionner, et agit via une
// barre flottante sans jargon : Contenu (textes + images à la main), Remplacer
// (comparatif filet rouge), monter/descendre, supprimer. À droite, un panneau
// contextuel (contenu ou palette live). Tout s'enregistre tout seul.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { COMPONENTS } from "@/components/foundry/registry";
import { vibeToSpec } from "@/lib/foundry/charte";
import type { StudioData, StudioSection, StudioVibe, CatalogEntry } from "./types";
import {
  AddPanel,
  ContentPanel,
  PalettePanel,
  ReplaceDrawer,
  Themed,
} from "./panels";
import ReorderOverlay from "./ReorderOverlay";

type RightPanel = { kind: "content"; index: number } | { kind: "palette" } | null;

export default function StudioEditor({ data }: { data: StudioData }) {
  const router = useRouter();
  const [sections, setSections] = useState<StudioSection[]>(data.sections);
  const [vibe, setVibe] = useState<StudioVibe>(data.vibe);
  const [brandPrimary, setBrandPrimary] = useState<string | null>(data.brandPrimary);
  const [balance, setBalance] = useState(data.balance);
  const [owned, setOwned] = useState<Set<string>>(new Set(data.catalog.filter((c) => c.owned).map((c) => c.id)));

  const [selected, setSelected] = useState<number | null>(null);
  const [right, setRight] = useState<RightPanel>(null);
  const [replaceAt, setReplaceAt] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reorderFrom, setReorderFrom] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const catalogById = useMemo(() => {
    const m = new Map<string, CatalogEntry>();
    for (const c of data.catalog) m.set(c.id, { ...c, owned: owned.has(c.id) || c.price === 0 });
    return m;
  }, [data.catalog, owned]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  /** Appel API recette commun ; renvoie le JSON ou null (toast d'erreur). */
  const call = useCallback(
    async (body: Record<string, unknown>): Promise<any | null> => {
      setSaving(true);
      try {
        const res = await fetch("/api/foundry/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId: data.siteId, ...body }),
        });
        const json = await res.json().catch(() => null);
        if (res.status === 402) { flash(`À débloquer pour ${json?.price ?? "?"} ✦.`); return null; }
        if (!res.ok || !json?.ok) { flash(json?.error ?? "Action impossible."); return null; }
        return json;
      } catch {
        flash("Connexion interrompue.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [data.siteId, flash],
  );

  // --- Refs synchrones (pour l'historique) + état mutateurs -------------------
  const secRef = useRef(sections); const vibeRef = useRef(vibe); const brandRef = useRef(brandPrimary);
  const setSecs = (next: StudioSection[]) => { secRef.current = next; setSections(next); };
  const setVibeS = (v: StudioVibe) => { vibeRef.current = v; setVibe(v); };
  const setBrandS = (b: string | null) => { brandRef.current = b; setBrandPrimary(b); };

  // --- Historique (annuler / rétablir) ----------------------------------------
  type Snap = { sections: StudioSection[]; vibe: StudioVibe; brandPrimary: string | null };
  const [hist, setHist] = useState<{ stack: Snap[]; i: number }>({
    stack: [{ sections: data.sections, vibe: data.vibe, brandPrimary: data.brandPrimary }],
    i: 0,
  });
  const canUndo = hist.i > 0;
  const canRedo = hist.i < hist.stack.length - 1;
  /** Enregistre l'état courant (refs) comme nouveau point d'historique. */
  function record() {
    const snap: Snap = { sections: secRef.current, vibe: vibeRef.current, brandPrimary: brandRef.current };
    setHist((h) => ({ stack: [...h.stack.slice(0, h.i + 1), snap], i: h.i + 1 }));
  }
  async function applySnap(s: Snap) {
    setSecs(s.sections); setVibeS(s.vibe); setBrandS(s.brandPrimary);
    setSelected(null); setRight(null);
    const body: Record<string, unknown> = {
      op: "set",
      sections: s.sections.map((x) => ({ component: x.component, content: x.content })),
      accent: s.brandPrimary ?? undefined,
    };
    if (s.vibe.id === "custom") body.charteSpec = vibeToSpec(s.vibe); else body.vibeId = s.vibe.id;
    await call(body);
  }
  function undo() { if (!canUndo) return; const t = hist.stack[hist.i - 1]; setHist((h) => ({ ...h, i: h.i - 1 })); void applySnap(t); }
  function redo() { if (!canRedo) return; const t = hist.stack[hist.i + 1]; setHist((h) => ({ ...h, i: h.i + 1 })); void applySnap(t); }

  // Raccourcis clavier annuler/rétablir (hors champ de saisie).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // --- Contenu (édition manuelle, debounce) -----------------------------------
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function editContent(index: number, content: Record<string, unknown>) {
    setSecs(secRef.current.map((s, i) => (i === index ? { ...s, content } : s)));
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => { void call({ op: "content", index, content }).then((r) => { if (r) record(); }); }, 650);
  }

  // --- Remplacer --------------------------------------------------------------
  // Le serveur reporte le contenu du client et le renvoie : on s'y aligne.
  async function doReplace(index: number, componentId: string) {
    const res = await call({ op: "swap", index, componentId });
    if (!res) return;
    const entry = catalogById.get(componentId);
    const serverContent = res.sections?.[index]?.content as Record<string, unknown> | undefined;
    setSecs(secRef.current.map((s, i) => (i === index ? {
      ...s,
      component: componentId,
      rarity: entry?.rarity ?? s.rarity,
      content: serverContent ?? entry?.sample ?? s.content,
    } : s)));
    record();
    setReplaceAt(null);
    flash("Section remplacée.");
  }

  // --- Ajouter ----------------------------------------------------------------
  async function doAdd(entry: CatalogEntry) {
    const at = Math.max(1, secRef.current.length - 1);
    const res = await call({ op: "add", index: at, componentId: entry.id });
    if (!res) return;
    const serverContent = res.sections?.[at]?.content as Record<string, unknown> | undefined;
    const next = [...secRef.current];
    next.splice(at, 0, { component: entry.id, role: entry.role, roleLabel: entry.roleLabel, rarity: entry.rarity, content: serverContent ?? entry.sample });
    setSecs(next);
    record();
    setAddOpen(false);
    flash("Bloc ajouté.");
  }

  // --- Supprimer --------------------------------------------------------------
  async function doRemove(index: number) {
    const res = await call({ op: "remove", index });
    if (!res) return;
    setSecs(secRef.current.filter((_, i) => i !== index));
    record();
    setSelected(null);
    setRight(null);
    flash("Section retirée.");
  }

  // --- Réordonner -------------------------------------------------------------
  async function move(from: number, to: number) {
    if (to < 0 || to >= secRef.current.length || from === to) return;
    const n = [...secRef.current]; const [m] = n.splice(from, 1); n.splice(to, 0, m);
    setSecs(n);
    setSelected(to);
    const res = await call({ op: "reorder", index: from, to });
    if (res) record();
  }

  // --- Achat ------------------------------------------------------------------
  async function buy(entry: CatalogEntry) {
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "component", itemId: entry.id }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 409) { flash(`Solde insuffisant (${json?.balance ?? 0} ✦).`); return; }
      if (!res.ok || !json?.ok) { flash(json?.error ?? "Achat impossible."); return; }
      setOwned((o) => new Set(o).add(entry.id));
      if (typeof json.balance === "number") setBalance(json.balance);
      flash(`« ${entry.label} » débloqué ✓`);
    } finally {
      setSaving(false);
    }
  }

  // --- Palette ----------------------------------------------------------------
  const paletteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function liveVibe(v: StudioVibe) { setVibeS(v); }
  function persistCharte(spec: any) {
    if (paletteTimer.current) clearTimeout(paletteTimer.current);
    paletteTimer.current = setTimeout(() => { void call({ op: "palette", charteSpec: spec, accent: brandRef.current ?? undefined }).then((r) => { if (r) record(); }); }, 500);
  }
  async function persistPreset(vibeId: string) {
    const preset = data.presets.find((p) => p.id === vibeId);
    if (preset) { setVibeS(preset); setBrandS(null); }
    const res = await call({ op: "palette", vibeId });
    if (res) record();
  }

  // --- Publier ----------------------------------------------------------------
  async function publish() {
    if (data.locked) { router.push("/dashboard?paywall=1"); return; }
    setPublishing(true);
    try {
      const res = await fetch("/api/site/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: data.siteId }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 409) { router.push("/dashboard?paywall=1"); return; }
      if (!res.ok) { flash(json?.error ?? "Publication impossible."); return; }
      if (typeof json.balance === "number") setBalance(json.balance);
      flash("Votre site est en ligne ✓");
      router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  const replaceCandidates = (index: number): CatalogEntry[] => {
    const role = sections[index].role;
    return [...catalogById.values()].filter((c) => c.role === role);
  };
  const addGroups = useMemo(() => {
    const present = new Set(sections.map((s) => s.role));
    const recommended = new Set(["about", "services", "reviews", "stats", "faq", "pricing", "gallery", "process", "cta"]);
    const byRole = new Map<string, CatalogEntry[]>();
    for (const c of catalogById.values()) {
      if (present.has(c.role)) continue; // un seul bloc par type → « Remplacer » sinon
      if (!byRole.has(c.role)) byRole.set(c.role, []);
      byRole.get(c.role)!.push(c);
    }
    return [...byRole.entries()]
      .map(([role, entries]) => ({ role, roleLabel: entries[0].roleLabel, recommended: recommended.has(role), entries }))
      .sort((a, b) => Number(b.recommended) - Number(a.recommended));
  }, [sections, catalogById]);

  const rightSection = right?.kind === "content" ? sections[right.index] : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-100">
      {/* ===== Barre du haut ===== */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="grid h-9 w-9 place-items-center rounded-xl text-neutral-500 hover:bg-neutral-100" aria-label="Retour"><X size={18} /></button>
          <div className="leading-tight">
            <p className="text-[14px] font-bold text-neutral-900">{data.businessName || "Mon site"}</p>
            <p className="text-[11.5px] text-neutral-400">{saving ? "Enregistrement…" : "Tout est enregistré"}</p>
          </div>
          <div className="ml-1 flex items-center gap-0.5 rounded-full border border-neutral-200 p-0.5">
            <button onClick={undo} disabled={!canUndo} className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30" title="Annuler" aria-label="Annuler"><Undo2 size={16} /></button>
            <button onClick={redo} disabled={!canRedo} className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30" title="Rétablir" aria-label="Rétablir"><Redo2 size={16} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setRight((r) => (r?.kind === "palette" ? null : { kind: "palette" })); setSelected(null); }} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${right?.kind === "palette" ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}>
            <Palette size={15} /> Couleurs
          </button>
          <button onClick={() => setAddOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 text-[13px] font-semibold text-neutral-700 transition hover:border-neutral-400"><Plus size={15} /> Ajouter</button>
          {data.slug && data.isLive && (
            <a href={`/a/${data.slug}`} target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 text-[13px] font-semibold text-neutral-700 transition hover:border-neutral-400 sm:inline-flex"><ExternalLink size={14} /> Voir</a>
          )}
          <button onClick={publish} disabled={publishing} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[13px] font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50">
            <Sparkles size={14} /> {publishing ? "Publication…" : data.locked ? "Mettre en ligne" : data.hasUnpublished ? "Publier" : "En ligne"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ===== Canvas central ===== */}
        <div className="flex-1 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="mx-auto my-6 max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
            <Themed vibe={vibe} brandPrimary={brandPrimary}>
              {sections.map((s, i) => {
                const C = COMPONENTS[s.component];
                const isSel = selected === i;
                const canRemove = s.role !== "hero" && s.role !== "footer";
                return (
                  <div
                    key={`${s.component}-${i}`}
                    className="relative"
                    onMouseEnter={() => !addOpen && replaceAt === null && setSelected(i)}
                    onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                    style={{ outline: isSel ? "2px solid var(--c-accent)" : "none", outlineOffset: -2 }}
                  >
                    {C ? <C content={s.content} skin={{}} /> : <div className="p-10 text-center text-sm text-red-500">Composant introuvable : {s.component}</div>}

                    {/* Voile + barre flottante au survol/sélection */}
                    {isSel && (
                      <>
                        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(15,23,42,0.04)" }} />
                        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-neutral-200 bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setReorderFrom(i); setRight(null); }}
                            className="grid h-8 w-8 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"
                            title="Déplacer cette section"
                          >
                            <GripVertical size={15} />
                          </button>
                          <span className="px-1.5 text-[12px] font-bold text-neutral-700">{s.roleLabel}</span>
                          <button onClick={() => setRight({ kind: "content", index: i })} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-100"><Pencil size={13} /> Contenu</button>
                          <button onClick={() => setReplaceAt(i)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-100"><ArrowLeftRight size={13} /> Remplacer</button>
                          <span className="mx-0.5 h-5 w-px bg-neutral-200" />
                          <button onClick={() => move(i, i - 1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 disabled:opacity-30" title="Monter"><ChevronUp size={15} /></button>
                          <button onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 disabled:opacity-30" title="Descendre"><ChevronDown size={15} /></button>
                          {canRemove && <button onClick={() => doRemove(i)} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500" title="Supprimer"><Trash2 size={14} /></button>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </Themed>
          </div>
        </div>

        {/* ===== Panneau droit contextuel ===== */}
        {right && (
          <aside className="flex w-[380px] shrink-0 flex-col border-l border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
              <h2 className="text-[14px] font-bold text-neutral-900">{right.kind === "palette" ? "Couleurs & style" : rightSection?.roleLabel}</h2>
              <button onClick={() => setRight(null)} className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><X size={16} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {right.kind === "palette" ? (
                <PalettePanel vibe={vibe} presets={data.presets} fonts={data.fonts} onLive={liveVibe} onPersistCharte={persistCharte} onPersistPreset={persistPreset} />
              ) : rightSection ? (
                <ContentPanel section={rightSection} siteId={data.siteId} mediaBank={data.mediaBank} onChange={(c) => editContent(right.index, c)} />
              ) : null}
            </div>
          </aside>
        )}
      </div>

      {/* ===== Tiroirs ===== */}
      {replaceAt !== null && sections[replaceAt] && (
        <ReplaceDrawer
          section={sections[replaceAt]}
          index={replaceAt}
          candidates={replaceCandidates(replaceAt)}
          vibe={vibe}
          brandPrimary={brandPrimary}
          onChoose={(id) => doReplace(replaceAt, id)}
          onBuy={buy}
          onClose={() => setReplaceAt(null)}
        />
      )}
      {addOpen && (
        <AddPanel groups={addGroups} vibe={vibe} brandPrimary={brandPrimary} onAdd={doAdd} onBuy={buy} onClose={() => setAddOpen(false)} />
      )}
      {reorderFrom !== null && (
        <ReorderOverlay
          sections={sections}
          vibe={vibe}
          brandPrimary={brandPrimary}
          initialHeld={reorderFrom}
          onMove={(from, to) => void move(from, to)}
          onClose={() => { setReorderFrom(null); setSelected(null); }}
        />
      )}

      {/* ===== Toast ===== */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-xl">{toast}</div>
      )}
      {/* Solde discret */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-neutral-500 shadow-md">{balance} ✦</div>
    </div>
  );
}
