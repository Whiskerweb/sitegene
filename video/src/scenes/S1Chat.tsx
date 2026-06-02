import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ChatWindow, CHAT } from "../chat/ChatWindow";
import { PhotoDragCard } from "../chat/PhotoDragCard";
import { DemoProfile } from "../profiles";

export const S1Chat: React.FC<{ profile: DemoProfile }> = ({ profile }) => {
  const frame = useCurrentFrame();
  const trayOpacity = interpolate(frame, [95, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chipY = CHAT.attachRowY + 26;

  return (
    <AbsoluteFill>
      <ChatWindow typeFrom={22} message={profile.chatMessage} />

      <div
        style={{
          position: "absolute",
          left: 1430,
          top: 300,
          opacity: trayOpacity,
          fontFamily: "var(--ff-caveat), cursive",
          fontWeight: 700,
          fontSize: 30,
          color: "#2b4a7a",
          transform: "rotate(-4deg)",
        }}
      >
        {profile.trayLabel}
      </div>

      <PhotoDragCard img={profile.dragImages[0]} from={{ x: 1500, y: 372 }} to={{ x: 642, y: chipY }} start={106} />
      <PhotoDragCard img={profile.dragImages[1]} from={{ x: 1572, y: 532 }} to={{ x: 702, y: chipY }} start={126} />
      <PhotoDragCard img={profile.dragImages[2]} from={{ x: 1496, y: 700 }} to={{ x: 762, y: chipY }} start={144} />
    </AbsoluteFill>
  );
};
