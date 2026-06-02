import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { EASE_SOFT } from "../theme/easing";
import { CURSOR_KEYS, CLICK_FRAMES, CursorState } from "./cursorTimeline";

export const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const frames = CURSOR_KEYS.map((k) => k.f);
  const x = interpolate(frame, frames, CURSOR_KEYS.map((k) => k.x), {
    easing: EASE_SOFT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, frames, CURSOR_KEYS.map((k) => k.y), {
    easing: EASE_SOFT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let state: CursorState = "pointer";
  for (const k of CURSOR_KEYS) {
    if (frame >= k.f) state = k.s;
  }

  let clickScale = 1;
  for (const cf of CLICK_FRAMES) {
    if (frame >= cf && frame < cf + 12) {
      const p = spring({ frame: frame - cf, fps, config: { damping: 9, mass: 0.4, stiffness: 240 } });
      clickScale = 1 - 0.22 * Math.sin(p * Math.PI);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px) scale(${clickScale})`,
        transformOrigin: "4px 4px",
        zIndex: 9999,
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 8px rgba(20,40,80,0.35))",
      }}
    >
      <CursorGlyph state={state} />
      <ClickRing frame={frame} />
    </div>
  );
};

const CursorGlyph: React.FC<{ state: CursorState }> = ({ state }) => {
  if (state === "text") {
    return (
      <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
        <path d="M11 3 V31 M6 3 H16 M6 31 H16" stroke="#0e0e12" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M11 3 V31 M6 3 H16 M6 31 H16" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }
  if (state === "grab" || state === "grabbing") {
    const open = state === "grab";
    return (
      <svg width="40" height="42" viewBox="0 0 40 42" fill="none">
        <path
          d={
            open
              ? "M14 20 V11 a3 3 0 0 1 6 0 V10 a3 3 0 0 1 6 0 V12 a3 3 0 0 1 6 0 V22 c0 8-4 16-13 16 -7 0-11-5-13-11 l-2-6 a3 3 0 0 1 5-3 l2 4"
              : "M14 22 V15 a3 3 0 0 1 6 0 V14 a3 3 0 0 1 6 0 V16 a3 3 0 0 1 6 0 V24 c0 7-4 13-13 13 -7 0-11-4-13-9 l-1-4 a3 3 0 0 1 5-2 l2 3"
          }
          fill="#ffffff"
          stroke="#0e0e12"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
      <path d="M5 3 L5 27 L11 21 L15 30 L19 28 L15 19 L23 19 Z" fill="#ffffff" stroke="#0e0e12" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

const ClickRing: React.FC<{ frame: number }> = ({ frame }) => {
  let ring: { scale: number; opacity: number } | null = null;
  for (const cf of CLICK_FRAMES) {
    if (frame >= cf && frame < cf + 16) {
      const p = interpolate(frame - cf, [0, 16], [0, 1], { extrapolateRight: "clamp" });
      ring = { scale: 0.4 + p * 1.6, opacity: (1 - p) * 0.5 };
    }
  }
  if (!ring) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 2,
        top: 2,
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        borderRadius: "50%",
        border: "2px solid rgba(37,99,235,0.9)",
        transform: `scale(${ring.scale})`,
        opacity: ring.opacity,
      }}
    />
  );
};
