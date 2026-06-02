import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { AiOrb } from "../shared/AiOrb";
import { ShimmerBar } from "../shared/ShimmerBar";
import { GlassPanel } from "../shared/GlassPanel";
import { NIGHT, SLATE } from "../theme/tokens";

const STEPS = [
  "Analyse de votre activité…",
  "Sélection du modèle & des couleurs…",
  "Intégration de vos photos…",
  "Mise en ligne…",
];

export const S2Generation: React.FC = () => {
  const frame = useCurrentFrame();
  const stepIdx = Math.min(STEPS.length - 1, Math.floor(frame / 17));
  const panelEnter = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: panelEnter, transform: `scale(${interpolate(panelEnter, [0, 1], [0.94, 1])})` }}>
        <GlassPanel radius={34} style={{ width: 620, padding: "56px 60px 50px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <AiOrb size={130} from={0} />
            <div style={{ marginTop: 36, fontFamily: "var(--ff-fraunces), serif", fontWeight: 600, fontSize: 30, color: NIGHT, textAlign: "center" }}>
              Création de votre site
            </div>
            <div style={{ marginTop: 10, height: 24, fontFamily: "var(--ff-inter), sans-serif", fontSize: 17, color: SLATE }}>
              {STEPS[stepIdx]}
            </div>
            <div style={{ marginTop: 26 }}>
              <ShimmerBar from={6} duration={60} width={460} />
            </div>
          </div>
        </GlassPanel>
      </div>

      <Sequence from={67}>
        <FinalFlash />
      </Sequence>
    </AbsoluteFill>
  );
};

const FinalFlash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 4, 8], [0, 0.7, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#fff", opacity: o }} />;
};
