"use client";

/**
 * Tunnel de création gamifié (~90 s) — l'ADN « assembleur » :
 *   1. pitch  : décrivez votre activité (1 champ + nom)
 *   2. vibe   : CHARTE GRAPHIQUE SUR MESURE — 3 propositions composées par
 *               l'IA pour ce client (palette calibrée, paire typographique,
 *               formes), présentées en cartes façon brand-kit : swatches hex,
 *               spécimens Aa display/body, boutons. Régénérables.
 *   3. pack   : l'architecte assemble — les sections tombent comme des cartes
 *               à rareté (ouverture de booster)
 *   4. reveal : votre site, en vrai, sur votre charte
 * Le compte n'est demandé qu'au moment d'assembler (AuthGate inline). L'état
 * survit au redirect OAuth via sessionStorage.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthGate from "@/components/auth/AuthGate";
import { AkyraMark } from "@/components/ui/Logo";
import CollectStep from "@/components/creer/CollectStep";
import { detectTrade } from "@/lib/foundry/suggest";
import type { Collected } from "@/lib/foundry/link-catalog";

type Phase = "pitch" | "vibe" | "collect" | "pack" | "reveal";

type Card = { component: string; role: string; roleLabel: string; rarity: "common" | "rare" | "epic" };

/** Vibe sérialisée (renvoyée par /api/foundry/charte). */
type VibeData = {
  id: string;
  label: string;
  mood: string[];
  fontHref: string;
  palette: { ink: string; surface: string; card: string; accent: string; accent2: string; muted: string };
  fonts: { heading: string; body: string };
  radius: { card: string; xl: string; pill: string };
};
type Charte = { vibe: VibeData; spec: Record<string, unknown>; reason: string };

const STATE_KEY = "akyra_creer";

const EXAMPLES = [
  { label: "Coach", text: "Je suis coach en développement personnel à Lyon. J'accompagne les actifs stressés vers plus de clarté, en cabinet ou en visio." },
  { label: "Artisan", text: "Plombier chauffagiste à Rennes depuis 12 ans. Dépannage rapide, rénovation de salles de bain, devis gratuit." },
  { label: "Photographe", text: "Photographe de mariage et de portrait en Bretagne. Une approche naturelle et lumineuse, des souvenirs qui durent." },
  { label: "Bien-être", text: "Studio de yoga et de méditation au centre de Bordeaux. Cours collectifs doux, ateliers du soir et séances privées." },
];

const RARITY_UI: Record<Card["rarity"], { label: string; ring: string; bg: string; text: string }> = {
  common: { label: "Commun", ring: "ring-neutral-200", bg: "bg-neutral-50", text: "text-neutral-500" },
  rare: { label: "Rare ✦", ring: "ring-violet-300", bg: "bg-violet-50", text: "text-violet-600" },
  epic: { label: "Épique ✦✦", ring: "ring-amber-300", bg: "bg-amber-50", text: "text-amber-600" },
};

const ASSEMBLY_STEPS = [
  "L'architecte lit votre brief…",
  "Sélection des composants dans la réserve…",
  "Rédaction de vos textes, en français…",
  "Accord des couleurs et de la typographie…",
  "Derniers réglages d'agencement…",
];

