"use client";

/**
 * Onboarding v3 — une CONVERSATION, pas un questionnaire.
 *
 * Le client parle à « Akyra » : une seule bulle de question (qui change en
 * place, jamais d'empilement), des accusés de réception scriptés, puis l'IA
 * recommande UN style (aperçu de démonstration, clairement signalé), un écran
 * de construction théâtralisé pendant que le serveur fige + enrichit le
 * contenu, et enfin SON site fini — ajustable gratuitement par prompt avant
 * le paiement.
 *
 * Phases : conversation → recommend → catalog → building → result → paywall.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Maximize2,
  Monitor,
  Pencil,
  Smartphone,
  Sparkles,
  Tablet,
  Wand2,
} from "lucide-react";
import { EASE } from "@/lib/motion";
import { compressImages } from "@/lib/compress-image";
import {
  questionsFor,
  recommendTemplateForIntake,
  type OnboardingQuestion,
  type Intake,
} from "@/lib/onboarding-config";
import { detectCategory } from "@/lib/category-detect";
import { ACTIVE_CATEGORIES, getCategory } from "@/lib/categories";
import { isSpaTemplate, templateMeta, TEMPLATE_IDS } from "@/lib/templates";
import { AkyraMark } from "@/components/ui/Logo";
import {
  INTRO_LINE,
  ackFor,
  leadInFor,
  metierConfirmLine,
  metierSwitchLine,
  metierAckLine,
  METIER_ASK_LINE,
  FINDING_STYLE_LINES,
  RECOMMEND_LINE,
  BUILD_STEPS,
  BUILD_SUBLINES,
  RESULT_LINE,
} from "./conversation";

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

type Phase =
  | "loading"
  | "conversation"
  | "recommend"
  | "catalog"
  | "building"
  | "result"
  | "paywall"
  | "error";

/** Aperçu DÉMO d'un template (jamais personnalisé — signalé dans l'UI). */
function demoSrc(tid: string): string {
  return isSpaTemplate(tid) ? `/s/${tid}` : `/_templates/${tid}/index.html`;
}

function stripPhotos(intake: Intake): Partial<Intake> {
  const rest: Partial<Intake> = { ...intake };
  delete rest.photoUrls;
  return rest;
}

export default function OnboardingClient({ email }: { email: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<ClientState | null>(null);
  const [intake, setIntake] = useState<Intake>({});
  const [buildTid, setBuildTid] = useState<string | null>(null);
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
        // [2.1] Pas de catégorie imposée : le serveur détecte le métier
        // depuis le brief (et la conversation confirme si c'est ambigu).
        const res = await fetch("/api/onboarding/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brief }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Démarrage impossible.");
        if (cancelled) return;
        try {
          sessionStorage.removeItem("akyra_brief");
        } catch {
          /* ignore */
        }
        const s = data as ClientState;
        setState(s);
        setIntake({
          brief: s.intake.brief ?? "",
          categoryId: s.intake.categoryId ?? s.categoryId,
          categoryConfirmed: s.intake.categoryConfirmed,
          brand: s.intake.brand ?? "",
          eventTypes: s.intake.eventTypes ?? [],
          about: s.intake.about ?? "",
          techRider: s.intake.techRider ?? "",
          contactEmail: s.intake.contactEmail ?? email ?? "",
          hasWebsite: s.intake.hasWebsite ?? undefined,
          websiteUrl: s.intake.websiteUrl ?? "",
          photoUrls: s.intake.photoUrls ?? [],
        });
        // Reprise : un choix déjà figé → directement le site fini.
        setPhase((s.step ?? 0) >= 100 ? "result" : "conversation");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Une erreur est survenue.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  // [2.2/2.3] Changement de métier (confirmation ou re-détection en cours de
  // conversation) : questions, recommandation et candidats suivent aussitôt.
  const changeCategory = useCallback((categoryId: string) => {
    const cat = getCategory(categoryId);
    if (!cat) return;
    setState((s) =>
      s
        ? {
            ...s,
            categoryId: cat.id,
            templateId: cat.defaultTemplateId,
            candidateTemplateIds: cat.templateIds,
          }
        : s,
    );
    setIntake((prev) => ({ ...prev, categoryId: cat.id, categoryConfirmed: true }));
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

  if (phase === "conversation") {
    return (
      <Conversation
        state={state}
        intake={intake}
        setIntake={setIntake}
        onCategory={changeCategory}
        onDone={() => setPhase("recommend")}
      />
    );
  }

  if (phase === "recommend") {
    return (
      <Recommend
        intake={intake}
        fallbackTid={state.templateId}
        onPick={(tid) => {
          setBuildTid(tid);
          setPhase("building");
        }}
        onCatalog={() => setPhase("catalog")}
      />
    );
  }

  if (phase === "catalog") {
    return (
      <Catalog
        state={state}
        onPick={(tid) => {
          setBuildTid(tid);
          setPhase("building");
        }}
        onBack={() => setPhase(state.chosenTemplateId ? "result" : "recommend")}
      />
    );
  }

  if (phase === "building" && buildTid) {
    return (
      <Building
        siteId={state.siteId}
        templateId={buildTid}
        onDone={(token) => {
          setState({
            ...state,
            token: token ?? state.token,
            templateId: buildTid,
            chosenTemplateId: buildTid,
            step: 100,
          });
          setPhase("result");
        }}
      />
    );
  }

  if (phase === "result") {
    return (
      <ResultView
        state={state}
        onPay={() => setPhase("paywall")}
        onCatalog={() => setPhase("catalog")}
      />
    );
  }

  return <Paywall state={state} onBack={() => setPhase("result")} />;
}

/* ------------------------------------------------------------------ Shell */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
          <AkyraMark size={22} /> Akyra
        </Link>
      </header>
      <main className="px-5 pb-16 md:px-10">{children}</main>
    </div>
  );
}

/* ----------------------------------------------------- Briques de dialogue */

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Akyra écrit…">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--m-faint))]"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2.5, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** Avatar d'Akyra (pastille lumineuse + logo). */
function BotAvatar() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_4px_14px_-6px_rgba(37,99,235,0.45)]">
      <AkyraMark size={18} />
    </span>
  );
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="max-w-[56ch] rounded-[20px] rounded-tl-[6px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-4 shadow-[0_10px_36px_-24px_rgba(0,0,0,0.35)]">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[48ch] rounded-[20px] rounded-br-[6px] bg-[rgb(var(--m-ink))] px-4 py-2.5 text-[14px] font-medium text-[rgb(var(--m-page))]">
        {text}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Conversation */

