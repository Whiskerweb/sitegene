import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { EASE_INOUT } from "../theme/easing";
import { DemoProfile } from "../profiles";

export const S4Navigation: React.FC<{ profile: DemoProfile }> = ({ profile }) => {
  const frame = useCurrentFrame();
  const Mockup = profile.Mockup;
  const { services, gallery } = profile.scroll;

  const scrollY = interpolate(
    frame,
    [0, 38, 70, 110, 120],
    [0, services, services + 30, gallery, gallery],
    { easing: EASE_INOUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, 38, 70, 110, 120], [1, 0.82, 1.16, 0.9, 0.92], {
    easing: EASE_INOUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [38, 70, 110], [0, -120, 0], {
    easing: EASE_INOUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `translateX(${panX}px) scale(${scale})` }}>
        <Mockup theme={profile.themeAt(0)} scrollY={scrollY} />
      </div>
    </AbsoluteFill>
  );
};
