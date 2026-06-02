import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { InlineTextEditor } from "../site/InlineTextEditor";
import { EASE_SOFT } from "../theme/easing";
import { MINT } from "../theme/tokens";
import { DemoProfile } from "../profiles";

export const S5EditText: React.FC<{ profile: DemoProfile }> = ({ profile }) => {
  const frame = useCurrentFrame();
  const Mockup = profile.Mockup;
  const { scale: tScale, tx: tTx, ty: tTy } = profile.s5;

  const scale = interpolate(frame, [0, 20], [0.92, tScale], { easing: EASE_SOFT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = interpolate(frame, [0, 20], [0, tTx], { easing: EASE_SOFT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty = interpolate(frame, [0, 20], [0, tTy], { easing: EASE_SOFT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const titleNode = (
    <InlineTextEditor
      oldText={profile.edit.old}
      newText={profile.edit.new}
      selectFrom={30}
      eraseFrom={40}
      eraseTo={60}
      typeFrom={64}
      typeTo={86}
    />
  );

  const badge = interpolate(frame, [84, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
        <Mockup theme={profile.themeAt(0)} scrollY={0} titleNode={titleNode} />
      </div>

      <Sequence from={84}>
        <div
          style={{
            position: "absolute",
            left: profile.s5Badge.left,
            top: profile.s5Badge.top,
            opacity: badge,
            transform: `translateY(${interpolate(badge, [0, 1], [10, 0])}px)`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            borderRadius: 999,
            padding: "10px 18px",
            boxShadow: "0 12px 28px rgba(20,40,80,0.2)",
            fontFamily: "var(--ff-inter), sans-serif",
            fontWeight: 600,
            fontSize: 16,
            color: "#0e0e12",
          }}
        >
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: MINT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>
            ✓
          </span>
          Texte modifié
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