function answeredLabel(q: OnboardingQuestion, intake: Intake): string {
  if (q.kind === "multiselect") {
    const opts = q.options ?? [];
    const labels = (intake.eventTypes ?? []).map(
      (v) => opts.find((o) => o.value === v)?.label ?? v,
    );
    return labels.join(" · ");
  }
  if (q.kind === "photos") {
    const n = intake.photoUrls?.length ?? 0;
    return n > 0 ? `${n} photo${n > 1 ? "s" : ""} envoyée${n > 1 ? "s" : ""} 📸` : "";
  }
  if (q.kind === "website") {
    if (intake.hasWebsite === false) return "Pas encore de site";
    return intake.websiteUrl ? intake.websiteUrl : intake.hasWebsite ? "Oui" : "";
  }
  const v = (intake as Record<string, unknown>)[q.key];
  return typeof v === "string" ? v : "";
}

function isAnswered(q: OnboardingQuestion, intake: Intake): boolean {
  if (q.kind === "multiselect") return (intake.eventTypes?.length ?? 0) > 0;
  if (q.kind === "photos") return (intake.photoUrls?.length ?? 0) > 0;
  if (q.kind === "website") return intake.hasWebsite != null;
  const v = (intake as Record<string, unknown>)[q.key];
  return typeof v === "string" && v.trim().length > 0;
}

/** Un message du fil de conversation (persistant — rien ne s'efface). */
type FeedMsg = {
  id: string;
  role: "bot" | "user";
  text: string;
  lead?: string | null;
  help?: string;
  /** Accusé de réception : bulle plus discrète. */
  muted?: boolean;
};

