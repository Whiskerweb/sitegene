import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const TypeWriter: React.FC<{
  text: string;
  from: number;
  cps?: number;
  showCaret?: boolean;
  style?: React.CSSProperties;
  caretColor?: string;
}> = ({ text, from, cps = 26, showCaret = true, style, caretColor = "#2563eb" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - from);
  const chars = Math.min(text.length, Math.floor((local / fps) * cps));
  const shown = text.slice(0, chars);
  const done = chars >= text.length;
  const caretOn = Math.floor(frame / 15) % 2 === 0;

  return (
    <span style={style}>
      {shown}
      {showCaret && (!done || caretOn) && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: caretColor,
            marginLeft: 2,
            transform: "translateY(0.12em)",
            opacity: done && !caretOn ? 0 : 1,
          }}
        />
      )}
    </span>
  );
};
