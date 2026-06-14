// lib/foundry/logo-colors.ts
// Extraction CLIENT (canvas) des couleurs dominantes « vives » d'un logo, pour
// la fonction « Accorder la charte à mon logo ». On ignore les fonds (blanc/noir)
// et les gris (saturation trop faible) pour ne garder que la/les teinte(s) de
// marque. Renvoie {accent, accent2} en hex, ou null si rien d'exploitable
// (logo monochrome, ou canvas « taché » par le CORS → on garde la charte telle quelle).
//
// Pur navigateur (document/canvas) : à n'appeler que côté client.

export type LogoColors = { accent: string; accent2: string };

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(clamp(c, 0, 1) * 255);
  };
  const toHex = (x: number) => x.toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // nécessaire pour lire les pixels (bucket public CORS)
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("logo load failed"));
    img.src = url;
  });
}

/**
 * 1 ou 2 couleurs de marque tirées d'un logo. Méthode : downscale 96px, histogramme
 * par secteur de teinte (12°), pondéré par saturation × opacité, fonds et gris
 * écartés. accent = secteur dominant ; accent2 = secteur le plus fort à ≥ 40° de
 * distance (ou une variante claire de l'accent si le logo est mono-teinte).
 */
export async function extractLogoColors(url: string): Promise<LogoColors | null> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(url);
  } catch {
    return null;
  }
  const W = 96;
  const ratio = img.naturalHeight / Math.max(1, img.naturalWidth);
  const w = W;
  const h = Math.max(1, Math.round(W * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null; // canvas taché (CORS) → on n'altère pas la charte
  }

  // 30 secteurs de teinte (12°). Pour chaque : poids cumulé + somme s/l (moyenne).
  const N = 30;
  const weight = new Array(N).fill(0);
  const sumS = new Array(N).fill(0);
  const sumL = new Array(N).fill(0);
  const sumH = new Array(N).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.5) continue; // pixels transparents (autour du logo) ignorés
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hue, s, l] = rgbToHsl(r, g, b);
    // Fonds & gris : trop clair, trop sombre, ou trop peu saturé → écartés.
    if (l > 0.94 || l < 0.06 || s < 0.18) continue;
    const bucket = clamp(Math.floor((hue / 360) * N), 0, N - 1);
    const wgt = s * alpha; // une teinte franche pèse plus qu'une pastel
    weight[bucket] += wgt;
    sumS[bucket] += s * wgt;
    sumL[bucket] += l * wgt;
    sumH[bucket] += hue * wgt;
  }

  const ranked = weight
    .map((wv, i) => ({ i, wv }))
    .filter((x) => x.wv > 0)
    .sort((a, b) => b.wv - a.wv);

  if (ranked.length === 0) return null; // logo monochrome (noir/blanc/gris) → no-op

  const colorOf = (idx: number): { hex: string; hue: number } => {
    const hue = sumH[idx] / weight[idx];
    // Saturation/luminosité plafonnées : un accent doit rester franc mais pas fluo.
    const s = clamp(sumS[idx] / weight[idx], 0.35, 0.82);
    const l = clamp(sumL[idx] / weight[idx], 0.32, 0.56);
    return { hex: hslToHex(hue, s, l), hue };
  };

  const top = colorOf(ranked[0].i);
  // accent2 : prochain secteur fort éloigné d'au moins 40° (vraie 2e teinte).
  const second = ranked.slice(1).find((x) => {
    const hue = sumH[x.i] / weight[x.i];
    const d = Math.abs(hue - top.hue);
    return Math.min(d, 360 - d) >= 40;
  });

  const accent = top.hex;
  const accent2 = second
    ? colorOf(second.i).hex
    : hslToHex(top.hue + 18, 0.5, 0.66); // mono-teinte → variante analogue claire

  return { accent, accent2 };
}
