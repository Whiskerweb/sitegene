import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ORB } from "../theme/tokens";
import { SPRING_POP } from "../theme/easing";

export const AiOrb: React.FC<{ size?: number; from?: number; thinking?: boolean }> = ({
  size = 120,
  from = 0,
  thinking = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - from;

  const rot = (frame * 2.4) % 360;
  const breatheHz = thinking ? 1.4 : 0.6;
  const breatheAmp = thinking ? 0.1 : 0.06;
  const breathe = 1 + breatheAmp * Math.sin((frame / fps) * Math.PI * 2 * breatheHz);
  const pop = spring({ frame: local, fps, config: SPRING_POP });
  const scale = Math.max(0, pop) * breathe;
  const glow = thinking ? 90 : 60;

  return (
    <div style={{ width: size, height: size, transform: `scale(${scale})`, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.4,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ORB[1]}66 0%, transparent 65%)`,
          filter: `blur(${glow * 0.4}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(from ${rot}deg, ${ORB[0]}, ${ORB[1]}, ${ORB[2]}, ${ORB[0]})`,
          boxShadow: `0 0 ${glow}px ${ORB[1]}80, inset 0 0 ${size * 0.3}px rgba(255,255,255,0.45)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(40% 35% at 35% 28%, rgba(255,255,255,0.9) 0%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.55)",
          filter: "blur(4px)",
        }}
      />
    </div>
  );
};