function Conversation({
  state,
  intake,
  setIntake,
  onCategory,
  onDone,
}: {
  state: ClientState;
  intake: Intake;
  setIntake: React.Dispatch<React.SetStateAction<Intake>>;
  onCategory: (categoryId: string) => void;
  onDone: () => void;
}) {
  // [2.2] Métier pas encore confirmé (détection ambiguë ou absente au start) :
  // la conversation OUVRE sur la confirmation — jamais de routage silencieux.
  const [stage, setStage] = useState<"metier" | "questions">(
    intake.categoryConfirmed === false ? "metier" : "questions",
  );
  // Meilleure hypothèse au démarrage (depuis le brief), pour formuler la question.
  const metierGuess = useMemo(
    () => (intake.brief ? detectCategory(intake.brief).categoryId : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // [2.3] Re-détection en cours de conversation : catégorie en attente de
  // confirmation (« vous semblez plutôt être musicien, c'est bien ça ? »).
  const [pendingCat, setPendingCat] = useState<string | null>(null);

  const questions = useMemo(() => questionsFor(state.categoryId), [state.categoryId]);
  // Reprise : on retombe sur la première question sans réponse.
  const firstIdx = useMemo(() => {
    const i = questions.findIndex((q) => !isAnswered(q, intake));
    return i < 0 ? questions.length - 1 : i;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);
  const [idx, setIdx] = useState(firstIdx);
  // « Question précédente » repose la même question plus bas dans le fil.
  const [askSeq, setAskSeq] = useState(0);
  const [typing, setTyping] = useState(true);
  const [inputOpen, setInputOpen] = useState(false);
  // Le FIL : l'historique reconstruit (reprise) + tout ce qui se dit ensuite.
  const [messages, setMessages] = useState<FeedMsg[]>(() => {
    const out: FeedMsg[] = [];
    if (intake.categoryConfirmed !== false) {
      for (let i = 0; i < firstIdx; i++) {
        const q = questions[i];
        out.push({ id: `hist-q-${i}`, role: "bot", text: q.label, help: q.help });
        const a = answeredLabel(q, intake);
        out.push({ id: `hist-a-${i}`, role: "user", text: a || "Je passe pour l'instant" });
      }
    }
    return out;
  });
  const intakeRef = useRef(intake);
  useEffect(() => {
    intakeRef.current = intake;
  }, [intake]);

  // Défilement auto vers le bas à chaque nouveau message.
  const feedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, inputOpen]);

  // [2.2] Étape métier : Akyra confirme (détection ambiguë) ou demande le métier.
  useEffect(() => {
    if (stage !== "metier") return;
    const guessLabel = metierGuess ? getCategory(metierGuess)?.label : null;
    const t = window.setTimeout(() => {
      setMessages((cur) => {
        if (cur.some((m) => m.id === "metier-q")) return cur;
        const next = [...cur];
        if (!cur.some((m) => m.id === "intro")) {
          next.push({ id: "intro", role: "bot", text: INTRO_LINE });
        }
        next.push({
          id: "metier-q",
          role: "bot",
          text: guessLabel ? metierConfirmLine(guessLabel) : METIER_ASK_LINE,
          help: guessLabel
            ? "Un clic suffit — ou corrigez-moi, c'est votre métier qui guide le site."
            : undefined,
        });
        return next;
      });
      setTyping(false);
      setInputOpen(true);
    }, 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Akyra pose la question courante : « écrit… » puis la bulle, puis la saisie.
  // Idempotent par identifiant (StrictMode rejoue les effets en dev).
  useEffect(() => {
    if (stage !== "questions") return;
    const q = questions[idx];
    const lead = leadInFor(idx, questions.length);
    const t = window.setTimeout(
      () => {
        setMessages((cur) => {
          const qid = `q-${idx}-${askSeq}`;
          if (cur.some((m) => m.id === qid)) return cur;
          const next = [...cur];
          if (idx === 0 && !cur.some((m) => m.id === "intro")) {
            next.push({ id: "intro", role: "bot", text: INTRO_LINE });
          }
          next.push({ id: qid, role: "bot", text: q.label, help: q.help, lead });
          return next;
        });
        setTyping(false);
        setInputOpen(true);
      },
      messages.length === 0 ? 1100 : 850,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, askSeq, stage]);

  const q = questions[idx];
  const total = questions.length;
  const required = q.key === "brand";
  const canValidate = !required || isAnswered(q, intake);

  // [2.4] La sauvegarde n'est JAMAIS partielle : on n'écrit qu'à la validation
  // d'une question (« Continuer »/« Passer »), pas à la frappe.
  const persist = useCallback(
    (extra?: Partial<Intake>) => {
      void fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteId: state.siteId,
          patch: { ...stripPhotos(intakeRef.current), ...extra },
        }),
      }).catch((e) => console.error("[onboarding/save]", e));
    },
    [state.siteId],
  );

  // [2.2] Le client confirme (ou corrige) son métier — on route, on enregistre,
  // puis la conversation enchaîne sur les questions de SA catégorie.
  const pickMetier = useCallback(
    (categoryId: string, userText?: string, extra?: Partial<Intake>) => {
      const cat = getCategory(categoryId);
      if (!cat) return;
      setInputOpen(false);
      setTyping(true);
      setMessages((cur) => [
        ...cur,
        { id: "metier-a", role: "user", text: userText ?? cat.label },
      ]);
      onCategory(cat.id);
      persist({ categoryId: cat.id, categoryConfirmed: true, ...extra });
      window.setTimeout(() => {
        setMessages((cur) =>
          cur.some((m) => m.id === "metier-ack")
            ? cur
            : [
                ...cur,
                { id: "metier-ack", role: "bot", muted: true, text: metierAckLine(cat.label) },
              ],
        );
      }, 550);
      window.setTimeout(() => {
        // Les questions de la nouvelle catégorie partent de la 1re sans réponse.
        const qs = questionsFor(cat.id);
        const i = qs.findIndex((qq) => !isAnswered(qq, intakeRef.current));
        setIdx(i < 0 ? qs.length - 1 : i);
        setAskSeq((s) => s + 1);
        setStage("questions");
      }, 1300);
    },
    [onCategory, persist],
  );

  // [2.2] « Autre » : le client précise son métier en texte libre — on tente la
  // détection sur sa précision ; sinon, parcours portfolio (le plus générique)
  // en gardant la précision dans le brief pour l'IA.
  const pickOther = useCallback(
    (text: string) => {
      const det = detectCategory(text);
      const cid = det.categoryId ?? "portfolio";
      const newBrief = [intakeRef.current.brief, `Métier : ${text}`]
        .filter(Boolean)
        .join("\n");
      setIntake((prev) => ({ ...prev, brief: newBrief }));
      pickMetier(cid, text, { brief: newBrief });
    },
    [pickMetier, setIntake],
  );

  // [2.3] Bascule confirmée en cours de conversation (signal contradictoire).
  const resolvePending = useCallback(
    (accept: boolean) => {
      const cat = pendingCat ? getCategory(pendingCat) : null;
      setPendingCat(null);
      setInputOpen(false);
      setTyping(true);
      if (accept && cat) {
        setMessages((cur) => [
          ...cur,
          { id: `switch-a-${cat.id}`, role: "user", text: `Oui, je suis ${cat.label.toLowerCase()}` },
        ]);
        onCategory(cat.id);
        persist({ categoryId: cat.id, categoryConfirmed: true });
        window.setTimeout(() => {
          setMessages((cur) => [
            ...cur,
            { id: `switch-ack-${cat.id}`, role: "bot", muted: true, text: metierAckLine(cat.label) },
          ]);
        }, 550);
        window.setTimeout(() => {
          const qs = questionsFor(cat.id);
          const i = qs.findIndex((qq) => !isAnswered(qq, intakeRef.current));
          setIdx(i < 0 ? qs.length - 1 : i);
          setAskSeq((s) => s + 1);
        }, 1300);
      } else {
        setMessages((cur) => [
          ...cur,
          { id: `switch-no-${idx}-${askSeq}`, role: "user", text: "Non, on continue comme ça" },
        ]);
        window.setTimeout(() => {
          const last = idx >= total - 1;
          if (last) onDone();
          else setIdx((i) => Math.min(i + 1, total - 1));
        }, 900);
      }
    },
    [pendingCat, idx, askSeq, total, onCategory, persist, onDone],
  );

  const advance = useCallback(
    (skipped: boolean) => {
      persist();
      const label =
        (skipped ? "Je passe pour l'instant" : answeredLabel(q, intakeRef.current)) ||
        "C'est fait";
      const last = idx >= total - 1;
      setInputOpen(false);
      setTyping(true);
      setMessages((cur) => [
        ...cur,
        { id: `a-${idx}-${askSeq}`, role: "user", text: label },
      ]);

      // [2.3] Le signal de catégorie déclenche le routing, où qu'il apparaisse :
      // chaque réponse texte est analysée ; un signal FORT contradictoire ouvre
      // une confirmation (jamais de bascule silencieuse).
      if (!skipped && (q.kind === "text" || q.kind === "textarea")) {
        const FREE_TEXT_KEYS = ["brand", "about", "techRider", "brief"];
        if (FREE_TEXT_KEYS.includes(q.key)) {
          const det = detectCategory(label);
          if (det.confidence === "high" && det.categoryId && det.categoryId !== state.categoryId) {
            const detLabel = getCategory(det.categoryId)?.label ?? det.categoryId;
            setPendingCat(det.categoryId);
            window.setTimeout(() => {
              setMessages((cur) => [
                ...cur,
                {
                  id: `switch-q-${idx}-${askSeq}`,
                  role: "bot",
                  text: metierSwitchLine(detLabel),
                },
              ]);
              setTyping(false);
              setInputOpen(true);
            }, 800);
            return;
          }
        }
      }

      // L'accusé de réception arrive après un court « il écrit… », et RESTE.
      window.setTimeout(() => {
        setMessages((cur) => [
          ...cur,
          { id: `ack-${idx}-${askSeq}`, role: "bot", muted: true, text: ackFor(idx, skipped) },
        ]);
      }, 550);
      window.setTimeout(
        () => {
          if (last) onDone();
          else setIdx((i) => Math.min(i + 1, total - 1));
        },
        last ? 1700 : 1200,
      );
    },
    [idx, askSeq, total, q, persist, onDone, state.categoryId],
  );

  const setField = useCallback(
    <K extends keyof Intake>(key: K, value: Intake[K]) => {
      setIntake((prev) => ({ ...prev, [key]: value }));
    },
    [setIntake],
  );

  // [2.4] Upload photos : compression client puis envoi par lots ≤ 4 Mo,
  // SÉQUENTIELS (l'append serveur n'est pas transactionnel). On attend la
  // résolution de TOUS les envois avant de rendre la main, on logge chaque
  // échec et on le signale — plus aucune photo perdue en silence.
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const onPhotos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      setUploadError("");
      const failed: string[] = [];
      try {
        const compressed = await compressImages(files).catch((e) => {
          console.error("[onboarding/photos] compression:", e);
          return files;
        });

        // Lots ≤ 4 Mo (limite corps de requête) — une photo trop lourde même
        // compressée est signalée, jamais ignorée en silence.
        const batches: File[][] = [];
        let batch: File[] = [];
        let size = 0;
        for (const f of compressed) {
          if (f.size > 4_000_000) {
            failed.push(f.name);
            console.error(`[onboarding/photos] ${f.name} trop lourde (${f.size} octets)`);
            continue;
          }
          if (size + f.size > 4_000_000 && batch.length > 0) {
            batches.push(batch);
            batch = [];
            size = 0;
          }
          batch.push(f);
          size += f.size;
        }
        if (batch.length > 0) batches.push(batch);

        for (const b of batches) {
          const fd = new FormData();
          fd.set("siteId", state.siteId);
          for (const f of b) fd.append("photo", f);
          try {
            const res = await fetch("/api/onboarding/photos", { method: "POST", body: fd });
            const data = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(data.photoUrls)) {
              setIntake((prev) => ({ ...prev, photoUrls: data.photoUrls as string[] }));
              if ((data.added ?? b.length) < b.length) {
                failed.push(...b.slice(data.added ?? 0).map((f) => f.name));
              }
            } else {
              failed.push(...b.map((f) => f.name));
              console.error("[onboarding/photos] lot refusé:", data?.error ?? res.status);
            }
          } catch (e) {
            failed.push(...b.map((f) => f.name));
            console.error("[onboarding/photos] envoi:", e);
          }
        }
      } finally {
        if (failed.length > 0) {
          setUploadError(
            failed.length === 1
              ? `1 photo n'a pas pu être envoyée (${failed[0]}) — réessayez.`
              : `${failed.length} photos n'ont pas pu être envoyées — réessayez.`,
          );
        }
        setUploading(false);
      }
    },
    [state.siteId, setIntake],
  );

  return (
    <div className="akyra flex h-dvh flex-col bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex shrink-0 items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
          <AkyraMark size={22} /> Akyra
        </Link>
        <span className="text-[12.5px] font-medium tabular-nums text-[rgb(var(--m-faint))]">
          {stage === "metier" ? "Votre métier" : `${Math.min(idx + 1, total)} / ${total}`}
        </span>
      </header>

      {/* Fine barre de progression */}
      <div className="mx-5 h-[3px] shrink-0 overflow-hidden rounded-full bg-[rgb(var(--m-overlay)/0.06)] md:mx-10">
        <motion.div
          className="h-full rounded-full bg-[rgb(var(--m-accent))]"
          animate={{ width: stage === "metier" ? "2%" : `${Math.round((idx / total) * 100)}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      {/* LE FIL : tout reste affiché — questions, réponses, réactions d'Akyra. */}
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 px-5 py-8">
          {messages.map((m) =>
            m.role === "user" ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <UserBubble text={m.text} />
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <BotBubble>
                  {m.lead && (
                    <p className="mb-2 text-[13.5px] font-medium text-[rgb(var(--m-accent))]">
                      {m.lead}
                    </p>
                  )}
                  <p
                    className={
                      m.muted
                        ? "text-[14px] italic text-[rgb(var(--m-muted))]"
                        : "text-[16px] font-semibold leading-snug"
                    }
                  >
                    {m.text}
                  </p>
                  {m.help && (
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[rgb(var(--m-muted))]">
                      {m.help}
                    </p>
                  )}
                </BotBubble>
              </motion.div>
            ),
          )}

          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BotBubble>
                <TypingDots />
              </BotBubble>
            </motion.div>
          )}
        </div>
      </div>

      {/* Zone de réponse, ancrée en bas — le contenu change avec la question. */}
      <div className="shrink-0 border-t border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))]">
        <div className="mx-auto w-full max-w-[680px] px-5 py-4">
          <AnimatePresence mode="wait">
            {!inputOpen ? (
              <motion.p
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-3 text-center text-[12.5px] text-[rgb(var(--m-faint))]"
              >
                Akyra écrit…
              </motion.p>
            ) : stage === "metier" ? (
              /* [2.2] Confirmation/choix du métier — jamais de routage muet. */
              <motion.div
                key="input-metier"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <MetierPicker guess={metierGuess} onPick={pickMetier} onOther={pickOther} />
              </motion.div>
            ) : pendingCat ? (
              /* [2.3] Signal contradictoire : on confirme la bascule. */
              <motion.div
                key={`input-switch-${idx}-${askSeq}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  onClick={() => resolvePending(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-5 py-3 text-[14px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
                >
                  <Check size={14} />
                  Oui, je suis {(getCategory(pendingCat)?.label ?? "").toLowerCase()}
                </button>
                <button
                  type="button"
                  onClick={() => resolvePending(false)}
                  className="rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-3 text-[14px] font-medium text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
                >
                  Non, on continue comme ça
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`input-${idx}-${askSeq}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <AnswerControl
                  q={q}
                  intake={intake}
                  uploading={uploading}
                  uploadError={uploadError}
                  onText={(v) => setField(q.key as keyof Intake, v as never)}
                  onToggleEvent={(val) => {
                    const cur = intake.eventTypes ?? [];
                    setField(
                      "eventTypes",
                      cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val],
                    );
                  }}
                  onPhotos={onPhotos}
                  onHasWebsite={(b) => setField("hasWebsite", b)}
                  onEnter={() => canValidate && !uploading && advance(false)}
                />

                <div className="mt-3.5 flex items-center justify-between">
                  <div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputOpen(false);
                          setTyping(true);
                          setIdx((i) => Math.max(0, i - 1));
                          setAskSeq((s) => s + 1);
                        }}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[rgb(var(--m-faint))] transition-colors hover:text-[rgb(var(--m-ink))]"
                      >
                        <ArrowLeft size={13} /> Question précédente
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!required && !isAnswered(q, intake) && !uploading && (
                      <button
                        type="button"
                        onClick={() => advance(true)}
                        className="text-[13.5px] font-medium text-[rgb(var(--m-faint))] transition-colors hover:text-[rgb(var(--m-ink))]"
                      >
                        Passer
                      </button>
                    )}
                    {/* [2.4] On ne valide jamais pendant un upload en cours. */}
                    <button
                      type="button"
                      disabled={!canValidate || uploading}
                      onClick={() => advance(false)}
                      className="group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-6 py-3 text-[14.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        <>
                          {idx >= total - 1 ? "Préparer mon site" : "Continuer"}
                          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-3 text-center text-[11.5px] text-[rgb(var(--m-faint))]">
            Vos réponses sont enregistrées au fur et à mesure · vous ne payez qu&apos;à la fin.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ [2.2] MetierPicker */

/**
 * Choix/confirmation du métier : la meilleure hypothèse en premier (« Oui,
 * c'est ça »), les autres catégories en chips, et « Autre » en texte libre
 * (re-détecté ; repli portfolio avec la précision conservée pour l'IA).
 */
function MetierPicker({
  guess,
  onPick,
  onOther,
}: {
  guess: string | null;
  onPick: (categoryId: string) => void;
  onOther: (text: string) => void;
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [text, setText] = useState("");
  const guessCat = guess ? getCategory(guess) : undefined;
  const others = ACTIVE_CATEGORIES.filter((c) => c.id !== guessCat?.id);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {guessCat && (
          <button
            type="button"
            onClick={() => onPick(guessCat.id)}
            className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-5 py-3 text-[14px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
          >
            <Check size={14} />
            Oui, je suis {guessCat.label.toLowerCase()}
          </button>
        )}
        {others.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className="rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-3 text-[14px] font-medium text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOtherOpen((o) => !o)}
          className={`rounded-full border px-4 py-3 text-[14px] font-medium transition-colors ${
            otherOpen
              ? "border-[rgb(var(--m-accent)/0.5)] text-[rgb(var(--m-accent))]"
              : "border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-[rgb(var(--m-ink))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
          }`}
        >
          Autre…
        </button>
      </div>
      {otherOpen && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && text.trim().length >= 2 && onOther(text.trim())}
            placeholder="Dites-moi votre métier en quelques mots…"
            className="h-12 w-full rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 text-[15px] outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
          />
          <button
            type="button"
            disabled={text.trim().length < 2}
            onClick={() => onOther(text.trim())}
            className="shrink-0 rounded-2xl bg-[rgb(var(--m-ink))] px-5 text-[14px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- AnswerControl */

function AnswerControl({
  q,
  intake,
  uploading,
  uploadError,
  onText,
  onToggleEvent,
  onPhotos,
  onHasWebsite,
  onEnter,
}: {
  q: OnboardingQuestion;
  intake: Intake;
  uploading: boolean;
  uploadError?: string;
  onText: (v: string) => void;
  onToggleEvent: (val: string) => void;
  onPhotos: (files: File[]) => void;
  onHasWebsite: (b: boolean) => void;
  onEnter: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const value = (intake as Record<string, unknown>)[q.key];

  if (q.kind === "text") {
    return (
      <input
        autoFocus
        value={String(value ?? "")}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={q.placeholder}
        className="h-13 w-full rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-3.5 text-[16px] outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
      />
    );
  }

  if (q.kind === "textarea") {
    return (
      <textarea
        autoFocus
        value={String(value ?? "")}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && onEnter()}
        placeholder={q.placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-4 text-[15.5px] leading-relaxed outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
      />
    );
  }

  if (q.kind === "multiselect") {
    return (
      <div className="flex flex-wrap gap-2">
        {(q.options ?? []).map((opt) => {
          const active = (intake.eventTypes ?? []).includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggleEvent(opt.value)}
              className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-all ${
                active
                  ? "border-transparent bg-[rgb(var(--m-ink))] text-[rgb(var(--m-page))]"
                  : "border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-[rgb(var(--m-ink))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
              }`}
            >
              {active && <Check size={13} className="mr-1 inline" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.kind === "photos") {
    const n = intake.photoUrls?.length ?? 0;
    return (
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
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-8 transition-colors hover:border-[rgb(var(--m-accent)/0.45)] disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-[rgb(var(--m-accent))]" />
          ) : (
            <ImagePlus size={22} className="text-[rgb(var(--m-accent))]" />
          )}
          <span className="text-[14.5px] font-semibold">
            {n > 0 ? `${n} photo${n > 1 ? "s" : ""} reçue${n > 1 ? "s" : ""} — en ajouter` : "Déposer vos photos"}
          </span>
          <span className="text-[12.5px] text-[rgb(var(--m-faint))]">
            Elles habilleront chaque recoin de votre site. Vous pourrez en ajouter plus tard.
          </span>
        </button>
        {/* [2.4] Échec d'upload signalé, jamais silencieux. */}
        {uploadError && (
          <p className="mt-2 text-[13px] font-medium text-red-600">{uploadError}</p>
        )}
        {n > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {(intake.photoUrls ?? []).slice(0, 8).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={u}
                src={u}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // website
  return (
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
            className={`rounded-full border px-5 py-2 text-[14px] font-medium transition-colors ${
              intake.hasWebsite === o.b
                ? "border-transparent bg-[rgb(var(--m-ink))] text-[rgb(var(--m-page))]"
                : "border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] hover:bg-[rgb(var(--m-overlay)/0.04)]"
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
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          placeholder={q.placeholder}
          className="mt-3 h-12 w-full rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 text-[15px] outline-none focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))]"
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Recommend */

function Recommend({
  intake,
  fallbackTid,
  onPick,
  onCatalog,
}: {
  intake: Intake;
  fallbackTid: string;
  onPick: (tid: string) => void;
  onCatalog: () => void;
}) {
  const raw = recommendTemplateForIntake(intake, fallbackTid);
  const tid = (TEMPLATE_IDS as readonly string[]).includes(raw) ? raw : fallbackTid;
  const meta = templateMeta(tid);

  const [ready, setReady] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const swap = window.setTimeout(() => setLineIdx(1), 1400);
    const done = window.setTimeout(() => setReady(true), 2800);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(done);
    };
  }, []);

  if (!ready) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <AkyraMark size={44} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.p
              key={lineIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2.5 text-[15px] text-[rgb(var(--m-muted))]"
            >
              {FINDING_STYLE_LINES[lineIdx % FINDING_STYLE_LINES.length]}
              <TypingDots />
            </motion.p>
          </AnimatePresence>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[860px]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <BotBubble>
            <p className="text-[15.5px] leading-relaxed">{RECOMMEND_LINE}</p>
          </BotBubble>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
          className="mt-6 overflow-hidden rounded-[26px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.45)]"
        >
          <DemoFrame tid={tid} height={520} />
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[17px] font-semibold">{meta.name}</p>
              <p className="text-[13px] text-[rgb(var(--m-faint))]">{meta.style}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                onClick={onCatalog}
                className="rounded-full border border-[rgb(var(--m-line))] px-5 py-3 text-[14px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
              >
                Voir d&apos;autres styles
              </button>
              <button
                onClick={() => onPick(tid)}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-6 py-3 text-[14.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
              >
                <Sparkles size={15} />
                J&apos;adore, on part là-dessus
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.div>

        <p className="mt-3 text-center text-[12px] text-[rgb(var(--m-faint))]">
          Aperçu de démonstration — vos textes et vos photos seront appliqués juste après votre choix.
        </p>
      </div>
    </Shell>
  );
}

/* ----------------------------------------------------------------- Catalog */

function Catalog({
  state,
  onPick,
  onBack,
}: {
  state: ClientState;
  onPick: (tid: string) => void;
  onBack: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(6);
  const others = TEMPLATE_IDS.filter((t) => !state.candidateTemplateIds.includes(t));
  const [othersCount, setOthersCount] = useState(0);

  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
          <AkyraMark size={22} /> Akyra
        </Link>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
        >
          <ArrowLeft size={14} /> Retour
        </button>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 pb-20 md:px-10">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-accent))]">
            Nos directions artistiques
          </p>
          <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] md:text-[38px]">
            Choisissez l&apos;univers qui vous ressemble.
          </h1>
          <p className="mx-auto mt-3 max-w-[58ch] text-[14.5px] text-[rgb(var(--m-muted))]">
            Aperçus de démonstration — dès votre choix, j&apos;applique vos textes et vos
            photos, et je vous montre VOTRE site.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {state.candidateTemplateIds.slice(0, visibleCount).map((tid, i) => (
            <DemoCard key={tid} tid={tid} index={i} onPick={onPick} />
          ))}
        </div>

        {state.candidateTemplateIds.length > visibleCount && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount((n) => n + 6)}
              className="rounded-full border border-[rgb(var(--m-line))] px-6 py-3 text-[14px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
            >
              Voir plus de styles ({state.candidateTemplateIds.length - visibleCount})
            </button>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-[rgb(var(--m-line))]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--m-faint))]">
                Envie d&apos;un autre univers ?
              </p>
              <span className="h-px flex-1 bg-[rgb(var(--m-line))]" />
            </div>

            {othersCount === 0 ? (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setOthersCount(6)}
                  className="rounded-full border border-[rgb(var(--m-line))] px-6 py-3 text-[14px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
                >
                  Explorer tous les styles ({others.length})
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {others.slice(0, othersCount).map((tid, i) => (
                    <DemoCard key={tid} tid={tid} index={i} onPick={onPick} />
                  ))}
                </div>
                {others.length > othersCount && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setOthersCount((n) => n + 6)}
                      className="rounded-full border border-[rgb(var(--m-line))] px-6 py-3 text-[14px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
                    >
                      Voir plus ({others.length - othersCount})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Iframe d'aperçu DÉMO, réduite de moitié (template tel quel, jamais personnalisé). */
function DemoFrame({ tid, height = 420 }: { tid: string; height?: number }) {
  return (
    <div
      className="relative overflow-hidden bg-[rgb(var(--m-elevated))]"
      style={{ height }}
    >
      <iframe
        src={demoSrc(tid)}
        title={templateMeta(tid).name}
        loading="lazy"
        className="pointer-events-none w-[200%] origin-top-left scale-50 border-0"
        style={{ height: height * 2 }}
      />
    </div>
  );
}

function DemoCard({
  tid,
  index,
  onPick,
}: {
  tid: string;
  index: number;
  onPick: (tid: string) => void;
}) {
  const meta = templateMeta(tid);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 5) * 0.1 }}
      className="overflow-hidden rounded-[24px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_24px_70px_-40px_rgba(0,0,0,0.4)]"
    >
      <DemoFrame tid={tid} />
      <div className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-[15px] font-semibold">{meta.name}</p>
          <p className="text-[12.5px] text-[rgb(var(--m-faint))]">{meta.style}</p>
        </div>
        <button
          onClick={() => onPick(tid)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--m-ink))] px-4 py-2.5 text-[13.5px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
        >
          <Check size={14} />
          Choisir
        </button>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- Building */

function Building({
  siteId,
  templateId,
  onDone,
}: {
  siteId: string;
  templateId: string;
  onDone: (token: string | null) => void;
}) {
  // Index de l'étape EN COURS (les précédentes sont cochées).
  const [stepIdx, setStepIdx] = useState(0);
  const [subline, setSubline] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const ranFor = useRef<string>("");

  // Sous-titres tournants pendant la réécriture IA (l'étape longue).
  useEffect(() => {
    if (stepIdx !== 2) return;
    const t = window.setInterval(
      () => setSubline((s) => (s + 1) % BUILD_SUBLINES.length),
      2600,
    );
    return () => window.clearInterval(t);
  }, [stepIdx]);

  useEffect(() => {
    // Garde anti double-démarrage (StrictMode dev rejoue les effets). Surtout
    // PAS de drapeau « alive » coupé au cleanup : le premier montage est la
    // seule exécution réelle — l'annuler bloquait l'écran pour toujours.
    const key = `${siteId}:${templateId}:${attempt}`;
    if (ranFor.current === key) return;
    ranFor.current = key;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      const t0 = Date.now();
      try {
        // ① Figer le choix : template + contenu déterministe persistés (rapide).
        const res = await fetch("/api/onboarding/choose", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ siteId, templateId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "La préparation a échoué.");
        setStepIdx(2); // ① et ② cochées : style réservé, photos/infos en place

        // ③ Réécriture IA, bornée côté client (best-effort : un échec ou un
        // dépassement n'empêche rien — le contenu déterministe est déjà prêt).
        await Promise.race([
          fetch("/api/onboarding/enrich", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteId }),
          }),
          sleep(50_000),
        ]).catch(() => {});
        setStepIdx(3);

        // ④ Le temps de respirer : jamais moins de ~7 s à l'écran.
        await sleep(Math.max(900, 7000 - (Date.now() - t0)));
        setStepIdx(4);
        await sleep(600);
        onDone(typeof data.token === "string" ? data.token : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "La préparation a échoué.");
      }
    })();
  }, [siteId, templateId, attempt, onDone]);

  const meta = templateMeta(templateId);

  return (
    <div className="akyra flex min-h-screen flex-col items-center justify-center bg-[rgb(var(--m-page))] px-5 text-[rgb(var(--m-ink))]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-[480px] rounded-[28px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-8 shadow-[0_40px_110px_-50px_rgba(0,0,0,0.5)]"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-fit"
        >
          <AkyraMark size={40} />
        </motion.div>

        <h1 className="mt-5 text-center text-[24px] font-semibold tracking-[-0.02em]">
          Très bon choix.
        </h1>
        <p className="mt-2 text-center text-[14.5px] leading-relaxed text-[rgb(var(--m-muted))]">
          Je prépare votre site « {meta.name} » — ne bougez pas, c&apos;est
          l&apos;affaire d&apos;une trentaine de secondes.
        </p>

        <ul className="mt-7 flex flex-col gap-3.5">
          {BUILD_STEPS.map((label, i) => {
            const done = stepIdx > i;
            const current = stepIdx === i && !error;
            return (
              <li key={label} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors ${
                    done
                      ? "border-transparent bg-[rgb(var(--m-accent))] text-white"
                      : current
                        ? "border-[rgb(var(--m-accent)/0.5)] text-[rgb(var(--m-accent))]"
                        : "border-[rgb(var(--m-line))] text-[rgb(var(--m-faint))]"
                  }`}
                >
                  {done ? (
                    <Check size={13} />
                  ) : current ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div>
                  <p
                    className={`text-[14.5px] font-medium ${
                      done || current ? "text-[rgb(var(--m-ink))]" : "text-[rgb(var(--m-faint))]"
                    }`}
                  >
                    {label}
                  </p>
                  {current && i === 2 && (
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={subline}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="mt-0.5 text-[12.5px] text-[rgb(var(--m-faint))]"
                      >
                        {BUILD_SUBLINES[subline]}
                      </motion.p>
                    </AnimatePresence>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-[13.5px] text-red-700">{error}</p>
            <button
              onClick={() => {
                setError("");
                setStepIdx(0);
                setAttempt((a) => a + 1);
              }}
              className="mt-3 rounded-full bg-[rgb(var(--m-ink))] px-5 py-2.5 text-[13.5px] font-bold text-[rgb(var(--m-page))]"
            >
              Réessayer
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ Result */

function ResultView({
  state,
  onPay,
  onCatalog,
}: {
  state: ClientState;
  onPay: () => void;
  onCatalog: () => void;
}) {
  const [nonce, setNonce] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  async function refine() {
    const p = prompt.trim();
    if (p.length < 4 || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/onboarding/refine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId: state.siteId, prompt: p }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ ok: false, text: data?.error || "La correction a échoué — réessayez." });
        return;
      }
      if ((data?.changed ?? 0) > 0) {
        setPrompt("");
        setNonce((n) => n + 1);
        setNotice({ ok: true, text: "C'est corrigé — regardez le résultat à gauche 👀" });
      } else {
        setNotice({
          ok: false,
          text:
            data?.message ||
            "Je n'ai pas pu traduire cette remarque en correction — précisez l'endroit concerné.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const meta = templateMeta(state.chosenTemplateId ?? state.templateId);

  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
          <AkyraMark size={22} /> Akyra
        </Link>
        <span className="text-[12.5px] text-[rgb(var(--m-faint))]">
          Direction artistique « {meta.name} »
        </span>
      </header>

      <div className="mx-auto grid max-w-[1280px] items-start gap-8 px-5 pb-20 md:grid-cols-[1.15fr_0.85fr] md:px-10">
        {/* Le site fini, en grand */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="order-2 overflow-hidden rounded-[26px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.45)] md:order-1"
        >
          <div className="flex items-center gap-2 border-b border-[rgb(var(--m-line))] px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--m-overlay)/0.12)]" />
            </span>
            <span className="ml-1 text-[12px] font-medium text-[rgb(var(--m-faint))]">
              Votre site — avec vos photos et vos textes
            </span>
            <button
              onClick={() => setFullPreview(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
            >
              <Maximize2 size={12} />
              Plein écran & responsive
            </button>
          </div>
          <div className="relative h-[72vh] min-h-[480px]">
            {busy && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--m-surface)/0.75)] backdrop-blur-[2px]">
                <span className="flex items-center gap-2.5 rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-5 py-3 text-[14px] font-medium shadow-lg">
                  <Wand2 size={15} className="text-[rgb(var(--m-accent))]" />
                  Je corrige ça…
                  <TypingDots />
                </span>
              </div>
            )}
            <iframe
              key={nonce}
              src={`/api/preview?siteId=${state.siteId}&v=${nonce}`}
              title="Votre site"
              className="h-full w-full border-0"
            />
          </div>
        </motion.div>

        {/* Verdict + ajustements */}
        <div className="order-1 md:order-2 md:sticky md:top-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
          >
            <BotBubble>
              <p className="text-[15.5px] leading-relaxed">{RESULT_LINE}</p>
            </BotBubble>
          </motion.div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onPay}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--m-ink))] px-6 py-4 text-[15px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
            >
              <Check size={16} />
              Il est parfait — le mettre en ligne
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => setAdjustOpen((o) => !o)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-6 py-3.5 text-[14px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
            >
              <Pencil size={14} />
              Ajuster quelque chose
            </button>

            <AnimatePresence>
              {adjustOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="rounded-[20px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] p-4">
                    <p className="text-[13px] text-[rgb(var(--m-muted))]">
                      Dites-moi ce qui ne va pas — je corrige gratuitement, avant le
                      paiement.
                    </p>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.metaKey || e.ctrlKey) && refine()
                      }
                      placeholder="Ex. Le grand titre ne me ressemble pas, je préfère « Des images qui durent »."
                      rows={3}
                      disabled={busy}
                      className="mt-3 w-full resize-none rounded-xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] px-4 py-3 text-[14px] leading-relaxed outline-none transition-colors focus:border-[rgb(var(--m-accent)/0.5)] placeholder:text-[rgb(var(--m-faint))] disabled:opacity-60"
                    />
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="text-[11.5px] text-[rgb(var(--m-faint))]">
                        Textes uniquement — photos &amp; couleurs dans l&apos;éditeur ensuite.
                      </span>
                      <button
                        onClick={refine}
                        disabled={busy || prompt.trim().length < 4}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgb(var(--m-accent))] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {busy ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Wand2 size={13} />
                        )}
                        Corriger
                      </button>
                    </div>
                    {notice && (
                      <p
                        className={`mt-2.5 text-[13px] ${
                          notice.ok ? "text-emerald-600" : "text-[rgb(var(--m-muted))]"
                        }`}
                      >
                        {notice.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={onCatalog}
              className="mt-1 text-[13px] font-medium text-[rgb(var(--m-faint))] transition-colors hover:text-[rgb(var(--m-ink))]"
            >
              Changer complètement de style →
            </button>
          </div>

          <ul className="mt-7 flex flex-col gap-2.5 text-[13.5px]">
            {[
              "Hébergement & adresse incluse",
              "Modifiable à volonté après la mise en ligne",
              "Tout compris, moins de 5 €/mois",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[rgb(var(--m-muted))]">
                <Check size={15} className="shrink-0 text-[rgb(var(--m-accent))]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {fullPreview && (
          <FullPreview
            src={`/api/preview?siteId=${state.siteId}&v=${nonce}`}
            title={`Votre site — « ${meta.name} »`}
            onClose={() => setFullPreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------- Aperçu plein écran */

const PREVIEW_DEVICES = [
  { id: "desktop", label: "Desktop", width: "100%", Icon: Monitor },
  { id: "tablet", label: "Tablette", width: "820px", Icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
] as const;

/**
 * Prévisualisation complète du site fini : navigation libre dans l'iframe,
 * test responsive (desktop/tablette/mobile), retour d'un clic vers le verdict.
 */
function FullPreview({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const [device, setDevice] =
    useState<(typeof PREVIEW_DEVICES)[number]["id"]>("desktop");
  const width = PREVIEW_DEVICES.find((d) => d.id === device)!.width;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-[rgb(var(--m-page))]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] px-4 py-2.5">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3.5 py-1.5 text-[13px] font-semibold text-[rgb(var(--m-ink))] transition-colors hover:bg-[rgb(var(--m-overlay)/0.04)]"
        >
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="flex items-center gap-1 rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-page))] p-1">
          {PREVIEW_DEVICES.map((d) => {
            const active = d.id === device;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                aria-pressed={active}
                title={d.label}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors " +
                  (active
                    ? "bg-[rgb(var(--m-ink))] text-[rgb(var(--m-page))]"
                    : "text-[rgb(var(--m-faint))] hover:text-[rgb(var(--m-ink))]")
                }
              >
                <d.Icon size={14} />
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden max-w-[32ch] truncate text-[13px] font-medium text-[rgb(var(--m-muted))] md:inline">
          {title}
        </span>
      </header>

      <div className="flex flex-1 justify-center overflow-auto bg-[rgb(var(--m-elevated))] p-4 md:p-6">
        <iframe
          key={device}
          src={src}
          title={title}
          className="h-full rounded-lg border-0 bg-white shadow-2xl"
          style={{ width, maxWidth: "100%" }}
        />
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- Paywall */

function Paywall({ state, onBack }: { state: ClientState; onBack: () => void }) {
  const meta = templateMeta(state.chosenTemplateId ?? state.templateId);
  return (
    <div className="akyra min-h-screen bg-[rgb(var(--m-page))] text-[rgb(var(--m-ink))]">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
          <AkyraMark size={22} /> Akyra
        </Link>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[rgb(var(--m-muted))] hover:text-[rgb(var(--m-ink))]"
        >
          <ArrowLeft size={14} /> Revoir mon site
        </button>
      </header>

      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <div className="order-2 overflow-hidden rounded-[26px] border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.4)] md:order-1">
          <div className="relative h-[62vh] min-h-[460px]">
            <iframe
              src={`/api/preview?siteId=${state.siteId}`}
              title="Votre site"
              className="h-full w-full border-0"
            />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--m-line))] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--m-accent))]">
            <Check size={13} /> Votre site est validé
          </span>
          <h1 className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[40px]">
            Il ne reste qu&apos;à le mettre en ligne.
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
