"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Pencil,
} from "lucide-react";
import { EASE } from "@/lib/motion";
import { compressImages } from "@/lib/compress-image";
import {
  questionsFor,
  type OnboardingQuestion,
  type Intake,
} from "@/lib/onboarding-config";
import { templateMeta } from "@/lib/templates";

/** État renvoyé par les routes /api/onboarding/*. */
type ClientState = {
  siteId: string;
  token: string | null;
  categoryId: string;
  templateId: string;
  chosenTemplateId: string | null;
  candidateTemplateIds: string[];
  step: number;
  intake: Intake & { categoryId?: string };
};

type Phase = "loading" | "composer" | "reveal" | "paywall" | "error";

export default function OnboardingClient({ email }: { email: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<ClientState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Démarrage : reprend l'onboarding existant ou le crée depuis le brief landing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let brief = "";
      try {
        brief = sessionStorage.getItem("akyra_brief") ?? "";
      } catch {
        /* sessionStorage indispo */
      }
      try {
        const res = await fetch("/api/onboarding/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brief, categoryId: "photographe" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Démarrage impossible.");
        if (cancelled) return;
        try {
          sessionStorage.removeItem("akyra_brief");
        } catch {
          /* ignore */
        }
        setState(data as ClientState);
        setPhase((data.step ?? 0) >= 100 ? "paywall" : "composer");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Une erreur est survenue.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <Shell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[rgb(var(--m-accent))]" size={28} />
          <p className="text-[15px] text-[rgb(var(--m-muted))]">
            On prépare votre atelier…
          </p>
        </div>
      </Shell>
    );
  }

  if (phase === "error" || !state) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-[16px] font-semibold text-[rgb(var(--m-ink))]">
            La construction n&apos;a pas pu démarrer.
          </p>
          <p className="max-w-[40ch] text-[14px] text-[rgb(var(--m-muted))]">{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-[rgb(var(--m-line))] px-5 py-2.5 text-[14px] font-semibold text-[rgb(var(--m-ink))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
          >
            Revenir à l&apos;accueil
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "composer") {
    return (
      <Composer
        email={email}
        state={state}
        onReveal={() => setPhase("reveal")}
      />
    );
  }

  if (phase === "reveal") {
    return (
      <Reveal
        state={state}
        onBack={() => setPhase("composer")}
        onChosen={(s) => {
          setState(s);
          setPhase("paywall");
        }}
      />
    );
  }

  return <Paywall state={state} />;
}

/* ------------------------------------------------------------------ Shell */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
          Akyra
        </Link>
        <span className="text-[12.5px] text-[rgb(var(--m-faint))]">
          Brouillon enregistré automatiquement
        </span>
      </header>
      <main className="px-5 pb-16 md:px-10">{children}</main>
    </div>
  );
}

/* --------------------------------------------------------------- Composer */

