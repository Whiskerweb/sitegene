import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { ORB, GOLD } from "../theme/tokens";
import { EASE_SOFT } from "../theme/easing";

export const ShimmerBar: React.FC<{ from: number; duration: number; width?: number }> = ({
  from,
  duration,
  width = 420,
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const base = interpolate(local, [0, duration], [0, 0.95], {
    easing: EASE_SOFT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pct = Math.min(1, local >= duration ? 1 : base);
  const shimX = ((local * 9) % (width + 160)) - 80;

  return (
    <div
      style={{
        width,
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.4)",
        overflow: "hidden",
        boxShadow: "inset 0 1px 2px rgba(30,60,110,0.15)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          width: `${pct * 100}%`,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${ORB[0]}, ${ORB[1]} 55%, ${GOLD.from})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shimX,
            width: 80,
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
          }}
        />
      </div>
    </div>
  );
};
