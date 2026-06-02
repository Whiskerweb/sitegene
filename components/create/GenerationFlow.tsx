"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeIntake, type IntakePayload } from "@/lib/intake-store";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import LoadingSteps from "./LoadingSteps";
import ResultView from "./ResultView";
import CreateDashboard from "./CreateDashboard";

type Result = { token: string; templateId: string; usedDemoPhotos: boolean };

/**
 * Orchestre le tunnel /create :
 * 1. Lit le brief s'il provient de la Home (generation immédiate avec écran de chargement).
 * 2. Si aucun brief n'existe, affiche le CreateDashboard interactif (inspiration Aura.build).
 * 3. Permet de modifier le brief, téléverser des photos locales et choisir le modèle de départ.
 * 4. Joue l'écran de chargement scénarisé puis révèle le site final.
 */
export default function GenerationFlow() {
  const router = useRouter();
  const payloadRef = useRef<IntakePayload | null>(null);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [minElapsed, setMinElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Valeurs locales pour le Dashboard d'édition
  const [brief, setBrief] = useState("");
  const [categoryId, setCategoryId] = useState("photographe");
  const [templateId, setTemplateId] = useState("alice-r");
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    const p = consumeIntake();
    setReady(true);
    if (p) {
      payloadRef.current = p;
      setBrief(p.brief);
      setCategoryId(p.categoryId);
      setPhotos(p.photos);
      setIsGenerating(true);
      setMinElapsed(false);
      void run(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(payload: IntakePayload, selectedTemplateId?: string) {
    setError(null);
    const fd = new FormData();
    fd.set("brief", payload.brief);
    fd.set("category", payload.categoryId);
    if (payload.company) fd.set("company", payload.company);
    
    const activeTemplate = selectedTemplateId || templateId;
    fd.set("templateId", activeTemplate);
    
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
      setTemplateId(data.templateId);
      setIsGenerating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setIsGenerating(false);
    }
  }

  const handleDashboardGenerate = (data: {
    brief: string;
    categoryId: string;
    templateId: string;
    photos: File[];
  }) => {
    setBrief(data.brief);
    setCategoryId(data.categoryId);
    setTemplateId(data.templateId);
    setPhotos(data.photos);

    const payload: IntakePayload = {
      brief: data.brief,
      categoryId: data.categoryId,
      photos: data.photos,
      company: "", // honeypot vide pour les humains
    };
    payloadRef.current = payload;
    setIsGenerating(true);
    setMinElapsed(false);
    void run(payload, data.templateId);
  };

  async function switchTemplate(tid: string) {
    if (!payloadRef.current) return;
    setIsSwitching(true);
    await run(payloadRef.current, tid);
    setIsSwitching(false);
  }

  const category = getCategory(categoryId) || DEFAULT_CATEGORY;

  if (!ready) return null;

  // 1. Écran d'erreur initiale (aucun résultat encore) → échec + possibilité de modifier le brief.
  if (error && !result) {
    return (
      <section className="grid min-h-[100dvh] place-items-center bg-ink-900 px-6">
        <div className="max-w-[460px] rounded-[22px] border border-red-500/30 bg-ink-800 p-8 text-center shadow-2xl">
          <p className="text-[16px] font-semibold text-paper">
            La génération a échoué.
          </p>
          <p className="mt-2 text-[14.5px] text-muted">{error}</p>
          <button
            type="button"
            onClick={() => payloadRef.current && run(payloadRef.current)}
            className="btn-violet mt-6 inline-block rounded-full px-6 py-3 text-[14px] font-bold text-white w-full"
          >
            Réessayer la génération
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-3 block w-full text-[13px] text-violet-400 hover:text-white transition"
          >
            Modifier mon brief ou mes options
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 block w-full text-[12px] text-faint hover:text-muted transition"
          >
            Revenir à l&apos;accueil
          </button>
        </div>
      </section>
    );
  }

  // 2. Écran de chargement scénarisé (si génération en cours OU résultat non expiré temporellement)
  if (isGenerating || (result && !minElapsed)) {
    return (
      <LoadingSteps
        categoryLabel={category.label}
        onDone={() => setMinElapsed(true)}
      />
    );
  }

  // 3. Révélation du site généré dans son cadre d'aperçu
  if (result && minElapsed) {
    return (
      <ResultView
        token={result.token}
        templateId={result.templateId}
        usedDemoPhotos={result.usedDemoPhotos}
        category={category}
        onSwitchTemplate={switchTemplate}
        switching={isSwitching}
        onEdit={() => {
          setResult(null);
          setMinElapsed(false);
          setIsGenerating(false);
        }}
      />
    );
  }

  // 4. Par défaut : affiche le Dashboard interactif de prompt (comme aura.build/create)
  return (
    <CreateDashboard
      initialBrief={brief}
      initialCategoryId={categoryId}
      initialTemplateId={templateId}
      initialPhotos={photos}
      onGenerate={handleDashboardGenerate}
    />
  );
}
