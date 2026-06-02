import { POTOZON, GOLD } from "../theme/tokens";

export type SiteTheme = {
  pageBg: string;
  pageBgAccent: string;
  text: string;
  textMuted: string;
  navText: string;
  navBg: string;
  cards: [string, string, string, string];
  cardText: string;
  cardTextAlt: string;
  galleryTint: string;
  ctaFrom: string;
  ctaTo: string;
  ctaText: string;
};

export const POTOZON_THEME: SiteTheme = {
  pageBg: "#fcfcfc",
  pageBgAccent: "#fff3d6",
  text: "#111111",
  textMuted: "#5b5b5b",
  navText: "#111111",
  navBg: "#ffffffee",
  cards: [POTOZON.red, POTOZON.yellow, POTOZON.orange, POTOZON.violet],
  cardText: "#ffffff",
  cardTextAlt: "#111111",
  galleryTint: "#111111",
  ctaFrom: GOLD.from,
  ctaTo: GOLD.to,
  ctaText: "#3a2600",
};

export const ALICE_THEME: SiteTheme = {
  pageBg: "#160d06",
  pageBgAccent: "#6b3a14",
  text: "#ffffff",
  textMuted: "#cbb9a6",
  navText: "#ffffff",
  navBg: "#1a1108cc",
  cards: ["#2a1c10", "#33240f", "#2e1d12", "#241812"],
  cardText: "#ffffff",
  cardTextAlt: "#ffffff",
  galleryTint: "#000000",
  ctaFrom: GOLD.from,
  ctaTo: GOLD.to,
  ctaText: "#3a2600",
};

function hexToRgba(hex: string): [number, number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return [r, g, b, a];
}

export function blendColor(a: string, b: string, t: number): string {
  const [r1, g1, b1, a1] = hexToRgba(a);
  const [r2, g2, b2, a2] = hexToRgba(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  const al = a1 + (a2 - a1) * t;
  return `rgba(${r},${g},${bl},${al.toFixed(3)})`;
}

export function blendTheme(from: SiteTheme, to: SiteTheme, t: number): SiteTheme {
  const c = (k: keyof SiteTheme) => blendColor(from[k] as string, to[k] as string, t);
  return {
    pageBg: c("pageBg"),
    pageBgAccent: c("pageBgAccent"),
    text: c("text"),
    textMuted: c("textMuted"),
    navText: c("navText"),
    navBg: c("navBg"),
    cards: [
      blendColor(from.cards[0], to.cards[0], t),
      blendColor(from.cards[1], to.cards[1], t),
      blendColor(from.cards[2], to.cards[2], t),
      blendColor(from.cards[3], to.cards[3], t),
    ],
    cardText: c("cardText"),
    cardTextAlt: c("cardTextAlt"),
    galleryTint: c("galleryTint"),
    ctaFrom: c("ctaFrom"),
    ctaTo: c("ctaTo"),
    ctaText: c("ctaText"),
  };
}
