import React from "react";
import { GLASS, GLASS_BORDER, GLASS_BLUR } from "../theme/tokens";

export const GlassPanel: React.FC<{
  style?: React.CSSProperties;
  radius?: number;
  children?: React.ReactNode;
}> = ({ style, radius = 28, children }) => {
  return (
    <div
      style={{
        position: "relative",
        background: GLASS,
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: radius,
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.7), 0 24px 70px rgba(30,60,110,0.18)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 30%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
};
