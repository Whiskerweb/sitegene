"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeIntake, type IntakePayload } from "@/lib/intake-store";
import { getCategory, DEFAULT_CATEGORY } from "@/lib/categories";
import { compressImages } from "@/lib/compress-image";
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

    // Compression client + plafond de taille total (~4 Mo) : la limite serverless
    // Vercel est ~4,5 Mo ; au-delà la requête revient en 413 (pas du JSON).
    try {
      const compressed = await compressImages(payload.photos);
      const MAX_TOTAL = 4_000_000;
      let total = 0;
      for (const f of compressed) {
        if (total + f.size > MAX_TOTAL) break; // on s'arrête avant de dépasser
        total += f.size;
        fd.append("photo", f);
      }
    } catch {
      // si la compression plante, on tente sans photos plutôt que d'échouer
    }

    try {
      const res = await fetch("/api/prospect/generate", {
        method: "POST",
        body: fd,
      });
      // Parsing défensif : un 413/500 renvoie du texte, pas du JSON.
      const raw = await res.text();
      let data: (Result & { error?: string }) | null = null;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          res.status === 413
            ? "Vos photos sont trop volumineuses. Réessayez avec moins de photos."
            : `Le serveur a renvoyé une erreur (${res.status}).`,
        );
      }
      if (!res.ok || !data) throw new Error(data?.error || "Génération impossible.");

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
      <section className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-ink-900 px-6">
        <div aria-hidden className="glow-violet pointer-events-none absolute left-1/2 top-0 h-[360px] w-full max-w-[1100px] -translate-x-1/2" />
        <div className="relative z-10 w-full max-w-[460px] rounded-2xl border border-[var(--line-strong)] bg-ink-800 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <p className="text-[16px] font-semibold text-paper">
            La génération a échoué.
          </p>
          <p className="mt-2 text-[14.5px] text-muted">{error}</p>
          <button
            type="button"
            onClick={() => payloadRef.current && run(payloadRef.current)}
            className="btn-violet mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-[14px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Réessayer la génération
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-3 block w-full rounded-full border border-[var(--line-strong)] bg-white/[0.03] px-6 py-3 text-[13px] font-semibold text-paper transition hover:bg-white/[0.06]"
          >
            Modifier mon brief ou mes options
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 block w-full text-[12px] text-faint transition hover:text-muted"
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
