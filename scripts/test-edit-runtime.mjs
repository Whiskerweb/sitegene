// node --import tsx scripts/test-edit-runtime.mjs
// Valide que le JS injecté dans l'iframe (runtime d'édition) est syntaxiquement
// correct (le build TS ne vérifie pas le contenu d'une string) + features présentes.
import { injectEditChrome } from "../lib/edit-runtime.ts";

const html = injectEditChrome(
  "<html><head></head><body><div></div></body></html>",
  { editableFields: [{ path: "services[].name", type: "text", maxLen: 40 }] },
);

let fails = 0;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((s, i) => {
  try {
    new Function(s);
    console.log(`✓ script ${i} parse OK (${s.length} chars)`);
  } catch (e) {
    fails++;
    console.error(`✗ script ${i} SYNTAX:`, e.message);
  }
});

const all = scripts.join("\n");
for (const k of ["sg:note", "sg-badge", "sg:mode", "sg:pins", "buildSelector", "PHOTO ↺"]) {
  if (all.includes(k)) console.log("✓ contient", k);
  else {
    fails++;
    console.error("✗ manque", k);
  }
}

console.log(fails === 0 ? "\nTOUS OK" : `\n${fails} ÉCHEC(S)`);
process.exit(fails === 0 ? 0 : 1);
