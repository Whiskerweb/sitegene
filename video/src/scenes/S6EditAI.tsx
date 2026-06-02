import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { AiOrb } from "../shared/AiOrb";
import { AkyraMark } from "../shared/AkyraMark";
import { TypeWriter } from "../shared/TypeWriter";
import { GlassPanel } from "../shared/GlassPanel";
import { GOLD, NIGHT, SLATE, ORB } from "../theme/tokens";
import { SPRING_SMOOTH, EASE_SOFT } from "../theme/easing";
import { DemoProfile } from "../profiles";

const PROMPT = "Passe le site en mode soir, plus chic ✨";

export const S6EditAI: React.FC<{ profile: DemoProfile }> = ({ profile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Mockup = profile.Mockup;

  const tBlend = interpolate(frame, [56, 104], [0, 1], { easing: EASE_SOFT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const theme = profile.themeAt(tBlend);
  const thinking = frame >= 50 && frame < 72;

  const barEnter = spring({ frame: frame - 8, fps, config: SPRING_SMOOTH });
  const barY = interpolate(barEnter, [0, 1], [80, 0]);
  const barOpacity = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" });
  const barExit = interpolate(frame, [104, 116], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const endIn = interpolate(frame, [108, 128], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: "scale(0.95)" }}>
        <Mockup theme={theme} scrollY={0} />
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 100%, ${ORB[1]}${thinking ? "33" : "00"} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: "50%",
          marginLeft: -330,
          width: 660,
          transform: `translateY(${barY}px)`,
          opacity: barOpacity * barExit,
        }}
      >
        <GlassPanel radius={22} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, flexShrink: 0 }}>
              <AiOrb size={40} from={0} thinking={thinking} />
            </div>
            <span style={{ flex: 1, fontFamily: "var(--ff-inter), sans-serif", fontSize: 18, color: NIGHT, whiteSpace: "nowrap", overflow: "hidden" }}>
              <TypeWriter text={PROMPT} from={20} cps={30} />
            </span>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${ORB[0]}, ${ORB[2]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 12 L20 4 L13 20 L11 13 Z" fill="#fff" />
              </svg>
            </div>
          </div>
        </GlassPanel>
      </div>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: endIn,
          background: `rgba(248,251,255,${endIn * 0.82})`,
          backdropFilter: `blur(${endIn * 6}px)`,
        }}
      >
        <div style={{ transform: `scale(${interpolate(endIn, [0, 1], [0.9, 1])})`, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AkyraMark size={96} />
          </div>
          <div style={{ fontFamily: "var(--ff-fraunces), serif", fontWeight: 600, fontSize: 58, color: NIGHT, marginTop: 24, letterSpacing: "-0.02em" }}>
            Votre site, prêt en 10 secondes.
          </div>
          <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 22, color: SLATE, marginTop: 14 }}>
            Décrivez. Publiez. Modifiez quand vous voulez.
          </div>
          <div
            style={{
              display: "inline-flex",
              marginTop: 30,
              padding: "16px 34px",
              borderRadius: 999,
              background: `linear-gradient(180deg, ${GOLD.from}, ${GOLD.to})`,
              color: "#3a2600",
              fontFamily: "var(--ff-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              boxShadow: `0 14px 34px ${GOLD.to}66`,
            }}
          >
            akyra.io
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
