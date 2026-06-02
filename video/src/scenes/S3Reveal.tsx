import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { EASE_SOFT } from "../theme/easing";
import { DemoProfile } from "../profiles";

export const S3Reveal: React.FC<{ profile: DemoProfile }> = ({ profile }) => {
  const frame = useCurrentFrame();
  const Mockup = profile.Mockup;

  const t = interpolate(frame, [0, 30], [0, 1], { easing: EASE_SOFT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(t, [0, 1], [0.84, 1]);
  const clip = interpolate(t, [0, 1], [46, 0]);
  const radius = interpolate(t, [0, 1], [80, 22]);
  const glow = interpolate(t, [0, 1], [0.45, 0.0]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: t,
          transform: `scale(${scale})`,
          clipPath: `inset(${clip / 2}% 0% ${clip / 2}% 0% round ${radius}px)`,
          filter: `drop-shadow(0 40px 90px rgba(30,60,110,${0.3 + glow}))`,
        }}
      >
        <Mockup theme={profile.themeAt(0)} scrollY={0} />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(50% 40% at 50% 50%, rgba(255,255,255,${glow}) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
