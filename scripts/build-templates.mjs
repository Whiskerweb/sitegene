// Build un template Vite et copie dist/ → public/_templates/<id>/, puis dump.
// Usage : node scripts/build-templates.mjs alice-r [potozon target]
import { execSync } from "node:child_process";
import { cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ids = process.argv.slice(2);
if (!ids.length) throw new Error("usage: build-templates.mjs <id> [<id>...]");

for (const id of ids) {
  const src = join(ROOT, "templates", id);
  if (!existsSync(src)) throw new Error(`template introuvable: ${id}`);
  console.log(`▶ build ${id}`);
  execSync("npm run build", { cwd: src, stdio: "inherit" });
  const out = join(ROOT, "public", "_templates", id);
  // garde default-content.json / manifest.json (régénérés par le dump), remplace le reste
  for (const sub of ["assets", "img", "index.html"]) {
    rmSync(join(out, sub), { recursive: true, force: true });
  }
  cpSync(join(src, "dist"), out, { recursive: true });
  console.log(`✓ ${id} → public/_templates/${id}`);
}
// régénère default-content.json + manifest
execSync("node --import tsx scripts/dump-default-content.mjs", { cwd: ROOT, stdio: "inherit" });
