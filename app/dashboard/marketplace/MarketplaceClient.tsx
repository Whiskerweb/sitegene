"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
};

type FxCard = {
  id: string;
  name: string;
  description: string;
  owned: boolean;
  compatible: boolean;
  accent: { from: string; to: string };
};

type Modal =
  | { kind: "confirm"; itemType: "template" | "effect"; id: string; name: string; price: number }
  | { kind: "unlocked-template"; id: string; name: string }
  | { kind: "licence"; id: string; name: string; licenseCode: string; compatible: boolean }
  | { kind: "insufficient"; needed: number }
  | { kind: "applying"; name: string }
  | null;

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-cloud-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const btnSubtle =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate transition-colors hover:bg-sky-100 hover:text-night disabled:pointer-events-none disabled:opacity-50";

export function MarketplaceClient({
  hasSite,
  balance: initialBalance,
  categoryLabel,
  templatePrice,
  effectPrice,
  recommended,
  others,
  effects,
}: {
  hasSite: boolean;
  balance: number;
  categoryLabel: string;
  templatePrice: number;
  effectPrice: number;
  recommended: TplCard[];
  others: TplCard[];
  effects: FxCard[];
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [ownedTpl, setOwnedTpl] = useState<Set<string>>(
    () => new Set(recommended.concat(others).filter((t) => t.owned).map((t) => t.id)),
  );
  const [ownedFx, setOwnedFx] = useState<Set<string>>(
    () => new Set(effects.filter((e) => e.owned).map((e) => e.id)),
  );
  const [currentTpl, setCurrentTpl] = useState<string | null>(
    () => recommended.concat(others).find((t) => t.current)?.id ?? null,
  );
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fxName = useMemo(() => new Map(effects.map((e) => [e.id, e.name])), [effects]);

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
          setModal({ kind: "unlocked-template", id, name });
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

  /** Bascule gratuite vers un template possédé (reconstruction du contenu). */
  const applyTemplate = useCallback(
    async (id: string, name: string) => {
      setModal({ kind: "applying", name });
      setError(null);
      try {
        const res = await fetch("/api/site/template", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ templateId: id }),
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

  const renderTplCard = (t: TplCard, large: boolean) => {
    const owned = ownedTpl.has(t.id) || t.id === currentTpl;
    const current = t.id === currentTpl;
    return (
      <motion.div key={t.id} variants={fadeUp}>
        <div className="group relative h-full overflow-hidden rounded-[20px] border border-sky-300 bg-surface shadow-cloud-sm transition-transform duration-200 hover:-translate-y-0.5">
          {current && (
            <BorderBeam size={220} duration={7} borderWidth={2} colorFrom="#2563eb" colorTo="#22d3ee" />
          )}
          <div className="relative overflow-hidden border-b border-sky-200">
            <SitePreview src={`/api/template-demo?id=${t.id}`} />
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
          <div className={large ? "p-4" : "p-3"}>
            <h3 className={`font-archivo font-semibold text-night ${large ? "text-base" : "text-[15px]"}`}>
              {t.name}
            </h3>
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
                  onClick={() => applyTemplate(t.id, t.name)}
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
      </motion.div>
    );
  };

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

      {/* Templates — la catégorie du client d'abord */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-archivo text-lg font-semibold text-night">
            Templates · Recommandés pour vous
          </h2>
          <Badge tone="brand">{categoryLabel}</Badge>
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {recommended.map((t) => renderTplCard(t, true))}
        </motion.div>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-archivo text-lg font-semibold text-night">Autres styles</h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {others.map((t) => renderTplCard(t, false))}
          </motion.div>
        </section>
      )}

      {/* Effets */}
      <section className="mt-12">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-archivo text-lg font-semibold text-night">Effets & composants</h2>
          <Badge tone="brand">
            <IconSpark size={12} /> Nouveau
          </Badge>
        </div>
        <p className="mb-4 max-w-[68ch] text-sm leading-relaxed text-slate">
          Des animations premium à intégrer sur votre site : achetez un effet une fois ({effectPrice}{" "}
          crédits, licence liée à votre compte), puis demandez à l'IA de le placer exactement où
          vous voulez — l'intégration est incluse.
        </p>
        {effects.length === 0 ? (
          <GlassCard className="border border-sky-300 p-6 text-sm text-slate">
            Les premiers effets arrivent très bientôt.
          </GlassCard>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {effects.map((e) => {
              const owned = ownedFx.has(e.id);
              return (
                <motion.div key={e.id} variants={fadeUp}>
                  <div className="group relative h-full overflow-hidden rounded-[20px] border border-sky-300 bg-surface shadow-cloud-sm transition-transform duration-200 hover:-translate-y-0.5">
                    <div className="relative overflow-hidden border-b border-sky-200">
                      <SitePreview src={`/api/fx-demo?id=${e.id}`} />
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
                        style={{
                          background: `linear-gradient(90deg, ${e.accent.from}, ${e.accent.to})`,
                        }}
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
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

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
                    onClick={() => applyTemplate(modal.id, modal.name)}
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
