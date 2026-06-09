"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface RevealCelebrationProps {
  siteId: string;
  firstName: string | null;
  dashboardHref: string;
  publishSlot: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Dependency-free confetti burst
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = [
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#6ee7b7", // emerald-300
  "#fcd34d", // amber-300
  "#fb7185", // rose-400
];

function spawnConfetti(container: HTMLElement) {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes confettiFall {
      0%   { transform: translateY(-10px) rotate(var(--r0)) scale(1); opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translateY(100vh) rotate(var(--r1)) scale(0.6); opacity: 0; }
    }
    .confetti-piece {
      position: absolute;
      top: 0;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      pointer-events: none;
      animation: confettiFall var(--dur) var(--delay) ease-in both;
    }
  `;
  container.appendChild(style);

  const PIECE_COUNT = 40;
  const pieces: HTMLElement[] = [];

  for (let i = 0; i < PIECE_COUNT; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * 100; // %
    const r0 = Math.round(Math.random() * 360);
    const r1 = r0 + Math.round((Math.random() - 0.5) * 720);
    const dur = (1.8 + Math.random() * 1.4).toFixed(2) + "s";
    const delay = (Math.random() * 0.6).toFixed(2) + "s";

    el.style.cssText = [
      `background:${color}`,
      `left:${left.toFixed(1)}%`,
      `--r0:${r0}deg`,
      `--r1:${r1}deg`,
      `--dur:${dur}`,
      `--delay:${delay}`,
    ].join(";");

    container.appendChild(el);
    pieces.push(el);
  }

  // Auto-remove after max animation time (0.6s delay + 1.8+1.4s dur + 200ms buffer)
  setTimeout(() => {
    pieces.forEach((p) => p.remove());
    style.remove();
  }, 3200);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RevealCelebration({
  siteId,
  firstName,
  dashboardHref,
  publishSlot,
}: RevealCelebrationProps) {
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard: only run in browser
    if (typeof window === "undefined") return;
    try {
      if (confettiRef.current) {
        spawnConfetti(confettiRef.current);
      }
    } catch {
      // Silently swallow any confetti failure — never block the reveal
    }
  }, []);

  const heading = firstName
    ? `Bravo ${firstName}, votre site est prêt 🎉`
    : "Votre site est prêt 🎉";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900">
      {/* Confetti container — absolutely positioned, full-width, overflow-hidden */}
      <div
        ref={confettiRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
        aria-hidden="true"
      />

      {/* Dark hero banner — continuity with dashboard HeroBanner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-center text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-600/20 px-3 py-1 ring-1 ring-sky-500/40">
          <Sparkles className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
            Site généré
          </span>
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {heading}
        </h1>
        <p className="mt-2 text-slate-400 text-base max-w-md mx-auto">
          Votre site sur-mesure est en ligne — découvrez-le, puis publiez en un clic.
        </p>
      </div>

      {/* Preview iframe */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white shadow-sm">
          <iframe
            src={`/api/preview?siteId=${encodeURIComponent(siteId)}`}
            className="h-[70vh] w-full"
            title="Votre site"
          />
        </div>

        {/* CTA row */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* Primary: publishSlot supplied by parent (PaywallModal trigger) */}
          {publishSlot}

          {/* Secondary: dashboard link */}
          <a
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Voir mon tableau de bord
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
