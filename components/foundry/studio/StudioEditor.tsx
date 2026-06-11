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
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  Monitor,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { COMPONENTS } from "@/components/foundry/registry";
import { vibeToSpec } from "@/lib/foundry/charte";
import { heroTreatmentOf } from "@/lib/foundry/treatment";
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

/** Étapes affichées pendant la composition d'une page (cosmétique, rythme l'attente). */
const GEN_STEPS = [
  "Je lis votre demande",
  "Je parcours le catalogue de blocs",
  "Je choisis la structure de la page",
  "J'écris vos textes",
  "J'accorde tout à votre charte",
];

/** Idées de pages : un clic remplit la demande, le client peut la retoucher. */
const PAGE_IDEAS = [
  { label: "Tarifs", ask: "Une page tarifs qui présente mes formules et leurs prix, avec les questions fréquentes sur le paiement." },
  { label: "Nos services", ask: "Une page qui détaille toutes mes prestations, comment je travaille, et un appel à demander un devis." },
  { label: "À propos", ask: "Une page à propos qui raconte mon parcours, mes valeurs et pourquoi me faire confiance." },
  { label: "Contact", ask: "Une page contact avec mes coordonnées, mes horaires et comment me joindre rapidement." },
  { label: "Réalisations", ask: "Une page qui montre mes dernières réalisations et ce que mes clients en disent." },
  { label: "FAQ", ask: "Une page qui répond aux questions que mes clients me posent le plus souvent." },
];

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
  const [createOpen, setCreateOpen] = useState(false);
  const [pageAsk, setPageAsk] = useState("");
  const [creating, setCreating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // Aperçu responsive : null = on édite (vue ordinateur), sinon taille d'appareil.
  const [preview, setPreview] = useState<"mobile" | "tablet" | null>(null);

  const catalogById = useMemo(() => {
    const m = new Map<string, CatalogEntry>();
    for (const c of data.catalog) m.set(c.id, { ...c, owned: owned.has(c.id) || c.price === 0 });
    return m;
  }, [data.catalog, owned]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  /** Appel API recette commun ; renvoie le JSON ou null (toast d'erreur).
   *  pageId est joint d'office : les ops de sections visent la page courante. */
  const call = useCallback(
    async (body: Record<string, unknown>): Promise<any | null> => {
      setSaving(true);
      try {
        const res = await fetch("/api/foundry/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId: data.siteId, pageId: data.pageId ?? undefined, ...body }),
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
    [data.siteId, data.pageId, flash],
  );

  // --- Refs synchrones (pour l'historique) + état mutateurs -------------------
  const secRef = useRef(sections); const vibeRef = useRef(vibe); const brandRef = useRef(brandPrimary);
  const setSecs = (next: StudioSection[]) => { secRef.current = next; setSections(next); };
  const setVibeS = (v: StudioVibe) => { vibeRef.current = v; setVibe(v); };
  const setBrandS = (b: string | null) => { brandRef.current = b; setBrandPrimary(b); };

  /** Reconstruit des StudioSection depuis les sections renvoyées par le serveur
   *  (source de vérité pour l'ORDRE — navbar épinglée en tête, footer en queue). */
  const toStudioSections = useCallback(
    (server: Array<{ component: string; content: Record<string, unknown> }>): StudioSection[] =>
      server.map((s) => {
        const e = catalogById.get(s.component);
        return { component: s.component, role: e?.role ?? "section", roleLabel: e?.roleLabel ?? "Section", rarity: e?.rarity ?? "common", content: s.content };
      }),
    [catalogById],
  );

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
  // Le serveur reporte le contenu du client : on adopte ce qu'il renvoie.
  async function doReplace(index: number, componentId: string) {
    const res = await call({ op: "swap", index, componentId });
    if (!res) return;
    if (res.sections) setSecs(toStudioSections(res.sections));
    record();
    setReplaceAt(null);
    flash("Section remplacée.");
  }

  // --- Ajouter ----------------------------------------------------------------
  async function doAdd(entry: CatalogEntry) {
    // Position indicative : une navbar se posera en tête (épinglage serveur).
    const at = entry.role === "navbar" ? 0 : Math.max(1, secRef.current.length - 1);
    const res = await call({ op: "add", index: at, componentId: entry.id });
    if (!res) return;
    if (res.sections) setSecs(toStudioSections(res.sections));
    record();
    setAddOpen(false);
    flash(entry.role === "navbar" ? "Barre de navigation ajoutée en haut." : "Bloc ajouté.");
  }

  // --- Supprimer --------------------------------------------------------------
  async function doRemove(index: number) {
    const res = await call({ op: "remove", index });
    if (!res) return;
    if (res.sections) setSecs(toStudioSections(res.sections));
    record();
    setSelected(null);
    setRight(null);
    flash("Section retirée.");
  }

  // --- Réordonner -------------------------------------------------------------
  async function move(from: number, to: number) {
    if (to < 0 || to >= secRef.current.length || from === to) return;
    const res = await call({ op: "reorder", index: from, to });
    if (!res) return;
    if (res.sections) setSecs(toStudioSections(res.sections));
    setSelected(null);
    record();
  }

  // --- Achat (renvoie true si le composant est débloqué) -----------------------
  async function buy(entry: CatalogEntry): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "component", itemId: entry.id }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 409) { flash(`Solde insuffisant (${json?.balance ?? 0} ✦).`); return false; }
      if (!res.ok || !json?.ok) { flash(json?.error ?? "Achat impossible."); return false; }
      setOwned((o) => new Set(o).add(entry.id));
      if (typeof json.balance === "number") setBalance(json.balance);
      flash(`« ${entry.label} » débloqué ✓`);
      return true;
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

  // --- Pages ------------------------------------------------------------------
  function goToPage(id: string | null) {
    router.push(id ? `/atelier?page=${id}` : "/atelier");
  }
  // Toast laissé par l'instance précédente (l'éditeur remonte à chaque changement de page).
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem("atelier:flash");
      if (msg) { sessionStorage.removeItem("atelier:flash"); flash(msg); }
    } catch { /* stockage indisponible : pas de toast, rien de cassé */ }
  }, [flash]);
  // Fait avancer les étapes affichées pendant la composition.
  useEffect(() => {
    if (!creating) { setGenStep(0); return; }
    const t = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 4200);
    return () => clearInterval(t);
  }, [creating]);
  async function createPage() {
    if (pageAsk.trim().length < 8 || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/foundry/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: data.siteId, op: "create", request: pageAsk.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) { setCreating(false); flash(json?.error ?? "Création impossible. Réessayez."); return; }
      try {
        const extra = json.navbarAdded ? " — une barre de navigation a été ajoutée en haut de votre site" : "";
        sessionStorage.setItem("atelier:flash", `Votre page « ${json.page.title} » est prête ✨${extra}`);
      } catch { /* ignore */ }
      // On garde l'écran de composition affiché : la navigation remonte l'éditeur.
      router.push(`/atelier?page=${json.page.id}`);
    } catch {
      setCreating(false);
      flash("Connexion interrompue. Réessayez.");
    }
  }
  async function renamePage(id: string, title: string) {
    const t = title.trim();
    setRenaming(null);
    if (t.length < 2 || t === data.pages.find((p) => p.id === id)?.title) return;
    const res = await fetch("/api/foundry/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: data.siteId, op: "rename", pageId: id, title: t }),
    });
    if (res.ok) router.refresh();
    else flash("Renommage impossible.");
  }
  async function deletePage(id: string) {
    setConfirmDelete(null);
    const res = await fetch("/api/foundry/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: data.siteId, op: "delete", pageId: id }),
    });
    if (res.ok) { if (data.pageId === id) router.push("/atelier"); else router.refresh(); }
    else flash("Suppression impossible.");
  }
  // La demande de confirmation de suppression expire toute seule.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 3500);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const replaceCandidates = (index: number): CatalogEntry[] => {
    const role = sections[index].role;
    return [...catalogById.values()].filter((c) => c.role === role);
  };
  const onPage = !!data.pageId;
  const addGroups = useMemo(() => {
    const present = new Set(sections.map((s) => s.role));
    const recommended = new Set(["about", "services", "reviews", "stats", "highlights", "faq", "pricing", "gallery", "process", "cta", "media", "team", "story", "statement", "decor"]);
    const byRole = new Map<string, CatalogEntry[]>();
    for (const c of catalogById.values()) {
      if (present.has(c.role)) continue; // un seul bloc par type → « Remplacer » sinon
      // En-tête, pied de page et hero appartiennent à l'Accueil.
      if (onPage && (c.role === "navbar" || c.role === "footer" || c.role === "hero")) continue;
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
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
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
        {/* Aperçu responsive — centré : ordinateur = le canvas, tablette/mobile = iframe fidèle. */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-neutral-200 p-0.5 md:flex">
          <button
            onClick={() => setPreview(null)}
            title="Vue ordinateur (édition)"
            className={`grid h-8 w-8 place-items-center rounded-full transition ${preview === null ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"}`}
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setPreview("tablet")}
            title="Aperçu sur tablette"
            className={`grid h-8 w-8 place-items-center rounded-full transition ${preview === "tablet" ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"}`}
          >
            <Tablet size={15} />
          </button>
          <button
            onClick={() => setPreview("mobile")}
            title="Aperçu sur mobile"
            className={`grid h-8 w-8 place-items-center rounded-full transition ${preview === "mobile" ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"}`}
          >
            <Smartphone size={15} />
          </button>
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

      {/* ===== Onglets de pages ===== */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white/70 px-4 py-1.5">
        <PageTabBtn active={!data.pageId} onClick={() => goToPage(null)}>Accueil</PageTabBtn>
        {data.pages.map((p) => (
          <span key={p.id} className="group relative inline-flex items-center">
            {renaming?.id === p.id ? (
              <input
                autoFocus
                value={renaming.value}
                onChange={(e) => setRenaming({ id: p.id, value: e.target.value })}
                onBlur={() => void renamePage(p.id, renaming.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void renamePage(p.id, renaming.value);
                  if (e.key === "Escape") setRenaming(null);
                }}
                maxLength={40}
                className="w-36 rounded-full border border-neutral-300 px-3 py-1 text-[13px] font-semibold text-neutral-900 outline-none focus:border-neutral-900"
              />
            ) : (
              <PageTabBtn
                active={data.pageId === p.id}
                onClick={() => goToPage(p.id)}
                onDoubleClick={() => setRenaming({ id: p.id, value: p.title })}
              >
                {p.title}
              </PageTabBtn>
            )}
            {renaming?.id !== p.id && (
              confirmDelete === p.id ? (
                <button
                  onClick={() => void deletePage(p.id)}
                  className="ml-0.5 rounded-full bg-red-500 px-2.5 py-1 text-[11.5px] font-bold text-white"
                >
                  Supprimer ?
                </button>
              ) : (
                <span className="hidden items-center group-hover:inline-flex">
                  <button
                    onClick={() => setRenaming({ id: p.id, value: p.title })}
                    title="Renommer la page"
                    className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-neutral-300 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    title="Supprimer la page"
                    className="grid h-5 w-5 place-items-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              )
            )}
          </span>
        ))}
        <button
          onClick={() => { setPageAsk(""); setCreateOpen(true); }}
          className="ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Plus size={14} /> Créer une page
        </button>
      </div>

      {/* Bandeau mode sous-page */}
      {onPage && (
        <div className="shrink-0 bg-violet-50 px-4 py-1.5 text-center text-[12.5px] text-violet-700">
          Vous modifiez la page « {data.pageTitle} ». L'en-tête et le pied de page sont communs au site —
          <button onClick={() => goToPage(null)} className="ml-1 font-semibold underline-offset-2 hover:underline">gérez-les depuis l'Accueil</button>.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ===== Canvas central ===== */}
        <div className="flex-1 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="mx-auto my-6 max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
            <Themed vibe={vibe} brandPrimary={brandPrimary}>
              {sections.map((s, i) => {
                const C = COMPONENTS[s.component];
                const isSel = selected === i;
                // Sur une sous-page, même un hero hérité peut être retiré.
                const canRemove = onPage ? s.role !== "footer" : s.role !== "hero" && s.role !== "footer";
                return (
                  <div
                    key={`${s.component}-${i}`}
                    className="relative"
                    onMouseEnter={() => !addOpen && replaceAt === null && setSelected(i)}
                    onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                    style={{ outline: isSel ? "2px solid var(--c-accent)" : "none", outlineOffset: -2 }}
                    {...(s.role === "hero" ? { "data-hero": heroTreatmentOf(vibe) } : {})}
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
                <ContentPanel section={rightSection} siteId={data.siteId} mediaBank={data.mediaBank} pages={data.pages} onChange={(c) => editContent(right.index, c)} />
              ) : null}
            </div>
          </aside>
        )}
      </div>

      {/* ===== Tiroirs ===== */}
      {replaceAt !== null && sections[replaceAt] && (
        <ReplaceDrawer
          section={sections[replaceAt]}
          allSections={sections}
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

      {/* ===== « Créer une page » : demande libre → composition IA ===== */}
      {createOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-[2px]" onClick={() => !creating && setCreateOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {creating ? (
              <div className="px-8 py-10">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                  <div className="relative grid h-14 w-14 place-items-center">
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-300/60" style={{ animationDuration: "1.8s" }} />
                    <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-neutral-900 text-white"><Sparkles size={22} /></span>
                  </div>
                  <h2 className="mt-5 text-[17px] font-bold text-neutral-900">Votre page se compose</h2>
                  <p className="mt-1 text-[13px] text-neutral-500">Quelques secondes — elle arrive directement dans l'éditeur.</p>
                  <ul className="mt-7 w-full space-y-3 text-left">
                    {GEN_STEPS.map((label, i) => (
                      <li key={label} className={`flex items-center gap-3 text-[13.5px] transition-all duration-500 ${i <= genStep ? "translate-x-0 opacity-100" : "translate-x-1 opacity-35"}`}>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${i < genStep ? "bg-emerald-100 text-emerald-600" : i === genStep ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                          {i < genStep ? <Check size={11} /> : i === genStep ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : i + 1}
                        </span>
                        <span className={i === genStep ? "font-semibold text-neutral-900" : "text-neutral-500"}>{label}…</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-7">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white"><Sparkles size={17} /></span>
                  <div>
                    <h2 className="text-[17px] font-bold text-neutral-900">Quelle page ajoutons-nous ?</h2>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
                      Dites-le avec vos mots : l'IA choisit les blocs, écrit vos textes et nomme la page. Vous retouchez ensuite.
                    </p>
                  </div>
                </div>

                <textarea
                  autoFocus
                  value={pageAsk}
                  onChange={(e) => setPageAsk(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void createPage(); } }}
                  rows={3}
                  maxLength={1000}
                  placeholder="Ex. « Une page tarifs avec mes trois formules et les questions qu'on me pose sur les prix. »"
                  className="mt-5 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-[14px] leading-relaxed text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
                />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PAGE_IDEAS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setPageAsk(s.ask)}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button onClick={() => setCreateOpen(false)} className="rounded-full px-4 py-2 text-[13px] font-semibold text-neutral-500 hover:text-neutral-800">Annuler</button>
                  <button
                    onClick={() => void createPage()}
                    disabled={pageAsk.trim().length < 8}
                    className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-40"
                  >
                    <Sparkles size={14} /> Composer ma page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Aperçu responsive (iframe = rendu réel du site) ===== */}
      {preview && (
        <DevicePreviewOverlay
          url={`/site-preview/${data.siteId}${data.pageId ? `?page=${data.pageId}` : ""}`}
          device={preview}
          pageTitle={data.pageTitle}
          onDevice={setPreview}
          onClose={() => setPreview(null)}
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

/** Tailles d'appareils : largeurs CSS réelles (les media queries du site réagissent). */
const DEVICES = {
  mobile: { w: 390, h: 844, label: "Mobile · 390 px" },
  tablet: { w: 834, h: 1112, label: "Tablette · 834 px" },
} as const;

/**
 * Aperçu responsive : le site (brouillon, page courante) rendu dans une iframe
 * à la largeur de l'appareil — exactement ce que verra un visiteur.
 */
function DevicePreviewOverlay({
  url,
  device,
  pageTitle,
  onDevice,
  onClose,
}: {
  url: string;
  device: "mobile" | "tablet";
  pageTitle: string | null;
  onDevice: (d: "mobile" | "tablet") => void;
  onClose: () => void;
}) {
  const d = DEVICES[device];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-neutral-950/85 backdrop-blur-sm">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="hidden text-[13px] font-medium text-white/60 sm:block">
          Aperçu {pageTitle ? `de « ${pageTitle} »` : "de l'Accueil"} — {d.label}
        </span>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white/10 p-0.5">
          <button onClick={onClose} title="Revenir à l'édition" className="grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
            <Monitor size={15} />
          </button>
          <button onClick={() => onDevice("tablet")} title="Tablette" className={`grid h-8 w-8 place-items-center rounded-full transition ${device === "tablet" ? "bg-white text-neutral-900" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
            <Tablet size={15} />
          </button>
          <button onClick={() => onDevice("mobile")} title="Mobile" className={`grid h-8 w-8 place-items-center rounded-full transition ${device === "mobile" ? "bg-white text-neutral-900" : "text-white/50 hover:bg-white/10 hover:text-white"}`}>
            <Smartphone size={15} />
          </button>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Fermer l'aperçu">
          <X size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-5">
        <div
          className={`h-full overflow-hidden bg-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
            device === "mobile" ? "rounded-[2.4rem] border-[7px] border-neutral-800" : "rounded-2xl border-[7px] border-neutral-800"
          }`}
          style={{ width: d.w + 14, maxHeight: d.h }}
        >
          <iframe src={url} title="Aperçu du site" className="h-full w-full" style={{ width: d.w }} />
        </div>
      </div>
    </div>
  );
}

function PageTabBtn({ active, onClick, onDoubleClick, children }: { active: boolean; onClick: () => void; onDoubleClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
    >
      {children}
    </button>
  );
}
