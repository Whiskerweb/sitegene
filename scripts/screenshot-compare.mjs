/**
 * Capture côte à côte : ORIGINAL d'un template vs sa reconstruction par Mistral.
 * Sert à VÉRIFIER VISUELLEMENT la fidélité (le grep de classes ne suffit pas).
 *
 * Prérequis : un serveur HTTP servant la racine du repo sur :8765
 *   python3 -m http.server 8765 --bind 127.0.0.1 &
 *
 * Usage : node scripts/screenshot-compare.mjs eloctix
 * Sortie : docs/design-systems/tests/<id>/compare.png (côte à côte)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const tpl = process.argv[2] || "eloctix";
const base = "http://127.0.0.1:8765";
const outDir = `docs/design-systems/tests/${tpl}`;
fs.mkdirSync(outDir, { recursive: true });

const shoot = (url, out, wait = 5000) =>
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--window-size=1280,1600",
    `--virtual-time-budget=${wait}`, `--screenshot=${out}`, url,
  ], { stdio: "ignore" });

console.log("Capture original…");
shoot(`${base}/public/_templates/${tpl}/index.html`, `${outDir}/_original.png`, 6000);
console.log("Capture reconstruction…");
shoot(`${base}/${outDir}/full-site.html`, `${outDir}/_generated.png`, 5000);

// Composite côte à côte.
const sbs = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#222;font-family:system-ui}.row{display:flex}.c{flex:1}
.c h3{color:#fff;font-size:14px;margin:0;padding:8px 12px;background:#000;text-align:center}
img{width:100%;display:block}</style></head><body><div class="row">
<div class="c"><h3>ORIGINAL — ${tpl}</h3><img src="_original.png"></div>
<div class="c"><h3>RECONSTRUIT par Mistral (design-system.md)</h3><img src="_generated.png"></div>
</div></body></html>`;
fs.writeFileSync(`${outDir}/_sbs.html`, sbs);
shoot(`${base}/${outDir}/_sbs.html`, `${outDir}/compare.png`, 1500);
console.log(`→ ${outDir}/compare.png`);
