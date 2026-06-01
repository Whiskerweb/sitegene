"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeIntake, type IntakePayload } from "@/lib/intake-store";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import LoadingSteps from "./LoadingSteps";
import ResultView from "./ResultView";

type Result = { token: string; templateId: string; usedDemoPhotos: boolean };

/**
 * Orchestre le tunnel /create : lit le brief (store mémoire), lance la
 * génération réelle, joue l'écran de chargement scénarisé, puis révèle le site.
 * Le résultat n'apparaît que lorsque la réponse réseau ET la mise en scène sont
 * terminées (jamais d'écran vide). Conserve le payload pour le switch de modèle.
 */
export default function GenerationFlow() {
  const router = useRouter();
  const payloadRef = useRef<IntakePayload | null>(null);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [minElapsed, setMinElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const p = consumeIntake();
    if (!p) {
      router.replace("/");
      return;
    }
    payloadRef.current = p;
    setReady(true);
    void run(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(payload: IntakePayload, templateId?: string) {
    setError(null);
    const fd = new FormData();
    fd.set("brief", payload.brief);
    fd.set("category", payload.categoryId);
    if (payload.company) fd.set("company", payload.company);
    if (templateId) fd.set("templateId", templateId);
    payload.photos.forEach((f) => fd.append("photo", f));

    try {
      const res = await fetch("/api/prospect/generate", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(data.error || "Génération impossible.");
      setResult({
        token: data.token,
        templateId: data.templateId,
        usedDemoPhotos: data.usedDemoPhotos,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  }

  async function switchTemplate(templateId: string) {
    if (!payloadRef.current) return;
    setIsSwitching(true);
    await run(payloadRef.current, templateId);
    setIsSwitching(false);
  }

  const category =
    getCategory(payloadRef.current?.categoryId ?? "") ?? DEFAULT_CATEGORY;

  if (!ready) return null;

  // Erreur initiale (aucun résultat encore) → écran d'échec + retry.
  if (error && !result) {
    return (
      <section className="grid min-h-[100dvh] place-items-center px-6">
        <div className="max-w-[460px] rounded-[22px] border border-danger/30 bg-white p-8 text-center shadow-cloud-sm">
          <p className="text-[16px] font-semibold text-night">
            La génération a échoué.
          </p>
          <p className="mt-2 text-[14px] text-slate">{error}</p>
          <button
            type="button"
            onClick={() => payloadRef.current && run(payloadRef.current)}
            className="btn-gold mt-6 inline-block rounded-full px-6 py-3 text-[14px] font-bold"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-3 block w-full text-[13px] text-mist hover:text-slate"
          >
            Revenir à l&apos;accueil
          </button>
        </div>
      </section>
    );
  }

  // Tant que la réponse OU la mise en scène ne sont pas finies → chargement.
  if (!result || !minElapsed) {
    return (
      <LoadingSteps
        categoryLabel={category.label}
        onDone={() => setMinElapsed(true)}
      />
    );
  }

  return (
    <ResultView
      token={result.token}
      templateId={result.templateId}
      usedDemoPhotos={result.usedDemoPhotos}
      category={category}
      onSwitchTemplate={switchTemplate}
      switching={isSwitching}
    />
  );
}
