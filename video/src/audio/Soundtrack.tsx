import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

const sfx = (name: string) => staticFile(`audio/sfx/${name}.wav`);

const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.7 }) => (
  <Sequence from={at} layout="none">
    <Audio src={sfx(name)} volume={volume} />
  </Sequence>
);

export const Soundtrack: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("audio/track.wav")} volume={0.5} />

      <Sequence from={22} durationInFrames={64} layout="none">
        <Audio src={sfx("typing")} volume={0.45} />
      </Sequence>
      <Sequence from={515} durationInFrames={44} layout="none">
        <Audio src={sfx("typing")} volume={0.4} />
      </Sequence>

      <Sfx at={14} name="click" volume={0.5} />
      <Sfx at={434} name="click" volume={0.55} />
      <Sfx at={440} name="click" volume={0.55} />
      <Sfx at={526} name="click" volume={0.5} />

      <Sfx at={118} name="pop" volume={0.7} />
      <Sfx at={138} name="pop" volume={0.7} />
      <Sfx at={148} name="pop" volume={0.7} />

      <Sfx at={161} name="riser" volume={0.5} />

      <Sfx at={143} name="whoosh" volume={0.6} />
      <Sfx at={214} name="whoosh-big" volume={0.75} />
      <Sfx at={398} name="whoosh" volume={0.55} />
      <Sfx at={488} name="whoosh" volume={0.58} />

      <Sfx at={226} name="chime" volume={0.6} />
      <Sfx at={489} name="chime" volume={0.45} />
      <Sfx at={603} name="chime" volume={0.6} />
    </>
  );
};
