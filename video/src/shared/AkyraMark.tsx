import React from "react";
import { GOLD } from "../theme/tokens";

export const AkyraMark: React.FC<{ size?: number; glow?: number }> = ({
  size = 64,
  glow = 1,
}) => {
  const id = "akyra-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ filter: `drop-shadow(0 4px 18px rgba(240,180,41,${0.5 * glow}))` }}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={GOLD.core} />
          <stop offset="55%" stopColor={GOLD.from} />
          <stop offset="100%" stopColor={GOLD.to} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke={GOLD.from} strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="24" stroke={GOLD.from} strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="18" stroke={GOLD.from} strokeOpacity="0.6" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="12" fill={`url(#${id})`} />
    </svg>
  );
};

export const AkyraLogo: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = "#0e0e12",
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
    <AkyraMark size={size} />
    <span
      style={{
        fontFamily: "var(--ff-fraunces), serif",
        fontWeight: 600,
        fontSize: size * 0.82,
        letterSpacing: "-0.02em",
        color,
      }}
    >
      Akyra
    </span>
  </div>
);
