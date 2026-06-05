"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp, stagger } from "@/lib/motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { SitePreview } from "@/components/ui/SitePreview";
import { CopyButton } from "@/components/ui/CopyButton";
import { Spinner } from "@/components/ui/Spinner";
import {
  IconCheck,
  IconChevron,
  IconCredit,
  IconExternal,
  IconSpark,
  IconStar4,
} from "@/components/ui/icons";

type TplCard = {
  id: string;
  name: string;
  style: string;
  owned: boolean;
  current: boolean;
  recommended: boolean;
  categoryId: string;
  categoryLabel: string;
};

type FxCard = {
  id: string;
  name: string;
  description: string;
  owned: boolean;
  compatible: boolean;
  accent: { from: string; to: string };
};

type CategoryChip = { id: string; label: string; count: number };

/** Vue de la boutique : accueil (2 rangées) ou catalogue complet, pilotée par ?view=. */
type View = "home" | "templates" | "effects";
type TplSort = "reco" | "name" | "owned";
type FxSort = "featured" | "name" | "owned" | "compatible";

type Modal =
  | { kind: "confirm"; itemType: "template" | "effect"; id: string; name: string; price: number }
  | { kind: "unlocked-template"; id: string; name: string; siteId: string | null }
  | { kind: "licence"; id: string; name: string; licenseCode: string; compatible: boolean }
  | { kind: "insufficient"; needed: number }
  | { kind: "applying"; name: string }
  | null;

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-cloud-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const btnSubtle =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night disabled:pointer-events-none disabled:opacity-50";
const selectCtl =
  "rounded-full border border-sky-300 bg-surface px-3 py-1.5 text-[13px] font-semibold text-night outline-none transition-colors hover:bg-sky-100";

/**
 * Monte ses enfants (vignette iframe) uniquement quand le cadre approche du
 * viewport — la boutique n'embarque ainsi que les aperçus réellement visibles,
 * que ce soit dans les rangées défilantes ou les grilles complètes.
 */
function LazyMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "260px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-[16/10] w-full overflow-hidden bg-white">
      {show ? children : <div className="absolute inset-0 animate-pulse bg-sky-100/60" />}
    </div>
  );
}

/**
 * Rangée défilante horizontalement (molette/swipe) avec flèches de navigation
 * sur desktop ; la scrollbar est masquée, la carte coupée au bord sert
 * d'affordance « il y a plus à droite ».
 */
