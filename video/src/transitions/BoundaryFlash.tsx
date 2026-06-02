import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ORB, GOLD } from "../theme/tokens";

export const BoundaryFlash: React.FC<{
  at: number;
  span?: number;
  tone?: "light" | "gold" | "glass";
  intensity?: number;
}> = ({ at, span = 9, tone = "light", intensity = 0.6 }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < -span || d > span) return null;
  const k = 1 - Math.abs(d) / span;
  const o = interpolate(k, [0, 1], [0, intensity]);
  const sweepX = interpolate(d, [-span, span], [-30, 130]);

  let bg: string;
  if (tone === "gold") {
    bg = `radial-gradient(60% 60% at 50% 50%, ${GOLD.core} 0%, ${GOLD.from}cc 35%, transparent 72%)`;
  } else if (tone === "glass") {
    bg = `radial-gradient(70% 70% at 50% 50%, rgba(255,255,255,0.95) 0%, ${ORB[0]}55 45%, transparent 78%)`;
  } else {
    bg = `radial-gradient(75% 75% at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.6) 40%, transparent 75%)`;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: bg, opacity: o }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${sweepX}%`,
          width: "26%",
          height: "100%",
          transform: "skewX(-14deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
          opacity: o * 0.9,
          filter: "blur(6px)",
        }}
      />
    </AbsoluteFill>
  );
};
