"use client";

/**
 * Onboarding IA TEMPS RÉEL.
 *
 * Akyra mène une vraie conversation (questions improvisées selon le métier),
 * récolte le socle d'infos, puis : choisit un design system adapté, annonce le
 * NOMBRE EXACT de photos, les collecte, et GÉNÈRE un site sur-mesure sous les
 * yeux du client. Remplace l'ancien tunnel scripté.
 *
 * Phases : loading → chat → plan (photos) → building → result.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, ImagePlus, Sparkles, Check, ArrowRight } from "lucide-react";
import { compressImages } from "@/lib/compress-image";
import { AkyraMark } from "@/components/ui/Logo";

type Msg = { role: "user" | "assistant"; content: string };
type Progress = { filled: string[]; missing: string[] };
type ImageSlot = { path: string; role: string; description: string; required: boolean };
type ImagePlan = { count: number; requiredCount: number; slots: ImageSlot[] };
type Plan = { templateId: string; rationale: string; imagePlan: ImagePlan };
type Phase = "loading" | "chat" | "plan" | "header" | "error";

export default function AiOnboardingClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [siteId, setSiteId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<Progress>({ filled: [], missing: [] });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [headerLoading, setHeaderLoading] = useState(false);
  const [headerNonce, setHeaderNonce] = useState(0);
  const [validating, setValidating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Un tour de conversation : envoie le transcript, applique la réponse du bot.
  const runTurn = useCallback(
    async (sid: string, history: Msg[]) => {
      setSending(true);
      try {
        const res = await fetch("/api/onboarding/ai/next", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ siteId: sid, history }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Erreur");
        if (data.progress) setProgress(data.progress as Progress);
        if (typeof data.assistant === "string") {
          setMessages((m) => [...m, { role: "assistant", content: data.assistant }]);
        }
        if (data.done) {
          // Socle complet → choix du thème + plan photo.
          const pres = await fetch("/api/onboarding/plan", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteId: sid }),
          });
          const pdata = await pres.json();
          if (pres.ok) {
            setPlan(pdata as Plan);
            setPhase("plan");
          }
        }
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Désolée, un souci technique. Reformulez ?" },
        ]);
        void e;
      } finally {
        setSending(false);
      }
    },
    [],
  );

  // Bootstrap : crée/récupère le site, puis amorce la conversation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data?.redirect) {
          router.replace(data.redirect);
          return;
        }
        if (!res.ok || !data?.siteId) throw new Error(data?.error ?? "Démarrage impossible.");
        if (cancelled) return;
        setSiteId(data.siteId);
        setPhase("chat");
        await runTurn(data.siteId, []); // history vide → accueil + 1re question
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "Erreur");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, runTurn]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || sending || !siteId) return;
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    void runTurn(siteId, history);
  }, [input, sending, siteId, messages, runTurn]);

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !siteId) return;
      setUploading(true);
      try {
        const compressed = await compressImages(Array.from(files));
        const fd = new FormData();
        fd.append("siteId", siteId);
        for (const f of compressed) fd.append("photo", f);
        const res = await fetch("/api/onboarding/photos", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && Array.isArray(data.photoUrls)) setPhotoUrls(data.photoUrls);
      } finally {
        setUploading(false);
      }
    },
    [siteId],
  );

  // Génère le HEADER (aperçu du style) — rapide, synchrone. `another` → autre DA.
  const showStyle = useCallback(
    async (another = false) => {
    if (!siteId) return;
    setHeaderLoading(true);
    setPhase("header");
    try {
      const res = await fetch("/api/onboarding/header", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, another }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Aperçu impossible.");
      setHeaderNonce((n) => n + 1); // force le rechargement de l'iframe
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur");
      setPhase("error");
    } finally {
      setHeaderLoading(false);
    }
    },
    [siteId],
  );

  // Valide le style → met en file la génération du site complet, part au dashboard.
  const validateStyle = useCallback(async () => {
    if (!siteId) return;
    setValidating(true);
    try {
      const res = await fetch("/api/onboarding/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Validation impossible.");
      router.push(typeof data.redirect === "string" ? data.redirect : "/dashboard?building=1");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur");
      setValidating(false);
      setPhase("error");
    }
  }, [siteId, router]);

  const totalSlots = SOCLE_TOTAL;
  const filledCount = Math.min(progress.filled.length, totalSlots);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-slate-200/70">
        <AkyraMark className="h-6 w-6" />
        <span className="font-semibold tracking-tight">Akyra</span>
        {(phase === "chat" || phase === "plan") && (
          <span className="ml-auto text-xs text-slate-500">
            {filledCount}/{totalSlots} infos recueillies
          </span>
        )}
      </header>

      {phase === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Akyra prépare votre espace…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="text-slate-700">{errorMsg || "Une erreur est survenue."}</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white"
          >
            Réessayer
          </button>
        </div>
      )}

      {phase === "chat" && (
        <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col px-4">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-sky-600 px-4 py-2.5 text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200"
                  }
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-5 pt-2">
            <div className="flex items-end gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Votre réponse…"
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="grid h-9 w-9 place-items-center rounded-xl bg-sky-600 text-white disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "plan" && plan && (
        <div className="mx-auto max-w-xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-sky-600">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Votre style est choisi</span>
            </div>
            {plan.rationale && <p className="mt-2 text-sm text-slate-600">{plan.rationale}</p>}
            <h2 className="mt-5 text-lg font-semibold">
              Envoyez {plan.imagePlan.count} photo{plan.imagePlan.count > 1 ? "s" : ""}
              <span className="text-slate-500">
                {" "}
                ({plan.imagePlan.requiredCount} indispensable
                {plan.imagePlan.requiredCount > 1 ? "s" : ""})
              </span>
            </h2>
            <ol className="mt-3 space-y-1.5 text-sm text-slate-700">
              {plan.imagePlan.slots.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-400">{i + 1}.</span>
                  <span>
                    {s.description}
                    {!s.required && <span className="text-slate-400"> (optionnel)</span>}
                  </span>
                </li>
              ))}
            </ol>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-slate-500 hover:border-sky-400 hover:bg-sky-50/50">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
              <span className="text-sm">
                {photoUrls.length > 0
                  ? `${photoUrls.length} photo(s) ajoutée(s) — cliquez pour en ajouter`
                  : "Cliquez ou déposez vos photos"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onUpload(e.target.files)}
              />
            </label>

            {photoUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {photoUrls.slice(0, 10).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={u} alt="" className="h-14 w-full rounded-lg object-cover" />
                ))}
              </div>
            )}

            <button
              onClick={() => showStyle(false)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
            >
              Voir mon style <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Vous validez d'abord le style, puis on construit le site complet. Aucune photo ?
              On utilisera des visuels neutres que vous remplacerez.
            </p>
          </div>
        </div>
      )}

      {phase === "header" && (
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 text-sky-600">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Voici le style de votre site</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Validez l'ambiance, ou essayez une autre direction. Le site complet se construira
              ensuite à partir de ce style.
            </p>
          </div>
          <div className="relative h-[70vh] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {headerNonce > 0 && !headerLoading && (
              <iframe
                key={headerNonce}
                title="Aperçu du style"
                src={`/api/onboarding/header?siteId=${encodeURIComponent(siteId)}&n=${headerNonce}`}
                className="h-full w-full"
              />
            )}
            {(headerLoading || headerNonce === 0) && (
              // Skeleton animé : on « voit » la page se construire (rassurant).
              <div className="absolute inset-0 flex flex-col">
                <div className="flex items-center justify-between px-8 py-6">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="hidden gap-6 sm:flex">
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
                  <div className="h-10 w-3/5 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-10 w-2/5 animate-pulse rounded-lg bg-slate-200" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 h-10 w-40 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center justify-center gap-2 pb-8 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Création de votre style… (~15 s)</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => showStyle(true)}
              disabled={headerLoading || validating}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> Essayer un autre style
            </button>
            <button
              onClick={validateStyle}
              disabled={headerLoading || validating}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Valider ce style
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Après validation, votre site se construit en arrière-plan — vous le retrouverez prêt
            sur votre tableau de bord.
          </p>
        </div>
      )}
    </div>
  );
}

// Nombre de slots du socle (miroir de lib/onboarding-ai.ts) pour la jauge.
const SOCLE_TOTAL = 7;
