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
type Phase = "loading" | "chat" | "plan" | "building" | "result" | "error";

const BUILD_LINES = [
  "Je choisis la direction artistique qui vous ressemble…",
  "Je compose votre site sur-mesure…",
  "Je rédige vos textes et place vos photos…",
  "Je peaufine les animations…",
];

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
  const [buildLine, setBuildLine] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [generated, setGenerated] = useState(true);

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

  // Loader théâtral pendant la génération.
  useEffect(() => {
    if (phase !== "building") return;
    const t = setInterval(() => setBuildLine((i) => (i + 1) % BUILD_LINES.length), 2600);
    return () => clearInterval(t);
  }, [phase]);

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

  const generate = useCallback(async () => {
    if (!siteId) return;
    setPhase("building");
    setBuildLine(0);
    try {
      const res = await fetch("/api/onboarding/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Génération impossible.");
      setGenerated(data.generated !== false);
      setPhase("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur");
      setPhase("error");
    }
  }, [siteId]);

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
              onClick={generate}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
            >
              Générer mon site <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Vous pourrez tout ajuster ensuite. Aucune photo ? On utilisera des visuels neutres.
            </p>
          </div>
        </div>
      )}

      {phase === "building" && (
        <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
          <div className="relative">
            <Sparkles className="h-10 w-10 text-sky-500" />
            <Loader2 className="absolute -inset-2 h-14 w-14 animate-spin text-sky-200" />
          </div>
          <p className="text-lg font-medium">{BUILD_LINES[buildLine]}</p>
          <p className="text-sm text-slate-500">Cela prend une trentaine de secondes…</p>
        </div>
      )}

      {phase === "result" && (
        <div className="mx-auto max-w-5xl px-4 py-8">
          {!generated && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-sm text-amber-800">
                La génération sur-mesure n'a pas abouti (surcharge passagère) — voici une
                version de base. Relancez la génération pour un site vraiment à votre image.
              </p>
              <button
                onClick={generate}
                className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                <Sparkles className="h-4 w-4" /> Régénérer
              </button>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-green-600">
                <Check className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Votre site est prêt !</h2>
            </div>
            <button
              onClick={() => router.push("/editor")}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Modifier &amp; publier
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <iframe
              title="Aperçu de votre site"
              src={`/api/preview?siteId=${encodeURIComponent(siteId)}`}
              className="h-[72vh] w-full bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Nombre de slots du socle (miroir de lib/onboarding-ai.ts) pour la jauge.
const SOCLE_TOTAL = 7;
