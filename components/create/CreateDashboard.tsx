"use client";

import React, { useState, useRef, useEffect } from "react";
import { AkyraMark } from "@/components/ui/Logo";
import {
  IconCheck,
  IconPhoto,
  IconClose,
  IconCredit,
  IconSpark,
  IconStar4,
} from "@/components/ui/icons";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/templates";

// Briefs suggérés par défaut pour inspirer l'utilisateur
const SAMPLE_PROMPTS = [
  "Camille, photographe portrait & mariage à Lyon. Style chaleureux, lumière dorée et émotions volées.",
  "Atelier Beaumont, ébéniste créateur à Nantes. Lignes épurées, bois massif local et mobilier durable.",
  "Léo, producteur et DJ live à Marseille. Électro minimale et planante pour clubs branchés.",
];

export type CreateDashboardProps = {
  initialBrief?: string;
  initialCategoryId?: string;
  initialTemplateId?: string;
  initialPhotos?: File[];
  onGenerate: (data: {
    brief: string;
    categoryId: string;
    templateId: string;
    photos: File[];
  }) => void;
};

export default function CreateDashboard({
  initialBrief = "",
  initialCategoryId = "photographe",
  initialTemplateId = "alice-r",
  initialPhotos = [],
  onGenerate,
}: CreateDashboardProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [templateId, setTemplateId] = useState<string>(initialTemplateId);
  const [photos, setPhotos] = useState<File[]>(initialPhotos);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Génère les aperçus pour les fichiers photos locaux
  useEffect(() => {
    if (photos.length === 0) {
      setPhotoPreviews([]);
      return;
    }
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const activeCategory = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 8)); // Max 8 photos
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 8));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim()) return;
    onGenerate({
      brief,
      categoryId,
      templateId,
      photos,
    });
  };

  return (
    <div className="relative min-h-[100dvh] bg-ink-900 text-paper antialiased">
      {/* Halo lumineux ambiant */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-full max-w-[1200px] bg-[radial-gradient(ellipse_at_top,rgba(109,74,255,0.18),transparent_70%)]"
      />

      <div className="mx-auto max-w-[1240px] px-6 py-8 relative z-10">
        {/* En-tête du Dashboard */}
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-6 mb-10">
          <div className="flex items-center gap-2">
            <AkyraMark size={32} className="text-violet-400" />
            <span className="font-display text-xl font-bold tracking-tight">Akyra <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Studio</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-ink-800 px-3.5 py-1.5 text-[13px] font-semibold text-muted sm:flex">
              <IconCredit size={14} className="text-gold-400" />
              <span>Génération libre (5 crédits offerts)</span>
            </div>
            <a
              href="/"
              className="text-[13px] font-medium text-muted hover:text-white transition"
            >
              Retour
            </a>
          </div>
        </header>

        {/* Section Titre */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.02em] md:text-[40px]">
            Concevez votre site <span className="accent-gold">sur mesure.</span>
          </h1>
          <p className="mt-2 max-w-[56ch] text-[15px] text-muted">
            Décrivez votre univers créatif en quelques phrases. Notre IA assemble le modèle parfait, ajuste la typographie et met en page vos photos.
          </p>
        </div>

        {/* Formulaire Principal */}
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
          {/* PANNEAU DE CONTRÔLE GAUCHE (Brief & Photos) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Sélection Catégorie */}
            <div className="rounded-2xl border border-[var(--line-strong)] bg-ink-800 p-6">
              <label className="block text-[14px] font-semibold uppercase tracking-[0.1em] text-violet-400 mb-4">
                1. Votre Métier
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => c.active && setCategoryId(c.id)}
                      className={`relative flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition ${
                        active
                          ? "bg-violet-500 text-white shadow-[0_4px_14px_-2px_rgba(109,74,255,0.4)]"
                          : c.active
                          ? "bg-ink-700 hover:bg-ink-600 text-muted hover:text-white border border-[var(--line-strong)]"
                          : "bg-ink-800 opacity-40 text-faint border border-[var(--line-strong)] cursor-not-allowed"
                      }`}
                    >
                      {c.label}
                      {!c.active && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-ink-900 text-gold-400">
                          Bientôt
                        </span>
                      )}
                      {active && <IconCheck size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Le Brief (Prompt) */}
            <div className="rounded-2xl border border-[var(--line-strong)] bg-ink-800 p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-violet-500/5 blur-[50px] pointer-events-none" />
              <label className="block text-[14px] font-semibold uppercase tracking-[0.1em] text-violet-400 mb-4">
                2. Racontez votre projet
              </label>

              <div className="relative rounded-2xl border border-[var(--line-strong)] bg-ink-900 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30 transition-colors p-4">
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={activeCategory.briefPlaceholder}
                  className="w-full min-h-[140px] bg-transparent text-paper placeholder-faint outline-none text-[15px] leading-relaxed resize-none"
                  required
                />
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 mt-2 text-[12px] text-faint">
                  <span>Décrivez votre style, vos tons, vos spécialités…</span>
                  <span>{brief.length} caractères</span>
                </div>
              </div>

              {/* Suggestions de Brief */}
              <div className="mt-4">
                <span className="text-[12px] text-muted block mb-2">Exemples inspirants :</span>
                <div className="flex flex-col gap-2">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBrief(sample)}
                      className="text-left text-[12.5px] text-faint hover:text-gold-300 transition line-clamp-1 py-1.5 px-3 rounded-full border border-transparent hover:border-[var(--line-strong)] hover:bg-ink-700/60"
                    >
                      💡 &ldquo;{sample}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Téléversement Photos */}
            <div className="rounded-2xl border border-[var(--line-strong)] bg-ink-800 p-6">
              <label className="block text-[14px] font-semibold uppercase tracking-[0.1em] text-violet-400 mb-3">
                3. Glissez vos photos (Optionnel)
              </label>
              <p className="text-[12.5px] text-muted mb-4">
                Uploadez jusqu&apos;à 8 photos. Notre IA analysera leurs dominantes colorées pour parfaire le design.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? "border-violet-400 bg-violet-400/5 shadow-[inset_0_0_20px_rgba(109,74,255,0.1)]"
                    : "border-[var(--line-strong)] hover:border-violet-500/40 bg-ink-900/60 hover:bg-ink-900/90"
                }`}
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-muted border border-[var(--line-strong)] mb-3">
                  <IconPhoto size={22} className="text-violet-400" />
                </div>
                <p className="text-[14px] font-semibold text-paper">
                  Glissez-déposez vos fichiers ici
                </p>
                <p className="text-[12px] text-faint mt-1">
                  ou cliquez pour explorer votre ordinateur (JPG, PNG, WEBP)
                </p>
              </div>

              {/* Prévisualisations de photos locales */}
              {photoPreviews.length > 0 && (
                <div className="mt-5 grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {photoPreviews.map((url, idx) => (
                    <div
                      key={url}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--line-strong)] bg-ink-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Aperçu ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                      >
                        <IconClose size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PANNEAU DE MODÈLES DROITE (Modèles de référence) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-[var(--line-strong)] bg-ink-800 p-6 relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <label className="block text-[14px] font-semibold uppercase tracking-[0.1em] text-violet-400 mb-4">
                  4. Modèle de référence
                </label>
                <p className="text-[12.5px] text-muted mb-6">
                  Choisissez la structure de départ. L&apos;IA y intégrera votre palette, vos photographies et vos prestations.
                </p>

                {/* Modèles Grid */}
                <div className="space-y-4">
                  {/* Modèle 1: Alice R */}
                  <div
                    onClick={() => setTemplateId("alice-r")}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                      templateId === "alice-r"
                        ? "border-gold-400 bg-ink-700 shadow-[0_12px_32px_-8px_rgba(232,180,104,0.15)]"
                        : "border-[var(--line-strong)] hover:border-white/20 bg-ink-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-[#1c1a17] border border-gold-400/40" />
                        <div>
                          <p className="text-[14.5px] font-bold text-paper">Alice R</p>
                          <p className="text-[12px] text-faint">Chaleureux, Minimaliste, Clair-obscur</p>
                        </div>
                      </div>
                      {templateId === "alice-r" && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-ink-900 font-bold">
                          <IconCheck size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 relative h-28 overflow-hidden rounded-xl bg-ink-900/80 border border-white/5">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,180,104,0.06),transparent_80%)]" />
                      <div className="absolute bottom-2 left-3 text-[11px] font-serif italic text-gold-300">
                        Aurelia Studio photography
                      </div>
                    </div>
                  </div>

                  {/* Modèle 2: Potozon */}
                  <div
                    onClick={() => setTemplateId("potozon")}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                      templateId === "potozon"
                        ? "border-violet-400 bg-ink-700 shadow-[0_12px_32px_-8px_rgba(109,74,255,0.15)]"
                        : "border-[var(--line-strong)] hover:border-white/20 bg-ink-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-[#5226e0] border border-violet-400/40" />
                        <div>
                          <p className="text-[14.5px] font-bold text-paper">Potozon</p>
                          <p className="text-[12px] text-faint">Créatif, Audacieux, Pop éditorial</p>
                        </div>
                      </div>
                      {templateId === "potozon" && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-400 text-white font-bold">
                          <IconCheck size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 relative h-28 overflow-hidden rounded-xl bg-ink-900/80 border border-white/5">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(109,74,255,0.06),transparent_80%)]" />
                      <div className="absolute bottom-2 left-3 text-[11px] font-sans font-bold uppercase tracking-wider text-violet-400">
                        Potozon Agency focus
                      </div>
                    </div>
                  </div>

                  {/* Modèle 3: Target */}
                  <div
                    onClick={() => setTemplateId("target")}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                      templateId === "target"
                        ? "border-mint-400 bg-ink-700 shadow-[0_12px_32px_-8px_rgba(61,224,160,0.15)]"
                        : "border-[var(--line-strong)] hover:border-white/20 bg-ink-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-[#0a0a0a] border border-mint-400/40" />
                        <div>
                          <p className="text-[14.5px] font-bold text-paper">Target</p>
                          <p className="text-[12px] text-faint">Épuré, Suisse, Moderne-brutaliste</p>
                        </div>
                      </div>
                      {templateId === "target" && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-mint-400 text-ink-900 font-bold">
                          <IconCheck size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 relative h-28 overflow-hidden rounded-xl bg-ink-900/80 border border-white/5">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(61,224,160,0.06),transparent_80%)]" />
                      <div className="absolute bottom-2 left-3 text-[11px] font-mono text-mint-400">
                        Target. [2026] index structure
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de Soumission */}
              <div className="mt-8 pt-6 border-t border-[var(--line)]">
                <button
                  type="submit"
                  disabled={!brief.trim()}
                  className="w-full btn-violet py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  <IconSpark size={18} />
                  Générer mon site professionnel
                </button>

                <p className="text-[11.5px] text-faint text-center mt-3">
                  ✦ Aucun engagement · L&apos;aperçu est généré en moins de 15 secondes.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
