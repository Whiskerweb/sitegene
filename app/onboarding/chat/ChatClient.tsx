"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AkyraLogo } from "@/components/ui/Logo";
import type { ChatQuestion } from "@/lib/chat-questions";
import type { Intake } from "@/lib/onboarding-config";

type SerializableChatQuestion = Omit<ChatQuestion, "askIf">;
type Bubble = { from: "bot" | "user"; text: string };

/**
 * Chatbot scripté : une question à la fois, réponses rapides + « Passer ».
 * Chaque réponse est sauvegardée immédiatement (autosave /api/onboarding/save)
 * et le mini-aperçu est rechargé (debounce). Minimaliste, DA ciel/glass.
 */
export default function ChatClient({
  siteId,
  firstName,
  questions,
}: {
  siteId: string;
  firstName: string | null;
  questions: SerializableChatQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Intake>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      from: "bot",
      text: firstName
        ? `Superbe choix, ${firstName} ! Encore quelques détails pour affiner votre site — répondez ou passez, comme vous voulez.`
        : "Superbe choix ! Encore quelques détails pour affiner votre site — répondez ou passez, comme vous voulez.",
    },
  ]);
  const [textDraft, setTextDraft] = useState("");
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Questions restantes : on rejoue les dépendances côté client via le champ
  // `dependsOn` (générique), qui survit à la sérialisation serveur→client.
  const remaining = useMemo(
    () =>
      questions.filter((q) => {
        if (q.key in answers || skipped.includes(q.key)) return false;
        if (q.dependsOn) {
          const depInList = questions.some((x) => x.key === q.dependsOn);
          // Dépendance posée dans cette session : on attend sa réponse (true).
          // Dépendance absente de la liste : déjà tranchée côté serveur (askIf
          // validé) → on pose. Dépendance passée en session → on ne pose pas.
          if (depInList) return answers[q.dependsOn as keyof Intake] === true;
          return true;
        }
        return true;
      }),
    [questions, answers, skipped],
  );
  const current = remaining[0] ?? null;
  const total = questions.length;
  const done = total - remaining.length;

  // Auto-scroll du fil vers le bas à chaque nouvelle bulle / question.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, current]);

  function schedulePreviewReload() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewKey((k) => k + 1), 800);
  }

  async function persist(patch: Partial<Intake>, skippedKey?: string) {
    setSaving(true);
    try {
      await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteId,
          patch,
          skipped: skippedKey ? [skippedKey] : undefined,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  function answer(
    q: SerializableChatQuestion,
    value: Intake[keyof Intake],
    display: string,
  ) {
    setBubbles((b) => [...b, { from: "user", text: display }]);
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setTextDraft("");
    setMultiDraft([]);
    void persist({ [q.key]: value } as Partial<Intake>);
    schedulePreviewReload();
  }

  function skip(q: SerializableChatQuestion) {
    setBubbles((b) => [...b, { from: "user", text: "Passer" }]);
    setSkipped((s) => [...s, q.key]);
    void persist({}, q.key);
  }

  function finish() {
    router.push("/dashboard?fromChat=1");
  }

  return (
    <div className="akyra relative flex min-h-screen flex-col overflow-hidden">
      {/* Fond ciel vivant de la landing */}
      <div aria-hidden className="sky-anim pointer-events-none fixed inset-0 -z-10" />

      <header className="liquid-glass sticky top-0 z-20 flex items-center justify-between border-b border-sky-300 px-6 py-4">
        <AkyraLogo tone="light" />
        <span className="text-sm font-medium text-mist">étape 2 / 3</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 pb-10 pt-8">
        {/* fil de bulles */}
        <div className="space-y-3">
          {bubbles.map((b, i) => (
            <div
              key={i}
              className={
                b.from === "bot"
                  ? "liquid-glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] text-night"
                  : "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-[15px] text-white"
              }
            >
              {b.text}
            </div>
          ))}
          {current && (
            <div className="liquid-glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] text-night">
              {current.label}
              {current.help && (
                <p className="mt-1 text-sm text-mist">{current.help}</p>
              )}
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* zone de réponse */}
        {current ? (
          <div className="mt-auto space-y-3">
            {current.kind === "boolean" && (
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-full bg-brand py-3 font-bold text-white transition hover:opacity-90"
                  onClick={() => answer(current, true, "Oui")}
                >
                  Oui
                </button>
                <button
                  className="flex-1 rounded-full border border-sky-300 py-3 font-semibold text-night transition hover:border-brand"
                  onClick={() => answer(current, false, "Non")}
                >
                  Non
                </button>
              </div>
            )}

            {current.kind === "choice" && (
              <div className="flex flex-wrap gap-2">
                {(current.options ?? []).map((o) => (
                  <button
                    key={o.value}
                    className="rounded-full border border-sky-300 px-5 py-2.5 font-semibold text-night transition hover:border-brand"
                    onClick={() =>
                      answer(current, o.value as Intake[keyof Intake], o.label)
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {current.kind === "multiselect" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(current.options ?? []).map((o) => {
                    const on = multiDraft.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          on
                            ? "border-brand bg-brand text-white"
                            : "border-sky-300 text-night hover:border-brand"
                        }`}
                        onClick={() =>
                          setMultiDraft((m) =>
                            on ? m.filter((v) => v !== o.value) : [...m, o.value],
                          )
                        }
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={multiDraft.length === 0}
                  className="rounded-full bg-brand px-6 py-2.5 font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                  onClick={() =>
                    answer(
                      current,
                      multiDraft as Intake[keyof Intake],
                      multiDraft
                        .map(
                          (v) =>
                            current.options?.find((o) => o.value === v)?.label ?? v,
                        )
                        .join(", "),
                    )
                  }
                >
                  Valider
                </button>
              </div>
            )}

            {current.kind === "text" && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = textDraft.trim();
                  if (v) answer(current, v as Intake[keyof Intake], v);
                }}
              >
                <input
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  placeholder={current.placeholder}
                  className="flex-1 rounded-full border border-sky-300 bg-white px-5 py-3 text-[15px] text-night outline-none focus:border-brand"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 font-bold text-white transition hover:opacity-90"
                >
                  OK
                </button>
              </form>
            )}

            <div className="flex items-center justify-between text-sm">
              <button
                className="text-mist transition hover:text-night"
                onClick={() => skip(current)}
              >
                Passer ›
              </button>
              <span className="text-mist">
                {done}/{total}
                {saving ? " · enregistrement…" : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-auto space-y-3 text-center">
            <p className="text-[15px] text-night">
              Parfait, tout est noté. Votre site vous attend.
            </p>
            <button
              className="rounded-full bg-brand px-8 py-3 font-bold text-white transition hover:opacity-90"
              onClick={finish}
            >
              Découvrir mon site →
            </button>
          </div>
        )}

        {/* mini-aperçu live */}
        <div className="overflow-hidden rounded-2xl border border-sky-300 bg-white">
          <iframe
            key={previewKey}
            src={`/api/onboarding/preview?siteId=${siteId}`}
            className="pointer-events-none aspect-[16/10] w-full"
            title="Aperçu de votre site"
          />
        </div>
      </main>
    </div>
  );
}
