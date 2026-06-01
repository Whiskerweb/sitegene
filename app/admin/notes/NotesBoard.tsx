"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Sel = {
  path?: string;
  cssSelector: string;
  label: string;
  xPct: number;
  yPct: number;
  offset?: { dx: number; dy: number };
} | null;
type Note = { id: string; message: string; status: string; selector: Sel };
type Pos = { id: string; n: number; x: number; y: number };

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "À traiter", color: "text-gold-400" },
  in_progress: { label: "En cours (Claude)", color: "text-violet-400" },
  done: { label: "Fait", color: "text-mint-400" },
  rejected: { label: "Refusé", color: "text-faint" },
};

export default function NotesBoard({
  slug,
  isLive,
  notes,
}: {
  slug: string | null;
  isLive: boolean;
  notes: Note[];
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(notes.map((n) => [n.id, n.status])),
  );

  const pinned = notes.filter((n) => n.selector);

  const reposition = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    const doc = win?.document;
    if (!win || !doc) return;
    const docW = doc.documentElement.scrollWidth || 1;
    const docH = doc.documentElement.scrollHeight || 1;
    const sx = win.scrollX || 0;
    const sy = win.scrollY || 0;
    // Pin au point cliqué (document), converti en coordonnées de l'iframe visible.
    const next: Pos[] = pinned.map((n, i) => {
      const s = n.selector!;
      return {
        id: n.id,
        n: i + 1,
        x: (s.xPct / 100) * docW - sx,
        y: (s.yPct / 100) * docH - sy,
      };
    });
    setPositions(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      reposition();
      const win = iframe.contentWindow;
      win?.addEventListener("scroll", reposition, true);
      win?.addEventListener("resize", reposition);
    };
    iframe.addEventListener("load", onLoad);
    const t = setInterval(reposition, 1500); // re-render lazy images / fonts
    return () => {
      iframe.removeEventListener("load", onLoad);
      clearInterval(t);
    };
  }, [reposition]);

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/operator/notes/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId: id }),
      });
      if (res.ok) setStatuses((s) => ({ ...s, [id]: "in_progress" }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[16px] border border-line bg-ink-700 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-medium text-paper">{slug ? `/s/${slug}` : "site"}</span>
        <span className="text-faint">· {notes.length} demande(s)</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Site live + pins */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-black/30">
          {isLive && slug ? (
            <div className="relative h-[420px] overflow-auto">
              <iframe
                ref={iframeRef}
                src={`/s/${slug}`}
                title={`Site ${slug}`}
                className="h-[420px] w-full border-0"
              />
              <div className="pointer-events-none absolute inset-0">
                {positions.map((p) => (
                  <div
                    key={p.id}
                    className="absolute grid h-7 w-7 place-items-center rounded-[50%_50%_50%_0] text-xs font-extrabold text-white shadow-lg"
                    style={{
                      left: p.x,
                      top: p.y,
                      background: active === p.id ? "#2563eb" : "#e5412a",
                      outline: "2px solid #fff",
                      transform: "translate(-50%,-100%) rotate(-45deg)",
                    }}
                  >
                    <span style={{ transform: "rotate(45deg)" }}>{p.n}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid h-[420px] place-items-center text-sm text-faint">
              Site pas encore en ligne — pins indisponibles.
            </div>
          )}
        </div>

        {/* Panneau de notes */}
        <div className="space-y-2">
          {notes.map((n) => {
            const pinIndex = pinned.findIndex((p) => p.id === n.id);
            const st = statusLabel[statuses[n.id]] ?? statusLabel.open;
            return (
              <div
                key={n.id}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
                className="rounded-xl border border-line bg-ink-800 p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  {pinIndex >= 0 && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e5412a] text-[11px] font-bold text-white">
                      {pinIndex + 1}
                    </span>
                  )}
                  {n.selector?.label && (
                    <span className="text-violet-300">cible : {n.selector.label}</span>
                  )}
                  <span className={`ml-auto ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-sm text-paper/90">{n.message}</p>
                {statuses[n.id] === "open" && (
                  <button
                    onClick={() => approve(n.id)}
                    disabled={busy === n.id}
                    className="btn-violet mt-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy === n.id ? "…" : "Approuver"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
