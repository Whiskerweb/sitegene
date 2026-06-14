"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { AkyraMark } from "@/components/ui/Logo";
import { WHEEL_SEGMENTS } from "@/lib/wheel";
import { TOUR_KICK_EVENT } from "@/components/tour/OnboardingTour";

type Phase = "idle" | "spinning" | "done";

const SEGMENTS = WHEEL_SEGMENTS as readonly number[];
const N = SEGMENTS.length;
const SLICE = 360 / N;
const SPIN_MS = 4600;

// Teintes par segment ; le dernier (jackpot) en doré.
const COLORS = ["#eff6ff", "#bfdbfe", "#eff6ff", "#bfdbfe", "#c7bfff", "#fbbf24"];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° = haut, sens horaire
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(i: number): string {
  const cx = 100,
    cy = 100,
    r = 98;
  const a0 = i * SLICE,
    a1 = (i + 1) * SLICE;
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

/**
 * Roue de la fortune de bienvenue — modal OBLIGATOIRE au 1er accès (un seul
 * spin par compte, garanti serveur). Le serveur décide du gain via
 * /api/wheel/spin ; la roue anime jusqu'au segment renvoyé puis crédite.
 * La révélation est déclenchée par la fin de transition OU un fallback timer
 * (jamais bloquée si la transition ne se déclenche pas).
 */
export default function WheelModal() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const rewardRef = useRef<number | null>(null);
  const revealedRef = useRef(false);
  const fallbackRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    // Amorce l'onboarding guidé (si pas déjà fait) puis le déclenche tout de
    // suite via un événement — indépendant du timing de re-render serveur.
    if (!window.localStorage.getItem("akyra_tour_v1")) {
      window.localStorage.setItem("akyra_tour_v1", "pending");
    }
    window.dispatchEvent(new Event(TOUR_KICK_EVENT));
    setClosed(true);
    router.refresh(); // recharge le solde + masque la roue (flag posé serveur)
  }, [router]);

  /** Révélation idempotente (transitionend OU fallback timer, le 1er gagne). */
  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    if (fallbackRef.current) window.clearTimeout(fallbackRef.current);
    setPhase("done");
    const jackpot = rewardRef.current === SEGMENTS[N - 1];
    confetti({
      particleCount: jackpot ? 220 : 120,
      spread: jackpot ? 110 : 75,
      startVelocity: jackpot ? 55 : 42,
      origin: { y: 0.4 },
      colors: ["#2563eb", "#22d3ee", "#7c3aed", "#fbbf24"],
    });
  }, []);

  const spin = useCallback(async () => {
    if (phase !== "idle") return;
    setPhase("spinning");
    setError(null);
    try {
      const res = await fetch("/api/wheel/spin", { method: "POST" });
      const data = (await res.json().catch(() => null)) as
        | { reward?: number; alreadySpun?: boolean; error?: string }
        | null;

      // Déjà tournée (double onglet / rejeu) → on referme proprement.
      if (res.status === 409 || data?.alreadySpun) {
        finish();
        return;
      }
      if (!res.ok || typeof data?.reward !== "number") {
        setError(data?.error ?? "Une erreur est survenue.");
        setPhase("idle");
        return;
      }

      const idx = SEGMENTS.indexOf(data.reward);
      const safeIdx = idx >= 0 ? idx : 0;
      // Amène le centre du segment gagnant sous le pointeur (haut), + 6 tours,
      // + léger décalage déterministe à l'intérieur de la part.
      const base = 360 - (safeIdx * SLICE + SLICE / 2);
      const jitter = (safeIdx * 53) % 31;
      rewardRef.current = data.reward;
      setReward(data.reward);
      setRotation(360 * 6 + base + (jitter - 15));
      // Fallback : si la transition ne se déclenche pas, on révèle quand même.
      fallbackRef.current = window.setTimeout(reveal, SPIN_MS + 600);
    } catch {
      setError("Connexion impossible. Réessayez.");
      setPhase("idle");
    }
  }, [phase, finish, reveal]);

  if (closed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Roue de bienvenue"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-night/45 p-4 backdrop-blur-sm"
    >
      <div className="liquid-glass relative w-full max-w-md rounded-3xl border border-sky-300 bg-white/85 p-8 text-center shadow-2xl">
        <AkyraMark size={36} className="mx-auto" />

        {phase !== "done" ? (
          <>
            <h2 className="mt-3 font-archivo text-2xl font-semibold text-black">
              Bienvenue ! Tournez la roue 🎡
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate">
              Gagnez vos crédits de bienvenue — ils servent à débloquer de
              nouveaux designs et effets pour rendre votre site encore plus beau.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 font-archivo text-2xl font-semibold text-black">
              {reward === SEGMENTS[N - 1] ? "JACKPOT 🎉" : "Bravo 🎉"}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate">
              Vous gagnez{" "}
              <span className="font-bold text-brand">{reward} crédits</span> !
              De quoi débloquer un nouveau design dans la boutique.
            </p>
          </>
        )}

        {/* Roue */}
        <div className="relative mx-auto mt-6 h-[260px] w-[260px]">
          {/* Pointeur */}
          <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[11px] border-t-[18px] border-x-transparent border-t-brand drop-shadow" />
          </div>
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full drop-shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
            style={{
              transformOrigin: "50% 50%",
              transform: `rotate(${rotation}deg)`,
              transition:
                phase === "idle"
                  ? "none"
                  : `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
            onTransitionEnd={reveal}
          >
            <circle cx="100" cy="100" r="99" fill="#fff" stroke="#bfdbfe" strokeWidth="2" />
            {SEGMENTS.map((val, i) => {
              const mid = i * SLICE + SLICE / 2;
              const p = polar(100, 100, 62, mid);
              // Coordonnées arrondies → strings déterministes (évite un mismatch
              // d'hydratation dû au bruit de virgule flottante serveur/client).
              const px = p.x.toFixed(2);
              const py = p.y.toFixed(2);
              return (
                <g key={i}>
                  <path d={slicePath(i)} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth="1.5" />
                  <text
                    x={px}
                    y={py}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${mid} ${px} ${py})`}
                    className="font-archivo"
                    fontSize="20"
                    fontWeight="800"
                    fill="#0f172a"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="14" fill="#2563eb" stroke="#fff" strokeWidth="3" />
          </svg>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

        <div className="mt-7">
          {phase === "done" ? (
            <button
              type="button"
              onClick={finish}
              className="w-full rounded-full bg-brand py-3.5 font-bold text-white transition hover:opacity-90"
            >
              Récupérer mes crédits
            </button>
          ) : (
            <button
              type="button"
              onClick={spin}
              disabled={phase === "spinning"}
              className="w-full rounded-full bg-brand py-3.5 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {phase === "spinning" ? "La roue tourne…" : "Tourner la roue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