function Carousel({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCan({
      left: el.scrollLeft > 8,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    el?.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-sky-300 bg-surface text-night shadow-cloud-sm transition-colors hover:bg-sky-100 md:grid";

  return (
    <div className="relative">
      <motion.div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        onScroll={update}
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </motion.div>
      {can.left && (
        <button
          type="button"
          aria-label="Faire défiler vers la gauche"
          onClick={() => nudge(-1)}
          className={`${arrow} -left-3`}
        >
          <IconChevron size={17} className="rotate-180" />
        </button>
      )}
      {can.right && (
        <button
          type="button"
          aria-label="Faire défiler vers la droite"
          onClick={() => nudge(1)}
          className={`${arrow} -right-3`}
        >
          <IconChevron size={17} />
        </button>
      )}
    </div>
  );
}

export function MarketplaceClient({
  hasSite,
  balance: initialBalance,
  categoryLabel,
  templatePrice,
  effectPrice,
  templates,
  categories,
  effects,
}: {
  hasSite: boolean;
  balance: number;
  categoryLabel: string;
  templatePrice: number;
  effectPrice: number;
  templates: TplCard[];
  categories: CategoryChip[];
  effects: FxCard[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState(initialBalance);
  const [ownedTpl, setOwnedTpl] = useState<Set<string>>(
    () => new Set(templates.filter((t) => t.owned).map((t) => t.id)),
  );
  const [ownedFx, setOwnedFx] = useState<Set<string>>(
    () => new Set(effects.filter((e) => e.owned).map((e) => e.id)),
  );
  const [currentTpl, setCurrentTpl] = useState<string | null>(
    () => templates.find((t) => t.current)?.id ?? null,
  );
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vue courante depuis l'URL (?view=templates|effects) — pushState natif,
  // synchronisé avec useSearchParams par le routeur Next, back/forward inclus.
  const viewParam = searchParams.get("view");
  const view: View = viewParam === "templates" || viewParam === "effects" ? viewParam : "home";
  const go = useCallback((v: View) => {
    window.history.pushState(null, "", v === "home" ? "/dashboard/marketplace" : `?view=${v}`);
    window.scrollTo({ top: 0 });
  }, []);

  // Tri / filtres des catalogues complets (état conservé entre les vues).
  const [tplFilter, setTplFilter] = useState("all");
  const [tplSort, setTplSort] = useState<TplSort>("reco");
  const [fxSort, setFxSort] = useState<FxSort>("featured");

  const isTplOwned = useCallback(
    (t: TplCard) => ownedTpl.has(t.id) || t.id === currentTpl,
    [ownedTpl, currentTpl],
  );

  // Position d'affichage par carte (CSS order) : l'ordre DOM reste stable pour
  // que trier/filtrer ne déplace aucun nœud — sinon les iframes rechargeraient.
  const tplOrder = useMemo(() => {
    let list = templates.filter((t) => tplFilter === "all" || t.categoryId === tplFilter);
    if (tplSort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (tplSort === "owned")
      list = [...list].sort((a, b) => Number(isTplOwned(b)) - Number(isTplOwned(a)));
    return new Map(list.map((t, i) => [t.id, i]));
  }, [templates, tplFilter, tplSort, isTplOwned]);

  const fxOrder = useMemo(() => {
    let list = effects;
    if (fxSort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (fxSort === "owned")
      list = [...list].sort((a, b) => Number(ownedFx.has(b.id)) - Number(ownedFx.has(a.id)));
    else if (fxSort === "compatible")
      list = [...list].sort((a, b) => Number(b.compatible) - Number(a.compatible));
    return new Map(list.map((e, i) => [e.id, i]));
  }, [effects, fxSort, ownedFx]);

  /** Achat (template ou effet) — le serveur fait autorité sur le prix. */
  const purchase = useCallback(
    async (itemType: "template" | "effect", id: string, name: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/marketplace/purchase", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemType, itemId: id }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setModal({ kind: "insufficient", needed: (json.needed ?? 0) - (json.balance ?? 0) });
          return;
        }
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Achat impossible pour le moment.");
          setModal(null);
          return;
        }
        setBalance(json.balance);
        if (itemType === "template") {
          setOwnedTpl((s) => new Set(s).add(id));
          setModal({ kind: "unlocked-template", id, name, siteId: json.newSiteId ?? null });
        } else {
          setOwnedFx((s) => new Set(s).add(id));
          const compatible = effects.find((e) => e.id === id)?.compatible ?? true;
          setModal({ kind: "licence", id, name, licenseCode: json.licenseCode, compatible });
        }
      } finally {
        setBusy(false);
      }
    },
    [effects],
  );

  /** Bascule vers un template possédé : switch rapide vers le site bibliothèque. */
  const applyTemplate = useCallback(
    async (id: string, name: string, siteIdHint?: string | null) => {
      setModal({ kind: "applying", name });
      setError(null);
      try {
        // Résoudre le siteId cible (passé en hint depuis l'achat, ou à retrouver).
        let targetSiteId = siteIdHint ?? null;
        if (!targetSiteId) {
          const find = await fetch(`/api/site/find-by-template?templateId=${encodeURIComponent(id)}`);
          const found = await find.json().catch(() => ({}));
          targetSiteId = found.siteId ?? null;
        }
        if (!targetSiteId) {
          setModal(null);
          setError("Site introuvable pour ce template.");
          return;
        }
        // Switcher vers ce site (sans sync : le site a son propre contenu).
        const res = await fetch("/api/site/switch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ targetSiteId, sync: false }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          setModal(null);
          setError(json.error ?? "Application impossible pour le moment.");
          return;
        }
        setCurrentTpl(id);
        router.push("/editor");
      } catch {
        setModal(null);
        setError("Application impossible pour le moment.");
      }
    },
    [router],
  );

  const integrate = useCallback(
    (id: string) => router.push(`/editor?integrate=${encodeURIComponent(id)}`),
    [router],
  );

  const tplCard = (t: TplCard) => {
    const owned = isTplOwned(t);
    const current = t.id === currentTpl;
    return (
      <div className="group relative h-full overflow-hidden rounded-[20px] border border-sky-300 bg-surface shadow-cloud-sm transition-transform duration-200 hover:-translate-y-0.5">
        {current && (
          <BorderBeam size={220} duration={7} borderWidth={2} colorFrom="#2563eb" colorTo="#22d3ee" />
        )}
        <div className="relative overflow-hidden border-b border-sky-200">
          <LazyMount>
            <SitePreview src={`/api/template-demo?id=${t.id}`} />
          </LazyMount>
          {t.recommended && !current && (
            <div className="absolute left-2.5 top-2.5">
              <Badge tone="brand">
                <IconStar4 size={11} /> Pour vous
              </Badge>
            </div>
          )}
          <div className="absolute right-2.5 top-2.5 flex gap-1.5">
            {current ? (
              <Badge tone="brand">Template actuel</Badge>
            ) : owned ? (
              <Badge tone="success">
                <IconCheck size={12} /> Possédé
              </Badge>
            ) : (
              <Badge tone="neutral">{templatePrice} crédits</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-archivo text-[15px] font-semibold text-night">{t.name}</h3>
          <p className="mt-0.5 text-[13px] text-mist">{t.style}</p>
          <div className="mt-3 flex items-center gap-2">
            {current ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mist">
                <IconCheck size={14} /> Appliqué à votre site
              </span>
            ) : owned ? (
              <button
                type="button"
                className={btnPrimary}
                disabled={!hasSite || busy}
                onClick={() => applyTemplate(t.id, t.name, null)}
              >
                Appliquer à mon site
              </button>
            ) : (
              <button
                type="button"
                className={btnSubtle}
                disabled={busy}
                onClick={() =>
                  setModal({
                    kind: "confirm",
                    itemType: "template",
                    id: t.id,
                    name: t.name,
                    price: templatePrice,
                  })
                }
              >
                <IconCredit size={15} /> Débloquer · {templatePrice} ✦
              </button>
            )}
            <a
              href={`/preview/${t.id}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-slate transition-colors hover:text-night"
            >
              Aperçu <IconExternal size={13} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  const fxCard = (e: FxCard) => {
    const owned = ownedFx.has(e.id);
    return (
      <div className="group relative h-full overflow-hidden rounded-[20px] border border-sky-300 bg-surface shadow-cloud-sm transition-transform duration-200 hover:-translate-y-0.5">
        <div className="relative overflow-hidden border-b border-sky-200">
          <LazyMount>
            <SitePreview src={`/api/fx-demo?id=${e.id}`} />
          </LazyMount>
          <div className="absolute right-2.5 top-2.5">
            {owned ? (
              <Badge tone="success">
                <IconCheck size={12} /> Possédé
              </Badge>
            ) : (
              <Badge tone="neutral">{effectPrice} crédits</Badge>
            )}
          </div>
          <div
            className="absolute left-0 top-0 h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${e.accent.from}, ${e.accent.to})` }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-archivo text-base font-semibold text-night">{e.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">{e.description}</p>
          {!e.compatible && (
            <p className="mt-1.5 text-xs font-medium text-mist">
              Bientôt disponible sur votre template actuel.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {owned ? (
              <button
                type="button"
                className={btnPrimary}
                disabled={!hasSite || !e.compatible || busy}
                onClick={() => integrate(e.id)}
                title={
                  e.compatible
                    ? "Choisir la section dans l'éditeur"
                    : "Indisponible sur votre template actuel"
                }
              >
                <IconStar4 size={14} /> Intégrer à mon site
              </button>
            ) : (
              <button
                type="button"
                className={btnSubtle}
                disabled={busy}
                onClick={() =>
                  setModal({
                    kind: "confirm",
                    itemType: "effect",
                    id: e.id,
                    name: e.name,
                    price: effectPrice,
                  })
                }
              >
                <IconCredit size={15} /> Débloquer · {effectPrice} ✦
              </button>
            )}
            <a
              href={`/api/fx-demo?id=${e.id}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-slate transition-colors hover:text-night"
            >
              Démo live <IconExternal size={13} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  /** Tuile de fin de rangée — même action que le bouton « Voir tout ». */
  const seeAllTile = (v: Exclude<View, "home">, count: number) => (
    <div className="shrink-0 snap-start self-stretch">
      <button
        type="button"
        onClick={() => go(v)}
        className="flex h-full w-[150px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-sky-300 bg-surface/60 px-4 text-sm font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full border border-sky-300 bg-surface">
          <IconChevron size={16} />
        </span>
        Voir tout ({count})
      </button>
    </div>
  );

  const seeAllBtn = (v: Exclude<View, "home">, count: number) => (
    <button
      type="button"
      onClick={() => go(v)}
      className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night"
    >
      Voir tout ({count}) <IconChevron size={14} />
    </button>
  );

  const backBtn = (
    <button
      type="button"
      onClick={() => go("home")}
      className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night"
    >
      <IconChevron size={14} className="rotate-180" /> Formules
    </button>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Formules"
          subtitle="Templates et effets premium, payables en crédits — à vous pour toujours."
        />
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue px-3.5 py-1.5 text-sm font-semibold text-brand">
            <IconCredit size={15} /> {balance} crédits
          </span>
          <Link href="/dashboard/credits" className={btnSubtle}>
            Recharger
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      {view === "home" && (
        <>
          {/* Rangée Templates — la catégorie du client d'abord */}
          <section>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-archivo text-lg font-semibold text-night">Templates</h2>
              <Badge tone="brand">{categoryLabel}</Badge>
              <div className="ml-auto">{seeAllBtn("templates", templates.length)}</div>
            </div>
            <p className="mb-4 text-sm text-slate">
              Les styles {categoryLabel} d'abord — faites défiler pour découvrir tous les univers.
            </p>
            <Carousel ariaLabel="Templates">
              {templates.map((t) => (
                <motion.div
                  key={t.id}
                  variants={fadeUp}
                  className="w-[290px] shrink-0 snap-start sm:w-[330px]"
                >
                  {tplCard(t)}
                </motion.div>
              ))}
              {seeAllTile("templates", templates.length)}
            </Carousel>
          </section>

          {/* Rangée Effets — le top du catalogue, défilable */}
          <section className="mt-10">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-archivo text-lg font-semibold text-night">Effets & composants</h2>
              <Badge tone="brand">
                <IconSpark size={12} /> Nouveau
              </Badge>
              <div className="ml-auto">{seeAllBtn("effects", effects.length)}</div>
            </div>
            <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-slate">
              Des animations premium à intégrer sur votre site : achetez un effet une fois (
              {effectPrice} crédits, licence liée à votre compte), puis demandez à l'IA de le
              placer exactement où vous voulez — l'intégration est incluse.
            </p>
            {effects.length === 0 ? (
              <GlassCard className="border border-sky-300 p-6 text-sm text-slate">
                Les premiers effets arrivent très bientôt.
              </GlassCard>
            ) : (
              <Carousel ariaLabel="Effets et composants">
                {effects.map((e) => (
                  <motion.div
                    key={e.id}
                    variants={fadeUp}
                    className="w-[290px] shrink-0 snap-start sm:w-[330px]"
                  >
                    {fxCard(e)}
                  </motion.div>
                ))}
                {seeAllTile("effects", effects.length)}
              </Carousel>
            )}
          </section>
        </>
      )}

      {view === "templates" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            {backBtn}
            <h2 className="font-archivo text-lg font-semibold text-night">Tous les templates</h2>
            <span className="text-sm font-medium text-mist">{tplOrder.size}</span>
            <label className="ml-auto inline-flex items-center gap-2 text-[13px] font-medium text-slate">
              Trier
              <select
                aria-label="Trier les templates"
                value={tplSort}
                onChange={(ev) => setTplSort(ev.target.value as TplSort)}
                className={selectCtl}
              >
                <option value="reco">Recommandés d'abord</option>
                <option value="name">Nom A → Z</option>
                <option value="owned">Possédés d'abord</option>
              </select>
            </label>
          </div>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {[{ id: "all", label: "Tous", count: templates.length }, ...categories].map((c) => {
              const active = tplFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTplFilter(c.id)}
                  className={
                    active
                      ? "rounded-full bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-cloud-sm"
                      : "rounded-full border border-sky-300 bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night"
                  }
                >
                  {c.label} <span className="opacity-65">{c.count}</span>
                </button>
              );
            })}
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {templates.map((t) => {
              const pos = tplOrder.get(t.id);
              return (
                <motion.div
                  key={t.id}
                  variants={fadeUp}
                  className={pos === undefined ? "hidden" : undefined}
                  style={pos === undefined ? undefined : { order: pos }}
                >
                  {tplCard(t)}
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {view === "effects" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            {backBtn}
            <h2 className="font-archivo text-lg font-semibold text-night">Tous les effets</h2>
            <span className="text-sm font-medium text-mist">{effects.length}</span>
            <label className="ml-auto inline-flex items-center gap-2 text-[13px] font-medium text-slate">
              Trier
              <select
                aria-label="Trier les effets"
                value={fxSort}
                onChange={(ev) => setFxSort(ev.target.value as FxSort)}
                className={selectCtl}
              >
                <option value="featured">En avant</option>
                <option value="name">Nom A → Z</option>
                <option value="owned">Possédés d'abord</option>
                <option value="compatible">Compatibles d'abord</option>
              </select>
            </label>
          </div>
          <p className="mb-5 max-w-[68ch] text-sm leading-relaxed text-slate">
            Achetez un effet une fois ({effectPrice} crédits, licence liée à votre compte), puis
            demandez à l'IA de le placer exactement où vous voulez — l'intégration est incluse.
          </p>
          {effects.length === 0 ? (
            <GlassCard className="border border-sky-300 p-6 text-sm text-slate">
              Les premiers effets arrivent très bientôt.
            </GlassCard>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {effects.map((e) => {
                const pos = fxOrder.get(e.id);
                return (
                  <motion.div
                    key={e.id}
                    variants={fadeUp}
                    className={pos === undefined ? "hidden" : undefined}
                    style={pos === undefined ? undefined : { order: pos }}
                  >
                    {fxCard(e)}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      )}

      {/* Modals */}
      {modal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-night/45 p-4 backdrop-blur-sm"
          onClick={() => modal.kind !== "applying" && setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-[24px] border border-sky-300 bg-surface p-6 shadow-cloud-sm"
            onClick={(ev) => ev.stopPropagation()}
          >
            {modal.kind === "confirm" && (
              <>
                <h3 className="font-archivo text-lg font-semibold text-night">
                  Débloquer « {modal.name} »
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {modal.price} crédits seront débités (solde après achat :{" "}
                  <span className="font-semibold text-night">{balance - modal.price}</span>).{" "}
                  {modal.itemType === "template"
                    ? "Le template est à vous pour toujours — vous pourrez l'appliquer et en changer gratuitement."
                    : "L'effet est à vous pour toujours, avec un code licence unique — intégration et repositionnement inclus."}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSubtle} onClick={() => setModal(null)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={busy}
                    onClick={() => purchase(modal.itemType, modal.id, modal.name)}
                  >
                    {busy ? <Spinner size={15} /> : <IconCredit size={15} />} Confirmer · {modal.price} ✦
                  </button>
                </div>
              </>
            )}

            {modal.kind === "unlocked-template" && (
              <>
                <Badge tone="success">
                  <IconCheck size={12} /> Template débloqué
                </Badge>
                <h3 className="mt-3 font-archivo text-lg font-semibold text-night">
                  « {modal.name} » est à vous
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  Appliquez-le maintenant : votre contenu (textes, photos) est automatiquement
                  reconstruit sur cette direction artistique. Vous pourrez revenir en arrière
                  gratuitement.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSubtle} onClick={() => setModal(null)}>
                    Plus tard
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={!hasSite}
                    onClick={() => applyTemplate(modal.id, modal.name, modal.kind === "unlocked-template" ? modal.siteId : null)}
                  >
                    Appliquer à mon site
                  </button>
                </div>
              </>
            )}

            {modal.kind === "licence" && (
              <>
                <Badge tone="success">
                  <IconCheck size={12} /> Effet débloqué
                </Badge>
                <h3 className="mt-3 font-archivo text-lg font-semibold text-night">
                  « {modal.name} » est à vous
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  Votre licence personnelle :
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="rounded-lg border border-sky-300 bg-blue px-3 py-1.5 font-mono text-sm font-semibold text-brand">
                    {modal.licenseCode}
                  </code>
                  <CopyButton text={modal.licenseCode} />
                </div>
                {!modal.compatible && (
                  <p className="mt-3 text-xs font-medium text-mist">
                    Cet effet sera intégrable dès que votre site utilisera un template compatible.
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSubtle} onClick={() => setModal(null)}>
                    Plus tard
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={!hasSite || !modal.compatible}
                    onClick={() => integrate(modal.id)}
                  >
                    <IconStar4 size={14} /> Intégrer à mon site
                  </button>
                </div>
              </>
            )}

            {modal.kind === "insufficient" && (
              <>
                <h3 className="font-archivo text-lg font-semibold text-night">Solde insuffisant</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  Il vous manque{" "}
                  <span className="font-semibold text-night">
                    {Math.max(1, modal.needed)} crédit{modal.needed > 1 ? "s" : ""}
                  </span>{" "}
                  pour cet achat. Rechargez votre solde pour continuer.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSubtle} onClick={() => setModal(null)}>
                    Annuler
                  </button>
                  <Link href="/dashboard/credits" className={btnPrimary}>
                    <IconCredit size={15} /> Recharger mes crédits
                  </Link>
                </div>
              </>
            )}

            {modal.kind === "applying" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Spinner size={26} />
                <h3 className="font-archivo text-lg font-semibold text-night">
                  Application de « {modal.name} »…
                </h3>
                <p className="max-w-[36ch] text-sm leading-relaxed text-slate">
                  Vos textes et photos sont reconstruits sur la nouvelle direction artistique.
                  Quelques secondes…
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
