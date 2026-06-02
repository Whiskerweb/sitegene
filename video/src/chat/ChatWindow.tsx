import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { GlassPanel } from "../shared/GlassPanel";
import { AkyraMark } from "../shared/AkyraMark";
import { TypeWriter } from "../shared/TypeWriter";
import { GOLD, MINT, NIGHT, SLATE } from "../theme/tokens";
import { SPRING_SMOOTH } from "../theme/easing";

export const CHAT = {
  left: 560,
  top: 286,
  width: 800,
  height: 496,
  inputY: 690,
  inputCaretX: 648,
  inputCaretY: 718,
  attachRowY: 636,
};

export const ChatWindow: React.FC<{ typeFrom: number; message: string }> = ({ typeFrom, message }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SPRING_SMOOTH });
  const panelY = interpolate(enter, [0, 1], [40, 0]);
  const panelOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: CHAT.left,
        top: CHAT.top,
        width: CHAT.width,
        height: CHAT.height,
        transform: `translateY(${panelY}px)`,
        opacity: panelOpacity,
      }}
    >
      <GlassPanel radius={30} style={{ width: "100%", height: "100%" }}>
        <div style={{ padding: "26px 30px", height: "100%", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AkyraMark size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--ff-fraunces), serif", fontWeight: 600, fontSize: 20, color: NIGHT }}>Akyra</div>
              <div style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 13, color: SLATE, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: MINT }} />
                Assistant · en ligne
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 26,
              maxWidth: 440,
              background: "rgba(255,255,255,0.85)",
              borderRadius: "4px 20px 20px 20px",
              padding: "14px 18px",
              fontFamily: "var(--ff-inter), sans-serif",
              fontSize: 16,
              color: NIGHT,
              boxShadow: "0 6px 18px rgba(30,60,110,0.08)",
            }}
          >
            Bonjour 👋 Décrivez votre activité, j'génère votre site.
          </div>

          <div
            style={{
              position: "absolute",
              left: 30,
              right: 30,
              top: CHAT.inputY - CHAT.top,
              height: 66,
              borderRadius: 18,
              background: "#fff",
              border: "1px solid rgba(37,99,235,0.25)",
              boxShadow: "0 8px 24px rgba(30,60,110,0.1)",
              display: "flex",
              alignItems: "center",
              padding: "0 14px 0 18px",
              gap: 12,
            }}
          >
            <span style={{ fontFamily: "var(--ff-inter), sans-serif", fontSize: 18, color: NIGHT, flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
              <TypeWriter text={message} from={typeFrom} cps={30} />
            </span>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: `linear-gradient(180deg, ${GOLD.from}, ${GOLD.to})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 6px 16px ${GOLD.to}66`,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 12 L20 4 L13 20 L11 13 Z" fill="#3a2600" />
              </svg>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
