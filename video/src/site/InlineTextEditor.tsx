import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export const InlineTextEditor: React.FC<{
  oldText: string;
  newText: string;
  selectFrom: number;
  eraseFrom: number;
  eraseTo: number;
  typeFrom: number;
  typeTo: number;
  style?: React.CSSProperties;
  selectionColor?: string;
}> = ({
  oldText,
  newText,
  selectFrom,
  eraseFrom,
  eraseTo,
  typeFrom,
  typeTo,
  style,
  selectionColor = "rgba(37,99,235,0.45)",
}) => {
  const frame = useCurrentFrame();
  const selected = frame >= selectFrom && frame < eraseFrom;

  let content: string;
  if (frame < eraseFrom) {
    content = oldText;
  } else if (frame < eraseTo) {
    const n = Math.floor(
      interpolate(frame, [eraseFrom, eraseTo], [oldText.length, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
    content = oldText.slice(0, n);
  } else if (frame < typeFrom) {
    content = "";
  } else {
    const n = Math.floor(
      interpolate(frame, [typeFrom, typeTo], [0, newText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
    content = newText.slice(0, n);
  }

  const editing = frame >= eraseFrom && frame < typeTo + 8;
  const caretOn = Math.floor(frame / 12) % 2 === 0;

  return (
    <span style={{ position: "relative", ...style }}>
      <span
        style={{
          background: selected ? selectionColor : "transparent",
          borderRadius: 4,
          padding: selected ? "0 4px" : 0,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {content}
      </span>
      {editing && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: "0.92em",
            background: "#2563eb",
            marginLeft: 3,
            transform: "translateY(0.08em)",
            opacity: caretOn ? 1 : 0,
          }}
        />
      )}
    </span>
  );
};