function Composer({
  email,
  state,
  onReveal,
}: {
  email: string;
  state: ClientState;
  onReveal: () => void;
}) {
  const questions = useMemo(() => questionsFor(state.categoryId), [state.categoryId]);

  // Valeurs locales (optimistes) initialisées depuis l'intake serveur.
  const [intake, setIntake] = useState<Intake>(() => ({
    brand: state.intake.brand ?? "",
    eventTypes: state.intake.eventTypes ?? [],
    about: state.intake.about ?? "",
    techRider: state.intake.techRider ?? "",
    contactEmail: state.intake.contactEmail ?? email ?? "",
    hasWebsite: state.intake.hasWebsite ?? false,
    websiteUrl: state.intake.websiteUrl ?? "",
    photoUrls: state.intake.photoUrls ?? [],
  }));
  const intakeRef = useRef(intake);
  useEffect(() => {
    intakeRef.current = intake;
  }, [intake]);

  const [revealed, setRevealed] = useState(1);
  const [photoSlots, setPhotoSlots] = useState<number | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nombre de photos conseillé = slots du template recommandé.
  useEffect(() => {
    fetch(`/_templates/${state.templateId}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && typeof m.photoSlots === "number" && setPhotoSlots(m.photoSlots))
      .catch(() => {});
  }, [state.templateId]);

  const refreshPreview = useCallback(() => setPreviewNonce((n) => n + 1), []);

  // Sauvegarde debouncée des champs texte → puis rafraîchit l'aperçu live.
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      const patch = stripPhotos(intakeRef.current);
      try {
        await fetch("/api/onboarding/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ siteId: state.siteId, patch }),
        });
      } catch {
        /* best-effort */
      } finally {
        setSaving(false);
        refreshPreview();
      }
    }, 650);
  }, [state.siteId, refreshPreview]);

  const setField = useCallback(
    <K extends keyof Intake>(key: K, value: Intake[K]) => {
      setIntake((prev) => ({ ...prev, [key]: value }));
      scheduleSave();
    },
    [scheduleSave],
  );

  // Upload photos (compression client → route photos → refresh).
  const [uploading, setUploading] = useState(false);
  const onPhotos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        const compressed = await compressImages(files).catch(() => files);
        const fd = new FormData();
        fd.set("siteId", state.siteId);
        let total = 0;
        for (const f of compressed) {
          if (total + f.size > 4_000_000) break;
          total += f.size;
          fd.append("photo", f);
        }
        const res = await fetch("/api/onboarding/photos", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && Array.isArray(data.photoUrls)) {
          setIntake((prev) => ({ ...prev, photoUrls: data.photoUrls }));
          refreshPreview();
        }
      } finally {
        setUploading(false);
      }
    },
    [state.siteId, refreshPreview],
  );

  const visible = questions.slice(0, revealed);
  const answeredCount = countAnswered(questions, intake);
  const progress = Math.round((answeredCount / questions.length) * 100);
  const canReveal = Boolean(intake.brand && intake.brand.trim().length > 1);
  const allRevealed = revealed >= questions.length;

  const advance = () => setRevealed((r) => Math.min(r + 1, questions.length));

  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
          Akyra
        </Link>
        <span className="flex items-center gap-2 text-[12.5px] text-[rgb(var(--m-faint))]">
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Enregistrement…
            </>
          ) : (
            <>
              <Check size={13} /> Brouillon enregistré
            </>
          )}
        </span>
      </header>

      <div className="mx-auto grid max-w-[1320px] gap-8 px-5 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:px-10">
        {/* Colonne composer */}
        <div className="max-w-[560px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
            On construit ensemble
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[36px]">
            Répondez simplement aux questions.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--m-muted))]">
            Tout reste modifiable ensuite. Votre site se construit en direct, à
            droite, au fur et à mesure de vos réponses.
          </p>

          {/* Progression */}
          <div className="mt-6">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--m-overlay)/0.07)]">
              <motion.div
                className="h-full rounded-full bg-[rgb(var(--m-accent))]"
                animate={{ width: `${Math.max(8, progress)}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
          </div>

          {/* Cartes-questions */}
          <div className="mt-8 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {visible.map((q, i) => (
                <motion.div
                  key={q.key}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <QuestionCard
                    q={q}
                    intake={intake}
                    photoSlots={photoSlots}
                    uploading={uploading}
                    onText={(v) => setField(q.key as keyof Intake, v as never)}
                    onToggleEvent={(val) => {
                      const cur = intake.eventTypes ?? [];
                      const next = cur.includes(val)
                        ? cur.filter((x) => x !== val)
                        : [...cur, val];
                      setField("eventTypes", next);
                    }}
                    onPhotos={onPhotos}
                    onHasWebsite={(b) => setField("hasWebsite", b)}
                    isLast={i === questions.length - 1}
                    showAdvance={i === revealed - 1 && !allRevealed}
                    onAdvance={advance}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* CTA reveal */}
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-8"
            >
              <button
                disabled={!canReveal}
                onClick={() => {
                  // flush la dernière sauvegarde avant de figer le contenu
                  if (saveTimer.current) clearTimeout(saveTimer.current);
                  fetch("/api/onboarding/save", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ siteId: state.siteId, patch: stripPhotos(intakeRef.current) }),
                  }).finally(onReveal);
                }}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-6 py-4 text-[15px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Sparkles size={16} />
                Découvrir mes 3 directions artistiques
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              {!canReveal && (
                <p className="mt-2 text-center text-[12.5px] text-[rgb(var(--m-faint))]">
                  Indiquez au moins le nom de votre marque pour continuer.
                </p>
              )}
            </motion.div>
          )}
          <p className="mt-6 text-[12px] text-[rgb(var(--m-faint))]">
            Vous ne payez qu&apos;à la fin, une fois votre site choisi.
          </p>
        </div>

        {/* Aperçu live */}
        <div className="md:sticky md:top-6 md:self-start">
          <LivePreview
            src={`/api/onboarding/preview?siteId=${state.siteId}&v=${previewNonce}`}
            label="Aperçu en direct"
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- QuestionCard */

