import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const IconCloud = (p: IconProps) => (
  <svg {...base(p)}><path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 9.5 4 4 0 0 0 7 19h10.5Z" /></svg>
);
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
);
export const IconCredit = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></svg>
);
export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
);
export const IconExternal = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
);
export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconPhoto = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
);
export const IconSpark = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
export const IconPin = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" /><circle cx="12" cy="11" r="2.2" /></svg>
);
export const IconDesktop = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
);
export const IconTablet = (p: IconProps) => (
  <svg {...base(p)}><rect x="6" y="3" width="12" height="18" rx="2.5" /><path d="M11 18h2" /></svg>
);
export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}><rect x="8" y="3" width="8" height="18" rx="2.5" /><path d="M11 18h2" /></svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
);
export const IconMic = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
);
export const IconArrowUp = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
);
export const IconStar4 = ({ size = 20, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 1.5c.3 3.3 1.1 5.6 2.5 7s3.7 2.2 7 2.5c-3.3.3-5.6 1.1-7 2.5s-2.2 3.7-2.5 7c-.3-3.3-1.1-5.6-2.5-7s-3.7-2.2-7-2.5c3.3-.3 5.6-1.1 7-2.5s2.2-3.7 2.5-7Z" />
  </svg>
);
