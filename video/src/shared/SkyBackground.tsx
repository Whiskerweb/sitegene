import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SKY, GOLD } from "../theme/tokens";

export const SkyBackground: React.FC<{ drift?: number }> = ({ drift = 0 }) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin((frame / 240) * Math.PI * 2) * 2 + drift;
  const cloudFar = interpolate(frame, [0, 600], [0, -120]);
  const cloudMid = interpolate(frame, [0, 600], [0, -260]);
  const cloudNear = interpolate(frame, [0, 600], [0, -440]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${SKY[0]} 0%, ${SKY[1]} 22%, ${SKY[2]} 48%, ${SKY[3]} 74%, ${SKY[4]} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 42% at 78% ${10 + breathe}%, ${GOLD.core}cc 0%, ${GOLD.from}55 24%, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(80% 50% at 20% 108%, rgba(255,255,255,0.65) 0%, transparent 55%)`,
        }}
      />
      <Cloud x={120 + cloudFar} y={140} scale={1.1} opacity={0.35} blur={18} />
      <Cloud x={1320 + cloudFar} y={90} scale={1.4} opacity={0.3} blur={22} />
      <Cloud x={620 + cloudMid} y={300} scale={1.7} opacity={0.45} blur={16} />
      <Cloud x={1500 + cloudMid} y={420} scale={1.2} opacity={0.4} blur={14} />
      <Cloud x={260 + cloudNear} y={560} scale={2.1} opacity={0.55} blur={12} />
      <Cloud x={1080 + cloudNear} y={680} scale={1.6} opacity={0.5} blur={14} />
    </AbsoluteFill>
  );
};

const Cloud: React.FC<{ x: number; y: number; scale: number; opacity: number; blur: number }> = ({
  x,
  y,
  scale,
  opacity,
  blur,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 320 * scale,
      height: 120 * scale,
      opacity,
      filter: `blur(${blur}px)`,
      background:
        "radial-gradient(50% 60% at 30% 60%, #fff 0%, transparent 70%)," +
        "radial-gradient(45% 70% at 55% 45%, #fff 0%, transparent 72%)," +
        "radial-gradient(40% 55% at 75% 62%, #fff 0%, transparent 70%)",
    }}
  />
);