const fontFamilyName = (stack: string) => stack.split(",")[0].replace(/['"]/g, "").trim();

export default function CreerClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pitch");
  const [brief, setBrief] = useState("");
  const [name, setName] = useState("");

  // Chartes sur mesure (étape DA)
  const [chartes, setChartes] = useState<Charte[] | null>(null);
  const [chartesLoading, setChartesLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [accent, setAccent] = useState<string | null>(null);

  const [authed, setAuthed] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const launchedRef = useRef(false);
  const speculativeRef = useRef<{ siteId: string; cards: Card[] } | null>(null);
  const chartesAutoRef = useRef(false); // debounce chartes : déjà déclenché ?
  const [collected, setCollected] = useState<Collected>({ socials: [], contact: {}, photos: [] });
  const [attempt, setAttempt] = useState(0);
  const trade = useMemo(() => detectTrade(brief).trade, [brief]);

  // --- Restauration (retour d'OAuth ou arrivée depuis la landing) --------------
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          brief?: string;
          name?: string;
          chartes?: Charte[];
          selectedIdx?: number | null;
          accent?: string;
          collected?: Collected;
        };
        if (s.brief) setBrief(s.brief);
        if (s.name) setName(s.name);
        if (Array.isArray(s.chartes) && s.chartes.length > 0) setChartes(s.chartes);
        if (typeof s.selectedIdx === "number") setSelectedIdx(s.selectedIdx);
        if (s.accent) setAccent(s.accent);
        if (s.collected && typeof s.collected === "object") setCollected(s.collected as Collected);
        if (s.brief && Array.isArray(s.chartes) && s.chartes.length > 0) setPhase("vibe");
      } else {
        // Brief tapé dans la bulle de la landing (clé partagée avec AuthGate).
        const landingBrief = sessionStorage.getItem("akyra_brief");
        if (landingBrief?.trim()) setBrief(landingBrief.trim());
      }
    } catch {
      /* sessionStorage indispo : tunnel vierge */
    }
    createClient()
      .auth.getUser()
      .then(({ data }) => setAuthed(!!data.user));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ brief, name, chartes, selectedIdx, accent, collected }));
    } catch {
      /* non bloquant */
    }
  }, [brief, name, chartes, selectedIdx, accent, collected]);

  const pitchReady = brief.trim().length >= 10 && name.trim().length >= 2;

  // Auto-charge les chartes dès que le pitch est assez long (sans clic "Continuer").
  useEffect(() => {
    if (!pitchReady || chartesAutoRef.current || chartes) return;
    const t = setTimeout(() => {
      chartesAutoRef.current = true;
      void loadChartes(0);
    }, 700);
    return () => clearTimeout(t);
  }, [pitchReady, brief, name]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Chartes sur mesure -------------------------------------------------------
  async function loadChartes(overrideAttempt?: number) {
    setChartesLoading(true);
    setError(null);
    setSelectedIdx(null);
    setAccent(null);
    speculativeRef.current = null; // reset la génération spéculative
    const currentAttempt = overrideAttempt ?? attempt;
    try {
      const res = await fetch("/api/foundry/charte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim(), businessName: name.trim(), attempt: currentAttempt }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Impossible de composer vos chartes. Réessayez.");
      setChartes(data.chartes as Charte[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de composer vos chartes. Réessayez.");
    } finally {
      setChartesLoading(false);
    }
  }

  // Pré-alloue un siteId (pour l'upload de photos en phase collect).
  async function reserveSiteId() {
    if (!authed || siteId) return;
    try {
      const res = await fetch("/api/site/reserve", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (data?.siteId) setSiteId(data.siteId as string);
    } catch { /* non bloquant */ }
  }

  function openCollectPhase() {
    setPhase("collect");
    // Lance le chargement des chartes en arrière-plan dès le pitch validé
    setAttempt(0);
    setChartes(null);
    chartesAutoRef.current = false; // reset pour forcer un nouveau chargement
    void loadChartes(0);
    void reserveSiteId();
  }

  // --- Étapes animées pendant l'assemblage ------------------------------------
  useEffect(() => {
    if (phase !== "pack" || cards) return;
    const t = setInterval(() => setStepIdx((i) => (i + 1) % ASSEMBLY_STEPS.length), 2400);
    return () => clearInterval(t);
  }, [phase, cards]);

  // --- Ouverture du booster : révèle les cartes une à une ----------------------
  useEffect(() => {
    if (!cards || revealed >= cards.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 350 : 430);
    return () => clearTimeout(t);
  }, [cards, revealed]);

  useEffect(() => {
    if (cards && revealed >= cards.length) {
      const t = setTimeout(() => setPhase("reveal"), 1100);
      return () => clearTimeout(t);
    }
  }, [cards, revealed]);

  // Génération spéculative : dès que chartes[0] est disponible, on génère déjà
  // le site avec la première direction. Si l'utilisateur la choisit → reveal quasi-instantané.
  useEffect(() => {
    if (!chartes || !authed || speculativeRef.current) return;
    const c0 = chartes[0];
    if (!c0) return;
    void (async () => {
      try {
        const res = await fetch("/api/foundry/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief: brief.trim(),
            businessName: name.trim(),
            vibeId: "custom",
            charteSpec: c0.spec,
          }),
        });
        const data = await res.json().catch(() => null);
        if (data?.ok && data.siteId) {
          speculativeRef.current = { siteId: data.siteId as string, cards: data.cards as Card[] };
          // Met à jour siteId si pas encore défini (permet l'upload de photos)
          setSiteId((prev) => prev ?? (data.siteId as string));
        }
      } catch { /* best-effort, pas d'erreur visible */ }
    })();
  }, [chartes, authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = selectedIdx !== null ? (chartes?.[selectedIdx] ?? null) : null;
  const rareCount = (cards ?? []).filter((c) => c.rarity !== "common").length;

  async function launchAssembly() {
    if (launchedRef.current || !selected) return;
    launchedRef.current = true;

    // Cas rapide : l'utilisateur a choisi la charte[0] et la génération spéculative
    // est déjà terminée → pas de nouveau fetch, reveal quasi-instantané.
    if (selectedIdx === 0 && speculativeRef.current) {
      const spec = speculativeRef.current;
      setCards(null);
      setRevealed(0);
      setError(null);
      setPhase("pack");
      setBusy(true);
      try {
        setSiteId(spec.siteId);
        try {
          await fetch("/api/foundry/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: spec.siteId, collected }),
          });
        } catch { /* best-effort */ }
        setCards(spec.cards);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Assemblage impossible. Réessayez.");
        setPhase("vibe");
      } finally {
        setBusy(false);
        launchedRef.current = false;
      }
      return;
    }

    // Cas normal : générer avec la charte sélectionnée.
    setCards(null);
    setRevealed(0);
    setError(null);
    setPhase("pack");
    setBusy(true);
    try {
      const res = await fetch("/api/foundry/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          businessName: name.trim(),
          vibeId: selected.vibe.id,
          accent: accent ?? undefined,
          charteSpec: selected.vibe.id === "custom" ? selected.spec : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.redirect) { router.push(data.redirect); return; }
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Assemblage impossible. Réessayez.");
      const newSiteId = data.siteId as string;
      setSiteId(newSiteId);
      try {
        await fetch("/api/foundry/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId: newSiteId, collected }),
        });
      } catch { /* best-effort */ }
      setCards(data.cards as Card[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assemblage impossible. Réessayez.");
      setPhase("vibe");
    } finally {
      setBusy(false);
      launchedRef.current = false;
    }
  }

  function finishCollect() {
    setPhase("vibe");
  }

  function skipCollect() {
    setPhase("vibe");
  }

  function onAssembleClick() {
    if (!selected) return;
    if (!authed) {
      setGateOpen(true);
      return;
    }
    void launchAssembly();
  }

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: (i * 137) % 100,
        delay: ((i * 53) % 90) / 100,
        hue: ["#2563eb", "#7c3aed", "#f59e0b", "#10b981", "#ef4444"][i % 5],
        spin: 180 + ((i * 97) % 360),
      })),
    [],
  );

  return (
    <div className="akyra min-h-screen">
      {/* Fonts des chartes proposées (spécimens typographiques des cartes). */}
      {(phase === "vibe" || phase === "reveal") && chartes
        ? chartes.map((c, i) => <link key={i} rel="stylesheet" href={c.vibe.fontHref} precedence="foundry-fonts" />)
        : null}
      <style>{`
        @keyframes sg-card-in { 0% { opacity: 0; transform: translateY(26px) rotateX(40deg) scale(0.92); } 60% { opacity: 1; } 100% { opacity: 1; transform: none; } }
        @keyframes sg-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes sg-confetti { 0% { transform: translateY(-10vh) rotate(0); opacity: 1; } 100% { transform: translateY(105vh) rotate(var(--spin)); opacity: 0; } }
        @keyframes sg-pulse { 0%,100% { opacity: 0.45 } 50% { opacity: 1 } }
        @keyframes sg-shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
      `}</style>

      {/* Top bar minimaliste */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <a href="/" aria-label="Akyra" className="flex items-center gap-2">
          <AkyraMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight">Akyra</span>
        </a>
        <div className="flex items-center gap-1.5" aria-label="Progression">
          {(["pitch", "collect", "vibe", "pack"] as Phase[]).map((p, i) => {
            const order: Phase[] = ["pitch", "collect", "vibe", "pack", "reveal"];
            const active = order.indexOf(phase) >= i;
            return <span key={p} className={`h-1.5 rounded-full transition-all ${active ? "w-8 bg-[rgb(var(--m-accent))]" : "w-4 bg-[rgb(var(--m-line))]"}`} />;
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24">
        {/* ============================ 1. PITCH ============================ */}
        {phase === "pitch" && (
          <section className="mx-auto max-w-2xl pt-10 sm:pt-16">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Décrivez votre activité.
              <br />
              <span className="text-[rgb(var(--m-muted))]">On assemble le reste.</span>
            </h1>
            <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
              Deux phrases suffisent. L'IA compose votre charte graphique, puis votre site est
              assemblé à partir de composants premium — pas de page blanche.
            </p>

            <label className="mt-8 block text-sm font-semibold">Le nom de votre activité</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Atelier Lumière, Breizh Plomberie…"
              maxLength={80}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-3.5 text-[15px] outline-none transition focus:border-[rgb(var(--m-accent))]"
            />

            <label className="mt-5 block text-sm font-semibold">Ce que vous faites</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Votre métier, pour qui, où, ce qui vous rend différent…"
              className="mt-2 w-full resize-none rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-3.5 text-[15px] leading-relaxed outline-none transition focus:border-[rgb(var(--m-accent))]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setBrief(ex.text)}
                  className="rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[13px] text-[rgb(var(--m-muted))] transition hover:border-[rgb(var(--m-accent))] hover:text-[rgb(var(--m-ink))]"
                >
                  {ex.label} ↗
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!pitchReady}
              onClick={openCollectPhase}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer →
            </button>
          </section>
        )}

        {/* ===================== 2. VIBE (charte sur mesure) ===================== */}
        {phase === "vibe" && (
          <section className="pt-8 sm:pt-12">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Votre charte graphique</h1>
              <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
                {chartesLoading
                  ? `Le directeur artistique compose trois directions pour « ${name.trim() || "votre activité"} »…`
                  : `Trois directions composées sur mesure pour « ${name.trim() || "votre activité"} ». Tout votre site en découlera.`}
              </p>
              {error ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">{error}</p>
              ) : null}
            </div>

            {/* Squelettes pendant la composition */}
            {chartesLoading && (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-3xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-5">
                    <div className="h-28 rounded-2xl bg-[rgb(var(--m-elevated))]" style={{ animation: `sg-pulse 1.6s ease-in-out ${i * 0.2}s infinite` }} />
                    <div className="mt-4 h-4 w-2/3 rounded bg-[rgb(var(--m-elevated))]" style={{ animation: `sg-pulse 1.6s ease-in-out ${0.1 + i * 0.2}s infinite` }} />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[rgb(var(--m-elevated))]" style={{ animation: `sg-pulse 1.6s ease-in-out ${0.2 + i * 0.2}s infinite` }} />
                    <div className="mt-5 flex gap-1.5">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-7 w-7 rounded-full bg-[rgb(var(--m-elevated))]" style={{ animation: `sg-pulse 1.6s ease-in-out ${0.1 * j + i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cartes de charte façon brand-kit */}
            {!chartesLoading && chartes && (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {chartes.map((c, idx) => {
                  const v = c.vibe;
                  const isSel = selectedIdx === idx;
                  const a = isSel && accent ? accent : v.palette.accent;
                  const swatches: Array<[string, string]> = [
                    ["Encre", v.palette.ink],
                    ["Fond", v.palette.surface],
                    ["Carte", v.palette.card],
                    ["Accent", a],
                    ["Accent 2", v.palette.accent2],
                  ];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedIdx(idx);
                        setAccent(v.palette.accent);
                      }}
                      className={`group relative flex flex-col rounded-3xl border bg-[rgb(var(--m-surface))] p-5 text-left shadow-cloud-sm transition hover:-translate-y-0.5 hover:shadow-cloud ${
                        isSel ? "border-[rgb(var(--m-accent))] ring-2 ring-[rgb(var(--m-accent))]/30" : "border-[rgb(var(--m-line))]"
                      }`}
                    >
                      {/* Mini-aperçu hero coloré par la charte */}
                      <div className="overflow-hidden rounded-2xl border border-black/5" style={{ background: v.palette.surface }}>
                        <div className="flex items-center justify-between px-3 py-2" style={{ background: v.palette.card }}>
                          <span className="text-[11px] font-bold" style={{ color: v.palette.ink, fontFamily: v.fonts.heading }}>
                            {(name.trim() || "Studio").slice(0, 16)}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-semibold text-white" style={{ background: a, borderRadius: v.radius.pill }}>
                            Contact
                          </span>
                        </div>
                        <div className="px-3 py-3">
                          <div className="text-[15px] leading-snug" style={{ color: v.palette.ink, fontFamily: v.fonts.heading }}>
                            Un site qui vous ressemble
                          </div>
                          <div className="mt-1 text-[10px] leading-relaxed" style={{ color: v.palette.muted, fontFamily: v.fonts.body }}>
                            Chaque section reprendra ces couleurs et ces lettres.
                          </div>
                        </div>
                      </div>

                      {/* Nom + ambiance */}
                      <div className="mt-4">
                        <div className="text-[16px] font-bold tracking-tight">{v.label}</div>
                        <div className="mt-0.5 text-[12px] text-[rgb(var(--m-muted))]">{v.mood.join(" · ")}</div>
                      </div>

                      {/* Palette : swatches + hex (façon brand-kit) */}
                      <div className="mt-3 grid grid-cols-5 gap-1.5">
                        {swatches.map(([label, hex]) => (
                          <div key={label} className="flex flex-col items-center gap-1">
                            <span className="h-7 w-full rounded-lg border border-black/10" style={{ background: hex }} />
                            <span className="font-mono text-[8.5px] uppercase text-[rgb(var(--m-faint))]">{hex.replace("#", "")}</span>
                          </div>
                        ))}
                      </div>

                      {/* Typographies : spécimens Aa */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-[rgb(var(--m-line))] px-3 py-2">
                          <div className="text-[22px] leading-none" style={{ fontFamily: v.fonts.heading, color: v.palette.ink }}>Aa</div>
                          <div className="mt-1 text-[10px] font-semibold text-[rgb(var(--m-muted))]">{fontFamilyName(v.fonts.heading)}</div>
                          <div className="text-[9px] text-[rgb(var(--m-faint))]">Titres</div>
                        </div>
                        <div className="rounded-xl border border-[rgb(var(--m-line))] px-3 py-2">
                          <div className="text-[22px] leading-none" style={{ fontFamily: v.fonts.body, color: v.palette.ink }}>Aa</div>
                          <div className="mt-1 text-[10px] font-semibold text-[rgb(var(--m-muted))]">{fontFamilyName(v.fonts.body)}</div>
                          <div className="text-[9px] text-[rgb(var(--m-faint))]">Texte</div>
                        </div>
                      </div>

                      {/* Boutons de la charte */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-3.5 py-1.5 text-[11px] font-semibold text-white" style={{ background: a, borderRadius: v.radius.pill }}>
                          Bouton principal
                        </span>
                        <span className="px-3.5 py-1.5 text-[11px] font-semibold" style={{ color: v.palette.ink, border: `1px solid ${v.palette.muted}55`, borderRadius: v.radius.pill }}>
                          Secondaire
                        </span>
                      </div>

                      <p className="mt-3 text-[12.5px] leading-relaxed text-[rgb(var(--m-muted))]">{c.reason}</p>

                      {/* Accent personnalisable une fois la carte choisie */}
                      {isSel ? (
                        <div className="mt-3 flex items-center gap-2 border-t border-[rgb(var(--m-line))] pt-3">
                          <span className="text-[11px] font-semibold text-[rgb(var(--m-muted))]">Couleur d'accent</span>
                          {[v.palette.accent, v.palette.accent2, v.palette.ink].map((cAcc) => (
                            <span
                              key={cAcc}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccent(cAcc);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && setAccent(cAcc)}
                              className={`h-5 w-5 cursor-pointer rounded-full border border-black/10 transition ${accent === cAcc ? "ring-2 ring-offset-1 ring-[rgb(var(--m-ink))]" : ""}`}
                              style={{ background: cAcc }}
                              aria-label={`Accent ${cAcc}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-4">
              {!chartesLoading && (
                <button
                  type="button"
                  onClick={() => { const next = attempt + 1; setAttempt(next); void loadChartes(next); }}
                  className="text-sm font-medium text-[rgb(var(--m-muted))] underline-offset-4 transition hover:text-[rgb(var(--m-ink))] hover:underline"
                >
                  ✦ Proposer trois autres directions
                </button>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setPhase("pitch"); chartesAutoRef.current = false; setChartes(null); }}
                  className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--m-line))] px-5 text-[15px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
                >
                  ← Modifier mon pitch
                </button>
                <button
                  type="button"
                  disabled={!selected || busy || chartesLoading}
                  onClick={onAssembleClick}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Assembler mon site ✦
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================== 2.5 COLLECT (liens & photos) ===================== */}
        {phase === "collect" && (
          <CollectStep
            trade={trade}
            siteId={siteId}
            chartesReady={!chartesLoading && Array.isArray(chartes) && chartes.length > 0}
            collected={collected}
            onChange={setCollected}
            onFinish={finishCollect}
            onSkip={skipCollect}
          />
        )}

        {/* ===================== 3. PACK (assemblage + booster) ===================== */}
        {phase === "pack" && (
          <section className="pt-10 sm:pt-14">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {cards ? "Votre site est composé de…" : "L'architecte assemble votre site"}
              </h1>
              {!cards ? (
                <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]" style={{ animation: "sg-pulse 2.4s ease-in-out infinite" }}>
                  {ASSEMBLY_STEPS[stepIdx]}
                </p>
              ) : (
                <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
                  {cards.length} sections choisies pour vous
                  {rareCount > 0 ? (
                    <span className="ml-2 rounded-full bg-violet-50 px-2.5 py-0.5 text-[13px] font-semibold text-violet-600">
                      dont {rareCount} {rareCount > 1 ? "pièces rares" : "pièce rare"} ✦
                    </span>
                  ) : null}
                </p>
              )}
            </div>

            {!cards ? (
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]"
                    style={{ animation: `sg-pulse 1.8s ease-in-out ${i * 0.18}s infinite` }}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 sm:grid-cols-4">
                {cards.map((c, i) => {
                  const ui = RARITY_UI[c.rarity];
                  const shown = i < revealed;
                  return (
                    <div key={i} className="aspect-[3/4] [perspective:600px]">
                      {shown ? (
                        <div
                          className={`flex h-full flex-col items-center justify-center gap-2 rounded-2xl ${ui.bg} p-3 ring-2 ${ui.ring} shadow-cloud-sm`}
                          style={{ animation: "sg-card-in 0.5s cubic-bezier(0.2,0.9,0.3,1.2) both" }}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${ui.text}`}>{ui.label}</span>
                          <span className="text-center text-[13px] font-bold leading-tight text-[rgb(var(--m-ink))]">{c.roleLabel}</span>
                          <span className="text-center text-[10px] text-[rgb(var(--m-muted))]">{c.component}</span>
                        </div>
                      ) : (
                        <div className="h-full rounded-2xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================ 4. REVEAL ============================ */}
        {phase === "reveal" && siteId && (
          <section className="pt-6">
            {/* Confettis */}
            <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
              {confetti.map((c, i) => (
                <span
                  key={i}
                  className="absolute top-0 h-2.5 w-1.5 rounded-sm"
                  style={{
                    left: `${c.left}%`,
                    background: c.hue,
                    ["--spin" as string]: `${c.spin}deg`,
                    animation: `sg-confetti ${2.4 + (i % 5) * 0.3}s ease-in ${c.delay}s both`,
                  }}
                />
              ))}
            </div>

            <div className="mx-auto max-w-2xl text-center" style={{ animation: "sg-pop 0.5s ease both" }}>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Voici {name.trim() || "votre site"}.</h1>
              <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
                Assemblé sur mesure, dans votre charte{selected ? ` « ${selected.vibe.label} »` : ""}. Chaque
                section se remplace ou s'échange depuis votre tableau de bord — sans toucher au design.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-cloud">
              <div className="flex items-center gap-1.5 border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-3 truncate rounded-md bg-white px-2.5 py-0.5 text-[11px] text-[rgb(var(--m-faint))]">
                  akyra.io/votre-site
                </span>
              </div>
              <iframe src={`/site-preview/${siteId}`} title="Votre site" className="h-[62vh] w-full" />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard?from=creer")}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition hover:opacity-90"
              >
                Ouvrir mon tableau de bord →
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("vibe");
                  setCards(null);
                  setRevealed(0);
                }}
                className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--m-line))] px-5 text-[15px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
              >
                Essayer une autre charte
              </button>
            </div>
          </section>
        )}
      </main>

      <AuthGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        brief={brief}
        redirectTo="/creer"
        onAuthed={() => {
          setGateOpen(false);
          setAuthed(true);
          void launchAssembly();
        }}
      />
    </div>
  );
}
