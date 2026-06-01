// node --import tsx scripts/test-notes-selector.mjs
import { parsePinSelector } from "../lib/notes-selector.ts";

let fails = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fails++;
    console.error("✗", msg);
  } else console.log("✓", msg);
};

const valid = parsePinSelector({
  cssSelector: "section:nth-of-type(2)>button",
  label: "bouton « X »",
  xPct: 50,
  yPct: 12.3456,
});
ok(valid && valid.cssSelector.startsWith("section"), "selector valide accepté");
ok(valid && valid.yPct === 12.35, "yPct arrondi à 2 décimales");
ok(valid && valid.path === undefined, "path absent → omis");

ok(parsePinSelector({ cssSelector: "", label: "x", xPct: 1, yPct: 1 }) === null, "cssSelector vide rejeté");
ok(parsePinSelector({ cssSelector: "a", label: "x", xPct: 200, yPct: 1 }) === null, "xPct hors borne rejeté");
ok(parsePinSelector(null) === null, "null rejeté");
ok(
  parsePinSelector({ cssSelector: "a", label: "x", xPct: 1, yPct: 1, path: "hero.title[0]" })?.path ===
    "hero.title[0]",
  "path conservé",
);

const withOffset = parsePinSelector({
  cssSelector: "a",
  label: "x",
  xPct: 1,
  yPct: 1,
  offset: { dx: 1.5, dy: -0.2 },
});
ok(withOffset?.offset?.dx === 1 && withOffset?.offset?.dy === 0, "offset clampé entre 0 et 1");
ok(parsePinSelector({ cssSelector: "a", label: "x", xPct: 1, yPct: 1 })?.offset === undefined, "offset absent → omis");

console.log(fails === 0 ? "\nTOUS OK" : `\n${fails} ÉCHEC(S)`);
process.exit(fails === 0 ? 0 : 1);