function QuestionCard({
  q,
  intake,
  photoSlots,
  uploading,
  onText,
  onToggleEvent,
  onPhotos,
  onHasWebsite,
  isLast,
  showAdvance,
  onAdvance,
}: {
  q: OnboardingQuestion;
  intake: Intake;
  photoSlots: number | null;
  uploading: boolean;
  onText: (v: string) => void;
  onToggleEvent: (val: string) => void;
  onPhotos: (files: File[]) => void;
  onHasWebsite: (b: boolean) => void;
  isLast: boolean;
  showAdvance: boolean;
  onAdvance: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const value = (intake as Record<string, unknown>)[q.key];

  return (
    <div className="rounded-[22px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)]">
      <label className="block text-[15px] font-semibold text-[rgb(var(--m-ink))]">
        {q.label}
      </label>
      {q.help && (
        <p className="mt-1 text-[13px] leading-relaxed text-[rgb(var(--m-muted))]">{q.help}</p>
      )}

      <div className="mt-3">
        {q.kind === "text" && (
          <input
            value={String(value ?? "")}
            onChange={(e) => onText(e.target.value)}
            placeholder={q.placeholder}
            className="h-11 w-full rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] px-4 text-[15px] outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
          />
        )}

        {q.kind === "textarea" && (
          <textarea
            value={String(value ?? "")}
            onChange={(e) => onText(e.target.value)}
            placeholder={q.placeholder}
            rows={3}
            className="w-full resize-none rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
          />
        )}

        {q.kind === "multiselect" && (
          <div className="flex flex-wrap gap-2">
            {(q.options ?? []).map((opt) => {
              const active = (intake.eventTypes ?? []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onToggleEvent(opt.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "border-transparent bg-[rgb(var(--m-ink))] text-[rgb(var(--m-page))]"
                      : "border-[rgb(var(--m-line))] text-[rgb(var(--m-ink))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
                  }`}
                >
                  {active && <Check size={12} className="mr-1 inline" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {q.kind === "photos" && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onPhotos(Array.from(e.target.files ?? []))}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] px-4 py-7 text-center transition-colors hover:border-[rgb(var(--m-accent)/0.5)] hover:bg-[rgb(var(--m-overlay)/0.03)]"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-[rgb(var(--m-accent))]" />
              ) : (
                <ImagePlus size={20} className="text-[rgb(var(--m-muted))]" />
              )}
              <span className="text-[14px] font-medium text-[rgb(var(--m-ink))]">
                {(intake.photoUrls?.length ?? 0) > 0
                  ? `${intake.photoUrls?.length} photo${(intake.photoUrls?.length ?? 0) > 1 ? "s" : ""} déposée${(intake.photoUrls?.length ?? 0) > 1 ? "s" : ""} · ajouter`
                  : "Glissez vos photos ou cliquez"}
              </span>
              {photoSlots != null && (
                <span className="text-[12px] text-[rgb(var(--m-faint))]">
                  Idéalement {photoSlots} photos — vous pourrez en ajouter plus tard.
                </span>
              )}
            </button>
          </div>
        )}

        {q.kind === "website" && (
          <div>
            <div className="flex gap-2">
              {[
                { b: true, l: "Oui" },
                { b: false, l: "Pas encore" },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => onHasWebsite(o.b)}
                  className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
                    intake.hasWebsite === o.b
                      ? "border-transparent bg-[rgb(var(--m-ink))] text-[rgb(var(--m-page))]"
                      : "border-[rgb(var(--m-line))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            {intake.hasWebsite && (
              <input
                value={String(intake.websiteUrl ?? "")}
                onChange={(e) => onText(e.target.value)}
                placeholder={q.placeholder}
                className="mt-3 h-11 w-full rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] px-4 text-[15px] outline-none focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
              />
            )}
          </div>
        )}
      </div>

      {showAdvance && (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[rgb(var(--m-accent))] transition-opacity hover:opacity-80"
        >
          {isLast ? "Terminer" : "Continuer"}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ LivePreview */

function LivePreview({ src, label }: { src: string; label: string }) {
  // « chargé » = la source courante a fini de charger (pas d'effet, pas de cascade).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--m-line))] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
        </span>
        <span className="ml-1 text-[12px] font-medium text-[rgb(var(--m-faint))]">{label}</span>
      </div>
      <div className="relative h-[68vh] min-h-[460px]">
        <AnimatePresence>
          {!loaded && (
            <motion.div
              key="shimmer"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--m-surface))]"
            >
              <Loader2 size={22} className="animate-spin text-[rgb(var(--m-accent))]" />
            </motion.div>
          )}
        </AnimatePresence>
        <iframe
          key={src}
          src={src}
          title={label}
          onLoad={() => setLoadedSrc(src)}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Reveal */

function Reveal({
  state,
  onBack,
  onChosen,
}: {
  state: ClientState;
  onBack: () => void;
  onChosen: (s: ClientState) => void;
}) {
  const [choosing, setChoosing] = useState<string | null>(null);

  async function choose(templateId: string) {
    setChoosing(templateId);
    try {
      const res = await fetch("/api/onboarding/choose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId: state.siteId, templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Choix impossible.");
      onChosen({
        ...state,
        chosenTemplateId: templateId,
        templateId,
        token: data.token ?? state.token,
        step: 100,
      });
    } catch {
      setChoosing(null);
    }
  }

  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
          Akyra
        </Link>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
        >
          <Pencil size={14} /> Modifier mes réponses
        </button>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 pb-20 md:px-10">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
            Votre contenu, trois directions
          </p>
          <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] md:text-[38px]">
            Choisissez le style qui vous ressemble.
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] text-[rgb(var(--m-muted))]">
            Mêmes infos, mêmes photos — trois identités visuelles. Cliquez sur
            celle que vous préférez.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {state.candidateTemplateIds.map((tid, i) => {
            const meta = templateMeta(tid);
            const busy = choosing === tid;
            return (
              <motion.div
                key={tid}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
                className="overflow-hidden rounded-[24px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_24px_70px_-40px_rgba(0,0,0,0.4)]"
              >
                <div className="relative h-[420px] overflow-hidden bg-[rgb(var(--m-elevated))]">
                  <iframe
                    src={`/api/onboarding/preview?siteId=${state.siteId}&template=${tid}`}
                    title={meta.name}
                    className="pointer-events-none h-[840px] w-[200%] origin-top-left scale-50 border-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-[15px] font-semibold">{meta.name}</p>
                    <p className="text-[12.5px] text-[rgb(var(--m-faint))]">{meta.style}</p>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => choose(tid)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--m-ink))] px-4 py-2.5 text-[13.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Choisir
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Paywall */

function Paywall({ state }: { state: ClientState }) {
  const meta = templateMeta(state.chosenTemplateId ?? state.templateId);
  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="px-5 py-4 md:px-10">
        <Link href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
          Akyra
        </Link>
      </header>

      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <div className="order-2 overflow-hidden rounded-[26px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.4)] md:order-1">
          <div className="relative h-[62vh] min-h-[460px]">
            <iframe
              src={`/api/onboarding/preview?siteId=${state.siteId}`}
              title="Votre site"
              className="h-full w-full border-0"
            />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--m-accent))]">
            <Check size={13} /> Votre site est prêt
          </span>
          <h1 className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[40px]">
            Il ne reste qu&apos;à le publier.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--m-muted))]">
            Direction artistique « {meta.name} ». Mise en ligne immédiate, votre
            adresse incluse, modifiable à volonté.
          </p>

          <ul className="mt-6 flex flex-col gap-2.5 text-[14.5px]">
            {[
              "Hébergement & nom de domaine inclus",
              "Modifiable quand vous voulez",
              "Tout compris, moins de 5 €/mois",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[rgb(var(--m-ink))]">
                <Check size={16} className="text-[rgb(var(--m-accent))]" />
                {t}
              </li>
            ))}
          </ul>

          <form method="post" action="/api/checkout" className="mt-7">
            <input type="hidden" name="token" value={state.token ?? ""} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-6 py-4 text-[15px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
            >
              Publier mon site — 50 €
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-3 text-center text-[12px] text-[rgb(var(--m-faint))]">
            Paiement sécurisé · sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- utils */

function countAnswered(questions: OnboardingQuestion[], intake: Intake): number {
  return questions.reduce((n, q) => {
    const v = (intake as Record<string, unknown>)[q.key];
    if (q.kind === "multiselect") return n + ((intake.eventTypes?.length ?? 0) > 0 ? 1 : 0);
    if (q.kind === "photos") return n + ((intake.photoUrls?.length ?? 0) > 0 ? 1 : 0);
    if (q.kind === "website") return n + (intake.hasWebsite != null ? 1 : 0);
    return n + (typeof v === "string" && v.trim() ? 1 : 0);
  }, 0);
}

function stripPhotos(intake: Intake): Partial<Intake> {
  const rest: Partial<Intake> = { ...intake };
  delete rest.photoUrls;
  return rest;
}
