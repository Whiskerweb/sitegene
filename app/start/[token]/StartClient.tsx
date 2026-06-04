"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import { AkyraLogo } from "@/components/ui/Logo";
import { templateMeta } from "@/lib/templates";

/**
 * Étape 1/3 : galerie des templates candidates, chacune rendue avec le contenu
 * réel du prospect (iframe /api/start/preview). Aucune mention de prix.
 */
export default function StartClient({
  token,
  firstName,
  candidateTemplateIds,
  isAuthed,
}: {
  token: string;
  firstName: string | null;
  candidateTemplateIds: string[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim(templateId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/start/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, templateId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Erreur");
      }
      router.push("/onboarding/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  function onChoose(templateId: string) {
    setPending(templateId);
    if (isAuthed) void claim(templateId);
    else setGateOpen(true);
  }

  return (
    <div className="akyra relative min-h-screen overflow-hidden">
      {/* Fond ciel vivant de la landing */}
      <div aria-hidden className="sky-anim pointer-events-none fixed inset-0 -z-10" />

      <header className="liquid-glass sticky top-0 z-20 flex items-center justify-between border-b border-sky-300 px-6 py-4">
        <AkyraLogo tone="light" />
        <span className="text-sm font-medium text-mist">étape 1 / 3</span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <h1 className="font-archivo text-4xl font-semibold tracking-tight text-night">
          {firstName ? `${firstName}, votre site est prêt.` : "Votre site est prêt."}
        </h1>
        <p className="mt-2 text-lg text-slate">
          Choisissez le style qui vous ressemble — tout est déjà rempli avec vos contenus.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {candidateTemplateIds.map((id) => {
            const meta = templateMeta(id);
            const previewUrl = `/api/start/preview?token=${encodeURIComponent(token)}&template=${encodeURIComponent(id)}`;
            return (
              <div
                key={id}
                className="liquid-glass flex flex-col overflow-hidden rounded-2xl border border-sky-300"
              >
                <iframe
                  src={previewUrl}
                  className="pointer-events-none aspect-[4/5] w-full bg-white"
                  title={`Aperçu ${meta.name}`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                />
                <div className="flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-archivo text-base font-semibold text-night">
                      {meta.name}
                    </p>
                    <p className="truncate text-sm text-mist">{meta.style}</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm font-semibold text-brand transition hover:text-brand-700"
                    >
                      Voir en grand →
                    </a>
                  </div>
                  <button
                    onClick={() => onChoose(id)}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {busy && pending === id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Choisir ce style"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      </main>

      <AuthGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setBusy(false);
        }}
        brief=""
        onAuthed={() => {
          setGateOpen(false);
          if (pending) void claim(pending);
        }}
      />
    </div>
  );
}
