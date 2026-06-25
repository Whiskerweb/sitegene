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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Monitor, Tablet, Smartphone, Maximize2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthGate from "@/components/auth/AuthGate";
import { AkyraMark } from "@/components/ui/Logo";
import CollectStep from "@/components/creer/CollectStep";
import DescriptionQuality from "@/components/creer/DescriptionQuality";
import DomainField from "@/components/creer/DomainField";
import ImportCharte, { type ImportedCharte } from "@/components/creer/ImportCharte";
import type { DomainEntry } from "@/lib/foundry/domain-catalog";
import { ramp, readableOn } from "@/lib/client/color-preview";
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

/** Appareils d'aperçu (étape reveal) — largeurs façon TemplatePreview. */
const REVEAL_DEVICES: { id: "desktop" | "tablet" | "mobile"; label: string; width: string; Icon: typeof Monitor }[] = [
  { id: "desktop", label: "Ordinateur", width: "100%", Icon: Monitor },
  { id: "tablet", label: "Tablette", width: "820px", Icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
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
  // Domaine choisi par le client (ex. « Coach en développement personnel ») :
  // pilote les questions de qualité. Le NOM de l'activité, lui, n'est plus
  // demandé — il est extrait du brief par l'IA (→ `name`, via DescriptionQuality).
  const [domain, setDomain] = useState("");
  // Entrée de catalogue choisie (tradeId/sub) — purement informatif, invalidé si
  // l'utilisateur ré-édite le champ. `domain` (string) reste la source de vérité.
  const [domainEntry, setDomainEntry] = useState<DomainEntry | null>(null);
  const [name, setName] = useState("");
  const displayName = name.trim() || domain.trim();
  // Brief enrichi du domaine pour le classement DA + la génération (le label du
  // domaine contient les mots-clés que detectTrade exploite, même brief vague).
  const briefForGen = () => {
    const d = domain.trim();
    const b = brief.trim();
    return d ? `${d}. ${b}` : b;
  };

  // Aperçu de la phase reveal : appareil simulé + plein écran.
  const [revealDevice, setRevealDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [revealFullscreen, setRevealFullscreen] = useState(false);

  // Chartes sur mesure (étape DA)
  const [chartes, setChartes] = useState<Charte[] | null>(null);
  const [chartesLoading, setChartesLoading] = useState(false);
  // Historique des SÉRIES de chartes parcourues (navigation gauche/droite) :
  // chaque page = un trio. `chartes` reflète toujours `pages[pageIdx]`. Aller à
  // droite à la frontière déclenche une nouvelle série ; à gauche on revient aux
  // séries déjà vues (« je change d'avis, je reviens à l'ancienne »).
  const [pages, setPages] = useState<Charte[][]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  // Charte importée par le client (« j'ai déjà une identité ») — survit aux
  // régénérations des 3 propositions IA (affichée en 4e carte).
  const [importedCharte, setImportedCharte] = useState<Charte | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [authed, setAuthed] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Une fois le site assemblé (structure + textes figés), tout nouveau choix de
  // charte ne fait QUE recolorer (op palette) — on ne régénère plus la structure.
  const [assembled, setAssembled] = useState(false);
  // Bumpé après une recoloration → force le rechargement de l'aperçu (iframe).
  const [previewNonce, setPreviewNonce] = useState(0);
  const launchedRef = useRef(false);
  const speculativeRef = useRef<{ siteId: string; cards: Card[] } | null>(null);
  const chartesAutoRef = useRef(false); // debounce chartes : déjà déclenché ?
  const [collected, setCollected] = useState<Collected>({ socials: [], contact: {}, photos: [] });
  // Ids des chartes déjà montrées → exclus du prochain « 3 autres » (rotation
  // sans répétition). Ref : lu dans loadChartes (async), pas besoin de re-render.
  const shownIdsRef = useRef<string[]>([]);
  const trade = useMemo(
    () => detectTrade(domain.trim() ? `${domain.trim()}. ${brief}` : brief).trade,
    [brief, domain],
  );

  // --- Restauration (retour d'OAuth ou arrivée depuis la landing) --------------
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          brief?: string;
          domain?: string;
          domainEntry?: DomainEntry | null;
          name?: string;
          chartes?: Charte[];
          importedCharte?: Charte | null;
          selectedIdx?: number | null;
          accent?: string;
          collected?: Collected;
        };
        if (s.brief) setBrief(s.brief);
        if (s.domain) setDomain(s.domain);
        if (s.domainEntry && typeof s.domainEntry === "object") setDomainEntry(s.domainEntry);
        if (s.name) setName(s.name);
        if (Array.isArray(s.chartes) && s.chartes.length > 0) { setChartes(s.chartes); setPages([s.chartes]); setPageIdx(0); }
        if (s.importedCharte && typeof s.importedCharte === "object") setImportedCharte(s.importedCharte);
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
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ brief, domain, domainEntry, name, chartes, importedCharte, selectedIdx, accent, collected }));
    } catch {
      /* non bloquant */
    }
  }, [brief, domain, domainEntry, name, chartes, importedCharte, selectedIdx, accent, collected]);

  const pitchReady = brief.trim().length >= 10 && domain.trim().length >= 2;

  // Auto-charge les chartes dès que le pitch est assez long (sans clic "Continuer").
  useEffect(() => {
    if (!pitchReady || chartesAutoRef.current || chartes) return;
    const t = setTimeout(() => {
      chartesAutoRef.current = true;
      void loadChartes({ reset: true });
    }, 700);
    return () => clearTimeout(t);
  }, [pitchReady, brief, domain]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Chartes piochées dans la banque ------------------------------------------
  // reset = nouvelle série (exclude vide) ; sinon « 3 autres » (exclut le déjà-vu).
  async function loadChartes(opts?: { reset?: boolean }) {
    setChartesLoading(true);
    setError(null);
    setSelectedIdx(null);
    setAccent(null);
    speculativeRef.current = null; // reset la génération spéculative
    if (opts?.reset) shownIdsRef.current = [];
    const exclude = shownIdsRef.current;
    try {
      const res = await fetch("/api/foundry/charte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: briefForGen(), businessName: name.trim() || domain.trim(), exclude }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Impossible de composer vos chartes. Réessayez.");
      const next = data.chartes as Charte[];
      setChartes(next);
      // Historique des séries : reset = repart d'une page ; sinon nouvelle série
      // ajoutée à la frontière (on s'y positionne).
      if (opts?.reset) { setPages([next]); setPageIdx(0); }
      else { setPages((prev) => [...prev, next]); setPageIdx((prev) => prev + 1); }
      // Mémorise les ids servis pour ne pas les re-proposer à la série suivante.
      const ids = next.map((c) => c.vibe.id).filter((id): id is string => !!id && id !== "custom");
      shownIdsRef.current = [...shownIdsRef.current, ...ids];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de composer vos chartes. Réessayez.");
    } finally {
      setChartesLoading(false);
    }
  }

  // Navigation entre séries déjà vues (gauche) ou vers la suivante (droite).
  function goToPage(i: number) {
    setPageIdx(i);
    setChartes(pages[i]);
    setSelectedIdx(null);
    setAccent(null);
    // La pré-génération spéculative est couplée à la carte 0 de la série courante :
    // on l'invalide pour qu'elle se recale (sinon le raccourci d'assemblage pourrait
    // servir le site d'une autre série).
    speculativeRef.current = null;
  }
  function prevSeries() {
    if (chartesLoading || pageIdx <= 0) return;
    goToPage(pageIdx - 1);
  }
  function nextSeries() {
    if (chartesLoading) return;
    if (pageIdx < pages.length - 1) goToPage(pageIdx + 1); // série déjà vue
    else void loadChartes(); // frontière → on en compose une nouvelle
  }

  function openCollectPhase() {
    setPhase("collect");
    // Lance le chargement des chartes en arrière-plan dès le pitch validé
    setChartes(null);
    chartesAutoRef.current = false; // reset pour forcer un nouveau chargement
    void loadChartes({ reset: true });
  }

  // Aperçu plein écran : Échap pour fermer + on fige le scroll du corps.
  useEffect(() => {
    if (!revealFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRevealFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [revealFullscreen]);

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
    // Plus de pré-génération une fois le site assemblé : un nouveau choix de
    // charte se contente de recolorer (op palette), on ne régénère plus.
    if (!chartes || !authed || speculativeRef.current || assembled) return;
    const c0 = chartes[0];
    if (!c0) return;
    void (async () => {
      try {
        const res = await fetch("/api/foundry/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief: briefForGen(),
            businessName: name.trim() || domain.trim(),
            vibeId: "custom",
            charteSpec: c0.spec,
            hasReviews: collected.hasReviews,
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

  // Cartes affichées à l'étape charte : les 3 propositions IA + la charte
  // importée par le client (toujours en dernière position).
  const displayChartes = useMemo<Charte[] | null>(() => {
    if (!chartes && !importedCharte) return null;
    return [...(chartes ?? []), ...(importedCharte ? [importedCharte] : [])];
  }, [chartes, importedCharte]);

  const selected = selectedIdx !== null ? (displayChartes?.[selectedIdx] ?? null) : null;
  const rareCount = (cards ?? []).filter((c) => c.rarity !== "common").length;

  async function launchAssembly() {
    if (launchedRef.current || !selected) return;
    launchedRef.current = true;

    // Recoloration seule : le site est DÉJÀ assemblé → on n'applique que la charte
    // (couleurs + typo) sur la recette existante, sans toucher aux sections, aux
    // textes ni au header. C'est l'op « palette » de l'éditeur (L'Atelier).
    if (assembled && siteId) {
      setError(null);
      setBusy(true);
      try {
        const res = await fetch("/api/foundry/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            op: "palette",
            charteSpec: selected.vibe.id === "custom" ? selected.spec : undefined,
            vibeId: selected.vibe.id === "custom" ? undefined : selected.vibe.id,
            accent: accent ?? undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Changement de charte impossible. Réessayez.");
        setPreviewNonce((n) => n + 1); // recharge l'aperçu recoloré
        setPhase("reveal");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Changement de charte impossible. Réessayez.");
      } finally {
        setBusy(false);
        launchedRef.current = false;
      }
      return;
    }

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
        setAssembled(true); // structure figée → les charges suivantes recolorent
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
          brief: briefForGen(),
          businessName: name.trim() || domain.trim(),
          vibeId: selected.vibe.id,
          accent: accent ?? undefined,
          charteSpec: selected.vibe.id === "custom" ? selected.spec : undefined,
          hasReviews: collected.hasReviews,
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
      setAssembled(true); // structure figée → les charges suivantes recolorent
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assemblage impossible. Réessayez.");
      setPhase("vibe");
    } finally {
      setBusy(false);
      launchedRef.current = false;
    }
  }

  function applyImportedCharte(c: ImportedCharte) {
    const charte: Charte = { vibe: c.vibe as unknown as VibeData, spec: { ...c.spec }, reason: c.reason };
    setImportedCharte(charte);
    setImportOpen(false);
    // La charte importée vit en dernière position de displayChartes.
    setSelectedIdx(chartes?.length ?? 0);
    setAccent(charte.vibe.palette.accent);
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
      {(phase === "vibe" || phase === "reveal") && displayChartes
        ? displayChartes.map((c, i) => <link key={i} rel="stylesheet" href={c.vibe.fontHref} precedence="foundry-fonts" />)
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
        <Link href="/" aria-label="Akyra" className="flex items-center gap-2">
          <AkyraMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight">Akyra</span>
        </Link>
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

            <label className="mt-8 block text-sm font-semibold">Quel est votre domaine ?</label>
            <DomainField
              value={domain}
              onChange={setDomain}
              onSelect={setDomainEntry}
            />

            <label className="mt-5 block text-sm font-semibold">Ce que vous faites</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              maxLength={6000}
              placeholder="Présentez-vous : le nom de votre activité, pour qui, où, ce qui vous rend différent… N'hésitez pas à coller une bio ou un texte existant."
              className="mt-2 max-h-[460px] min-h-[150px] w-full resize-y rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-3.5 text-[15px] leading-relaxed outline-none transition focus:border-[rgb(var(--m-accent))]"
            />

            {/* Retour qualité en temps réel : détection locale instantanée, mais
                critères (questions) adaptés au DOMAINE via l'IA. Le nom de
                l'activité est extrait du brief par l'IA → `setName`. */}
            <DescriptionQuality text={brief} domain={domain} onBusinessName={setName} />

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
                  ? `Le directeur artistique compose trois directions pour « ${displayName || "votre activité"} »…`
                  : `Trois directions composées sur mesure pour « ${displayName || "votre activité"} ». Tout votre site en découlera.`}
              </p>
              <p className="mt-2 text-[13px] text-[rgb(var(--m-faint))]">
                Rien de définitif : vous pourrez changer de direction plus tard et visualiser le résultat en direct, en un clic.
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

            {/* Cartes de charte : chaque carte EST la charte (sa surface, ses
                lettres, ses couleurs) — planche de design system miniature. */}
            {!chartesLoading && displayChartes && (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {displayChartes.map((c, idx) => {
                  const v = c.vibe;
                  const isSel = selectedIdx === idx;
                  const a = isSel && accent ? accent : v.palette.accent;
                  const onA = readableOn(a);
                  const line = `color-mix(in srgb, ${v.palette.ink} 14%, transparent)`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedIdx(idx);
                        setAccent(v.palette.accent);
                      }}
                      className="group relative flex flex-col overflow-hidden rounded-3xl p-5 text-left shadow-cloud-sm transition hover:-translate-y-0.5 hover:shadow-cloud"
                      style={{
                        background: v.palette.surface,
                        border: `1px solid ${line}`,
                        boxShadow: isSel ? `0 0 0 2.5px ${a}, 0 18px 40px -18px ${a}66` : undefined,
                      }}
                    >
                      {/* Mini barre de site (carte + pilule contact) */}
                      <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: v.palette.card }}>
                        <span className="text-[11px] font-bold" style={{ color: v.palette.ink, fontFamily: v.fonts.heading }}>
                          {(displayName || "Studio").slice(0, 16)}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-semibold" style={{ background: a, color: onA, borderRadius: v.radius.pill }}>
                          Contact
                        </span>
                      </div>

                      {/* Nom de la direction — dans SES lettres */}
                      <div className="mt-4 flex items-start justify-between gap-2">
                        <div className="text-[24px] leading-tight" style={{ fontFamily: v.fonts.heading, color: v.palette.ink }}>
                          {v.label}
                        </div>
                        {importedCharte && idx === (chartes?.length ?? 0) ? (
                          <span className="mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: a, color: onA }}>
                            Votre identité
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {v.mood.map((m) => (
                          <span key={m} className="rounded-full px-2 py-0.5 text-[10.5px] font-medium" style={{ background: v.palette.card, color: v.palette.muted, fontFamily: v.fonts.body }}>
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Rampe de l'accent + pastilles de la palette */}
                      <div className="mt-4">
                        <div className="flex h-9 overflow-hidden rounded-xl border" style={{ borderColor: line }}>
                          {ramp(a).map((shade, j) => (
                            <span key={j} className="flex-1" style={{ background: shade }} />
                          ))}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] uppercase" style={{ color: v.palette.muted }}>
                          <span>{a.replace("#", "#").toUpperCase()}</span>
                          <span className="flex items-center gap-1.5">
                            {[v.palette.ink, v.palette.card, v.palette.accent2, v.palette.muted].map((hex, j) => (
                              <span key={j} className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: hex }} />
                            ))}
                          </span>
                        </div>
                      </div>

                      {/* Spécimens typographiques */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl px-3 py-2" style={{ background: v.palette.card }}>
                          <div className="font-mono text-[8px] uppercase" style={{ color: v.palette.muted }}>Display</div>
                          <div className="text-[26px] leading-none" style={{ fontFamily: v.fonts.heading, color: v.palette.ink }}>Aa</div>
                          <div className="mt-1 truncate text-[10px] font-semibold" style={{ color: v.palette.muted, fontFamily: v.fonts.body }}>{fontFamilyName(v.fonts.heading)}</div>
                        </div>
                        <div className="rounded-xl px-3 py-2" style={{ background: v.palette.card }}>
                          <div className="font-mono text-[8px] uppercase" style={{ color: v.palette.muted }}>Texte</div>
                          <div className="text-[26px] leading-none" style={{ fontFamily: v.fonts.body, color: v.palette.ink }}>Aa</div>
                          <div className="mt-1 truncate text-[10px] font-semibold" style={{ color: v.palette.muted, fontFamily: v.fonts.body }}>{fontFamilyName(v.fonts.body)}</div>
                        </div>
                      </div>

                      {/* Boutons de la charte */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-3.5 py-1.5 text-[11px] font-semibold" style={{ background: a, color: onA, borderRadius: v.radius.pill }}>
                          Bouton principal
                        </span>
                        <span className="px-3.5 py-1.5 text-[11px] font-semibold" style={{ color: v.palette.ink, border: `1px solid ${v.palette.muted}66`, borderRadius: v.radius.pill }}>
                          Secondaire
                        </span>
                      </div>

                      <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: v.palette.muted, fontFamily: v.fonts.body }}>{c.reason}</p>

                      {/* Accent personnalisable une fois la carte choisie */}
                      {isSel ? (
                        <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: line }}>
                          <span className="text-[11px] font-semibold" style={{ color: v.palette.muted }}>Couleur d'accent</span>
                          {[v.palette.accent, v.palette.accent2, v.palette.ink].map((cAcc, j) => (
                            <span
                              key={`${j}-${cAcc}`}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccent(cAcc);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && setAccent(cAcc)}
                              className="h-5 w-5 cursor-pointer rounded-full border border-black/15 transition"
                              style={{ background: cAcc, boxShadow: accent === cAcc ? `0 0 0 2px ${v.palette.surface}, 0 0 0 3.5px ${v.palette.ink}` : undefined }}
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
              {!chartesLoading && displayChartes && (
                <div className="flex flex-col items-center gap-3">
                  {/* Navigation entre séries : ← séries déjà vues · série suivante → */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={prevSeries}
                      disabled={pageIdx <= 0}
                      aria-label="Série précédente"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))] transition enabled:hover:border-[rgb(var(--m-ink))] enabled:hover:text-[rgb(var(--m-ink))] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ←
                    </button>
                    <span className="min-w-[120px] text-center text-[13px] font-medium text-[rgb(var(--m-muted))]">
                      Série {pageIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={nextSeries}
                      aria-label="Série suivante"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--m-line))] text-[rgb(var(--m-muted))] transition hover:border-[rgb(var(--m-ink))] hover:text-[rgb(var(--m-ink))]"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportOpen((o) => !o)}
                    className="text-sm font-medium text-[rgb(var(--m-muted))] underline-offset-4 transition hover:text-[rgb(var(--m-ink))] hover:underline"
                  >
                    {importOpen ? "Fermer" : "J'ai déjà une identité visuelle →"}
                  </button>
                </div>
              )}
              {!chartesLoading && importOpen && (
                <ImportCharte businessName={name} onApply={applyImportedCharte} />
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setPhase("pitch"); chartesAutoRef.current = false; setChartes(null); setPages([]); setPageIdx(0); shownIdsRef.current = []; setAssembled(false); }}
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
                  {busy ? "Application…" : assembled ? "Appliquer cette charte ✦" : "Assembler mon site ✦"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================== 2.5 COLLECT (liens & photos) ===================== */}
        {phase === "collect" && (
          <CollectStep
            trade={trade}
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
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Voici {displayName || "votre site"}.</h1>
              <p className="mt-3 text-[15px] text-[rgb(var(--m-muted))]">
                Voici la première version de votre site{selected ? `, dans votre charte « ${selected.vibe.label} »` : ""}.
                Vous pourrez changer les textes, les images et les sections en deux clics — en appuyant sur
                le bouton <span className="font-medium text-[rgb(var(--m-ink))]">Continuer</span> juste en dessous.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-cloud">
              {/* Barre navigateur + contrôles d'aperçu (appareil + plein écran) */}
              <div className="flex items-center gap-1.5 border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-elevated))] px-3 py-2 sm:px-4 sm:py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-300" />
                <span className="ml-2 hidden min-w-0 truncate rounded-md bg-white px-2.5 py-0.5 text-[11px] text-[rgb(var(--m-faint))] sm:inline">
                  akyra.io/votre-site
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="flex items-center gap-0.5 rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-0.5">
                    {REVEAL_DEVICES.map((d) => {
                      const active = d.id === revealDevice;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setRevealDevice(d.id)}
                          aria-pressed={active}
                          title={d.label}
                          className={
                            "inline-flex items-center justify-center rounded-full p-1.5 transition-colors " +
                            (active
                              ? "bg-[rgb(var(--m-ink))] text-[rgb(var(--m-surface))]"
                              : "text-[rgb(var(--m-faint))] hover:text-[rgb(var(--m-ink))]")
                          }
                        >
                          <d.Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevealFullscreen(true)}
                    title="Plein écran"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--m-line))] px-2.5 py-1.5 text-[12px] font-medium text-[rgb(var(--m-muted))] transition-colors hover:text-[rgb(var(--m-ink))]"
                  >
                    <Maximize2 size={13} />
                    <span className="hidden sm:inline">Plein écran</span>
                  </button>
                </div>
              </div>
              {/* Scène : iframe centrée, largeur selon l'appareil */}
              <div className="flex h-[62vh] justify-center overflow-auto bg-[rgb(var(--m-elevated))] sm:p-4">
                <iframe
                  key={`${revealDevice}-${previewNonce}`}
                  src={`/site-preview/${siteId}`}
                  title="Votre site"
                  className="h-full border-0 bg-white shadow-sm sm:rounded-xl"
                  style={{ width: REVEAL_DEVICES.find((d) => d.id === revealDevice)!.width, maxWidth: "100%" }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard?from=creer")}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--m-accent))] px-6 text-[15px] font-semibold text-[rgb(var(--m-on-accent))] transition hover:opacity-90"
              >
                Continuer →
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("vibe");
                  setCards(null);
                  setRevealed(0);
                  // Invalide le raccourci d'assemblage spéculatif (couplé à la
                  // charte 0) : sans ça, re-choisir une charte resservait le site
                  // de base déjà pré-généré au lieu de régénérer la nouvelle.
                  speculativeRef.current = null;
                  setSelectedIdx(null);
                  setAccent(null);
                }}
                className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--m-line))] px-5 text-[15px] font-medium text-[rgb(var(--m-muted))] transition hover:text-[rgb(var(--m-ink))]"
              >
                Essayer une autre charte
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Aperçu plein écran — façon TemplatePreview de la landing : bascule
          appareil + vraie surface d'affichage. */}
      {revealFullscreen && siteId && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-neutral-900/95 backdrop-blur-sm">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-900 px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/80">
              {displayName || "Votre site"}
            </span>
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1">
              {REVEAL_DEVICES.map((d) => {
                const active = d.id === revealDevice;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setRevealDevice(d.id)}
                    aria-pressed={active}
                    title={d.label}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors " +
                      (active ? "bg-white text-neutral-900" : "text-white/60 hover:text-white")
                    }
                  >
                    <d.Icon size={14} />
                    <span className="hidden sm:inline">{d.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setRevealFullscreen(false)}
              className="inline-flex flex-1 items-center justify-end gap-1.5 text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:flex-none"
            >
              <X size={16} /> <span className="hidden sm:inline">Fermer</span>
            </button>
          </header>
          <div className="flex flex-1 justify-center overflow-auto p-3 md:p-6">
            <iframe
              key={`${revealDevice}-${previewNonce}`}
              src={`/site-preview/${siteId}`}
              title="Votre site"
              className="h-full rounded-lg border-0 bg-white shadow-2xl"
              style={{ width: REVEAL_DEVICES.find((d) => d.id === revealDevice)!.width, maxWidth: "100%" }}
            />
          </div>
        </div>
      )}

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
