"use client";

/**
 * Surveille la génération du site en tâche de fond : poll l'état du job
 * `generate_site`, rafraîchit le dashboard quand c'est prêt, propose « Relancer »
 * en cas d'échec. N'affiche rien si aucune génération en cours.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, RotateCw } from "lucide-react";

type Status = "none" | "pending" | "running" | "done" | "error";

export default function GenerationWatcher({
  siteId,
  initialStatus,
}: {
  siteId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>((initialStatus as Status) || "none");
  const [relaunching, setRelaunching] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "pending" && status !== "running") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/site/generation-status?siteId=${encodeURIComponent(siteId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        const s = (data?.status as Status) ?? "none";
        setStatus(s);
        if (s === "done") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.refresh();
        } else if (s === "error") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* réessaie au prochain tick */
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, siteId, router]);

  const relaunch = useCallback(async () => {
    setRelaunching(true);
    try {
      const res = await fetch("/api/onboarding/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      if (res.ok) setStatus("pending");
    } finally {
      setRelaunching(false);
    }
  }, [siteId]);

  if (status === "none" || status === "done") return null;

  if (status === "error") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <span className="text-[15px] font-medium text-amber-900">
          La construction de votre site a échoué (surcharge passagère). Relancez-la.
        </span>
        <button
          onClick={relaunch}
          disabled={relaunching}
          className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {relaunching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          Relancer la génération
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
      <span className="relative">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <Loader2 className="absolute -inset-1.5 h-8 w-8 animate-spin text-violet-200" />
      </span>
      <span className="text-[15px] font-medium text-gray-900">
        On construit votre site sur-mesure… Il apparaîtra ici dès qu'il est prêt (gardez cette
        page ouverte, ça prend une minute ou deux).
      </span>
    </div>
  );
}
