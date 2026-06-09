"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { compressImages } from "@/lib/compress-image";
import SectionChecklist from "./SectionChecklist";

// Type local (miroir partiel de l'API — pas d'import du module server-side)
type SectionStatus = "pending" | "streaming" | "done" | "error";

interface BuildSection {
  key: string;
  title: string;
  status: SectionStatus;
}

interface BuildState {
  templateId: string | null;
  headerReady: boolean;
  sections: BuildSection[];
  allDone: boolean;
}

interface LiveBuildPanelProps {
  siteId: string;
  onAllDone: () => void;
}

const POLL_INTERVAL = 2500;

export default function LiveBuildPanel({ siteId, onAllDone }: LiveBuildPanelProps) {
  const [build, setBuild] = useState<BuildState | null>(null);
  const [nonce, setNonce] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  // Track previous done count + headerReady to detect changes
  const prevDoneCount = useRef(0);
  const prevHeaderReady = useRef(false);
  const onAllDoneRef = useRef(onAllDone);
  onAllDoneRef.current = onAllDone;

  useEffect(() => {
    if (!siteId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/build-state?siteId=${encodeURIComponent(siteId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data: BuildState = await res.json();

        const doneCount = data.sections.filter((s) => s.status === "done").length;

        // Bump nonce when a new section finishes or header just appeared
        if (doneCount > prevDoneCount.current || (data.headerReady && !prevHeaderReady.current)) {
          setNonce((n) => n + 1);
        }

        prevDoneCount.current = doneCount;
        prevHeaderReady.current = data.headerReady;
        setBuild(data);

        if (data.allDone) {
          clearInterval(intervalId);
          onAllDoneRef.current();
        }
      } catch {
        // silently ignore transient network errors
      }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [siteId]);

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
        if (res.ok && Array.isArray(data.photoUrls)) {
          setPhotoCount((c) => c + data.photoUrls.length);
          setNonce((n) => n + 1); // force iframe reload with new photos applied
        }
      } finally {
        setUploading(false);
      }
    },
    [siteId],
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white shadow-sm">
      {/* Header strip */}
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <Sparkles className="mt-0.5 h-4 w-4 flex-none text-sky-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            On construit votre site en direct
          </p>
          {build && (
            <div className="mt-2">
              <SectionChecklist
                headerReady={build.headerReady}
                sections={build.sections}
              />
            </div>
          )}
          {!build && (
            <p className="mt-1 text-xs text-slate-400">Connexion en cours…</p>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="relative" style={{ aspectRatio: "16 / 10" }}>
        {build?.headerReady ? (
          /* Iframe avec transition de fondu à chaque bump de nonce */
          <div
            key={nonce}
            className="absolute inset-0 animate-[fadeIn_0.4s_ease-out_both]"
          >
            <iframe
              key={nonce}
              src={`/api/onboarding/live-preview?siteId=${encodeURIComponent(siteId)}&n=${nonce}`}
              className="h-full w-full"
              title="Aperçu en direct"
            />
          </div>
        ) : (
          /* Skeleton animé — identique au composant AiOnboardingClient phase header */
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

      {/* Photo upload affordance */}
      <div className="border-t border-slate-100 px-5 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50 hover:ring-sky-300 transition-colors">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          ) : (
            <ImagePlus className="h-4 w-4 text-sky-500" />
          )}
          <span>
            {photoCount > 0
              ? `${photoCount} photo(s) ajoutée(s) — en ajouter`
              : "Ajouter mes photos"}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
