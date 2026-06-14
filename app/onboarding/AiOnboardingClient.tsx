"use client";

/**
 * Onboarding IA TEMPS RÉEL — tunnel en écran scindé.
 *
 * À gauche : Akyra mène une vraie conversation (questions improvisées selon le
 * métier) et récolte le socle d'infos. À droite : le site se construit EN DIRECT
 * (LiveBuildPanel — aperçu qui se remplit, checklist des sections, ajout de
 * photos). Quand la discussion se conclut ET que le site est entièrement généré,
 * la révélation s'affiche dans le tunnel (confettis + paywall).
 *
 * Phases : loading → chat (split-screen) → reveal.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { AkyraMark } from "@/components/ui/Logo";
import LiveBuildPanel from "@/components/onboarding/LiveBuildPanel";
import MicButton from "@/components/onboarding/MicButton";
import RevealCelebration from "@/components/onboarding/RevealCelebration";
import PaywallModal from "@/components/dashboard/PaywallModal";

type Msg = { role: "user" | "assistant"; content: string };
type Progress = { filled: string[]; missing: string[] };
type Phase = "loading" | "chat" | "finishing" | "reveal" | "error";
type MobileTab = "chat" | "preview";

export default function AiOnboardingClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [siteId, setSiteId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<Progress>({ filled: [], missing: [] });
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  // Verrou de la révélation : elle ne se déclenche que lorsque LES DEUX sont
  // vrais — la discussion est conclue + le snapshot bespoke est commité
  // (validated), ET toutes les sections sont générées (buildAllDone).
  const [validated, setValidated] = useState(false);
  const [buildAllDone, setBuildAllDone] = useState(false);
  useEffect(() => {
    // Discussion conclue + site complet → révélation. Conclue mais site pas encore
    // prêt → écran d'attente narré `finishing` (jamais coincé dans le chat).
    if (validated && buildAllDone) setPhase("reveal");
    else if (validated) setPhase("finishing");
  }, [validated, buildAllDone]);

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
          // Socle complet : on commit le snapshot bespoke (complet ou partiel) et
          // on met en file le job net si besoin. À AWAIT impérativement avant la
          // révélation — avant lui, /api/preview montrerait du contenu démo.
          // On NE navigue PAS : on reste en `chat`, le LiveBuildPanel continue de
          // se remplir. La révélation est gérée par l'effet validated&&buildAllDone.
          await fetch("/api/onboarding/validate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ siteId: sid }),
          });
          setValidated(true);
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

  const totalSlots = SOCLE_TOTAL;
  const filledCount = Math.min(progress.filled.length, totalSlots);

  // ── Révélation : confettis + paywall, dans le tunnel ───────────────────────
  if (phase === "reveal") {
    return (
      <RevealCelebration
        siteId={siteId}
        firstName={null}
        dashboardHref="/dashboard?building=1"
        publishSlot={
          <PaywallModal
            siteId={siteId}
            firstName={null}
            trigger={
              <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800">
                Publier mon site
              </button>
            }
          />
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-slate-200/70">
        <AkyraMark className="h-6 w-6" />
        <span className="font-semibold tracking-tight">Akyra</span>
        {phase === "chat" && (
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
        <div className="mx-auto max-w-6xl px-4 py-4">
          {/* Bascule mobile : Discussion ↔ Aperçu (cachée en lg, deux colonnes) */}
          <div className="mb-3 flex gap-2 lg:hidden">
            <button
              onClick={() => setMobileTab("chat")}
              className={
                mobileTab === "chat"
                  ? "rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white"
                  : "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
              }
            >
              Discussion
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={
                mobileTab === "preview"
                  ? "rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white"
                  : "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
              }
            >
              Aperçu
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Colonne discussion */}
            <div
              className={
                "flex h-[calc(100vh-150px)] flex-col lg:flex " +
                (mobileTab === "chat" ? "flex" : "hidden")
              }
            >
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-2">
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
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-2 pt-2">
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
                  <MicButton
                    siteId={siteId}
                    onTranscript={(t) => setInput((v) => (v ? v.trim() + " " : "") + t)}
                    disabled={sending}
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

            {/* Colonne aperçu en direct */}
            <div className={"lg:block " + (mobileTab === "preview" ? "block" : "hidden")}>
              <LiveBuildPanel siteId={siteId} onAllDone={() => setBuildAllDone(true)} />
            </div>
          </div>
        </div>
      )}

      {phase === "finishing" && (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-5 text-center">
            <div className="inline-flex items-center gap-2 text-sky-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-semibold">On termine votre site…</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Vos réponses sont enregistrées — on assemble les dernières sections. Ça y est presque.
            </p>
          </div>
          <LiveBuildPanel siteId={siteId} onAllDone={() => setBuildAllDone(true)} />
          <div className="mt-5 text-center">
            <button
              onClick={() => router.push("/dashboard?building=1")}
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
            >
              Continuer vers mon tableau de bord →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Nombre de slots du socle (miroir de lib/onboarding-ai.ts) pour la jauge.
const SOCLE_TOTAL = 7;
