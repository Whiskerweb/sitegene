import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { fontCssVars } from "./theme/fonts";
import { SkyBackground } from "./shared/SkyBackground";
import { Cursor } from "./cursor/Cursor";
import { S1Chat } from "./scenes/S1Chat";
import { S2Generation } from "./scenes/S2Generation";
import { S3Reveal } from "./scenes/S3Reveal";
import { S4Navigation } from "./scenes/S4Navigation";
import { S5EditText } from "./scenes/S5EditText";
import { S6EditAI } from "./scenes/S6EditAI";
import { BoundaryFlash } from "./transitions/BoundaryFlash";
import { Soundtrack } from "./audio/Soundtrack";
import { DemoProfile, BREVAL, ELOCTIX } from "./profiles";

export const SCENES = {
  s1: { from: 0, dur: 150 },
  s2: { from: 150, dur: 75 },
  s3: { from: 225, dur: 60 },
  s4: { from: 285, dur: 120 },
  s5: { from: 405, dur: 90 },
  s6: { from: 495, dur: 145 },
};

export const AkyraHero: React.FC<{ profile?: DemoProfile }> = ({ profile = BREVAL }) => {
  return (
    <AbsoluteFill style={fontCssVars}>
      <SkyBackground />

      <Sequence from={SCENES.s1.from} durationInFrames={SCENES.s1.dur} layout="none">
        <S1Chat profile={profile} />
      </Sequence>
      <Sequence from={SCENES.s2.from} durationInFrames={SCENES.s2.dur} layout="none">
        <S2Generation />
      </Sequence>
      <Sequence from={SCENES.s3.from} durationInFrames={SCENES.s3.dur} layout="none">
        <S3Reveal profile={profile} />
      </Sequence>
      <Sequence from={SCENES.s4.from} durationInFrames={SCENES.s4.dur} layout="none">
        <S4Navigation profile={profile} />
      </Sequence>
      <Sequence from={SCENES.s5.from} durationInFrames={SCENES.s5.dur} layout="none">
        <S5EditText profile={profile} />
      </Sequence>
      <Sequence from={SCENES.s6.from} durationInFrames={SCENES.s6.dur} layout="none">
        <S6EditAI profile={profile} />
      </Sequence>

      <BoundaryFlash at={150} tone="light" intensity={0.65} />
      <BoundaryFlash at={225} tone="gold" intensity={0.8} span={10} />
      <BoundaryFlash at={405} tone="glass" intensity={0.6} />
      <BoundaryFlash at={495} tone="glass" intensity={0.62} />

      <Cursor />
      <Soundtrack />
    </AbsoluteFill>
  );
};

export const BrevalHero: React.FC = () => <AkyraHero profile={BREVAL} />;
export const EloctixHero: React.FC = () => <AkyraHero profile={ELOCTIX} />;
