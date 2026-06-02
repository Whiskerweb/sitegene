import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

const fraunces = loadFraunces("normal", { weights: ["400", "600", "900"] });
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"] });
const caveat = loadCaveat("normal", { weights: ["600", "700"] });
const jakarta = loadJakarta("normal", { weights: ["700", "800"] });

export const FONT_FAMILIES = {
  fraunces: fraunces.fontFamily,
  inter: inter.fontFamily,
  caveat: caveat.fontFamily,
  jakarta: jakarta.fontFamily,
};

export const fontCssVars: React.CSSProperties = {
  // @ts-expect-error custom CSS vars
  "--ff-fraunces": fraunces.fontFamily,
  "--ff-inter": inter.fontFamily,
  "--ff-caveat": caveat.fontFamily,
  "--ff-jakarta": jakarta.fontFamily,
};
