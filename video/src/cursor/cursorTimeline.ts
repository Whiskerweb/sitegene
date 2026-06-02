// Fil rouge : timeline absolue (frames 0–640) des positions + états du curseur.
export type CursorState = "pointer" | "text" | "grab" | "grabbing";
export type CursorKey = { f: number; x: number; y: number; s: CursorState };

export const CURSOR_KEYS: CursorKey[] = [
  { f: 0, x: 1780, y: 1140, s: "pointer" },
  { f: 16, x: 642, y: 722, s: "text" },
  { f: 98, x: 642, y: 722, s: "text" },
  { f: 106, x: 1500, y: 372, s: "grab" },
  { f: 120, x: 642, y: 662, s: "grabbing" },
  { f: 126, x: 1572, y: 532, s: "grab" },
  { f: 140, x: 702, y: 662, s: "grabbing" },
  { f: 144, x: 1496, y: 700, s: "grab" },
  { f: 150, x: 762, y: 662, s: "grabbing" },
  { f: 168, x: 1180, y: 820, s: "pointer" },
  { f: 224, x: 1330, y: 910, s: "pointer" },
  { f: 252, x: 1480, y: 940, s: "pointer" },
  { f: 284, x: 1360, y: 700, s: "pointer" },
  { f: 300, x: 1300, y: 420, s: "pointer" },
  { f: 345, x: 1240, y: 770, s: "pointer" },
  { f: 380, x: 1160, y: 360, s: "pointer" },
  { f: 404, x: 900, y: 470, s: "pointer" },
  { f: 420, x: 640, y: 540, s: "text" },
  { f: 436, x: 640, y: 540, s: "text" },
  { f: 494, x: 660, y: 540, s: "text" },
  { f: 512, x: 1380, y: 980, s: "grab" },
  { f: 528, x: 940, y: 974, s: "text" },
  { f: 600, x: 960, y: 974, s: "text" },
  { f: 640, x: 960, y: 974, s: "text" },
];

export const CLICK_FRAMES = [16, 120, 140, 150, 436, 442, 528];
