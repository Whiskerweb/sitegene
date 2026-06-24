"use client";

/**
 * Retour qualité EN TEMPS RÉEL d'une description, sous le champ texte. À chaque
 * frappe on rejoue `diagnose(text)` (pur, local, instantané — aucun réseau) et
 * on affiche : (a) un badge label + score coloré selon le ton, (b) une jauge à
 * dégradé fixe rouge→vert masquée par un rectangle gris à left:{score}% avec un
 * curseur rond blanc (transition 300 ms ease-out), (c) la liste des questions
 * restantes (icône info ambrée), (d) un message de félicitation quand le ton
 * passe au vert.
 */

import { useMemo } from "react";
import { Info, Check } from "lucide-react";
import { diagnose, type Tone } from "@/lib/foundry/describe-quality";

const TONE_UI: Record<Tone, { badge: string; score: string }> = {
  red: { badge: "bg-red-50 text-red-600 ring-red-200", score: "text-red-600" },
  amber: { badge: "bg-amber-50 text-amber-700 ring-amber-200", score: "text-amber-600" },
  green: { badge: "bg-green-50 text-green-700 ring-green-200", score: "text-green-600" },
};

export default function DescriptionQuality({ text }: { text: string }) {
  const { score, label, tone, tips } = useMemo(() => diagnose(text), [text]);
  if (!text.trim()) return null;

  const ui = TONE_UI[tone];

  return (
    <div className="mt-3">
      {/* (a) Badge label + score */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ring-1 ${ui.badge}`}
        >
          {tone === "green" && <Check size={13} />}
          {label}
        </span>
        <span className={`text-[12.5px] font-bold tabular-nums ${ui.score}`}>{score}%</span>
      </div>

      {/* (b) Jauge : dégradé fixe rouge→vert, masqué à droite du score, + curseur */}
      <div className="relative mt-2 h-2.5">
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ background: "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)" }}
        >
          <div
            className="absolute inset-y-0 right-0 bg-[rgb(var(--m-elevated))] transition-[left] duration-300 ease-out"
            style={{ left: `${score}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-[left] duration-300 ease-out"
          style={{ left: `${score}%` }}
          aria-hidden
        />
      </div>

      {/* (c) Questions restantes — aide non obligatoire */}
      {tips.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-1.5 text-[12.5px] text-[rgb(var(--m-muted))]">
              <Info size={13} className="mt-px shrink-0 text-amber-500" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {/* (d) Félicitation en vert */}
      {tone === "green" && (
        <p className="mt-2 text-[12.5px] font-medium text-green-600">
          🎉 Parfait — votre description a tout ce qu'il faut pour un super site.
        </p>
      )}
    </div>
  );
}
