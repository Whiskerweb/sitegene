// Génère public/_templates/<id>/default-content.json à partir du __DEFAULT_CONTENT__
// de chaque template. Les chemins d'images relatifs (img/pN.jpg) sont réécrits en
// absolus (/_templates/<id>/img/pN.jpg) pour servir un site SANS dépendre de l'URL.
// Lancer avec : node --import tsx scripts/dump-default-content.mjs
import { writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES = ["alice-r", "potozon", "target"];

function rewriteImages(obj, prefix) {
  if (typeof obj === "string") {
    return obj.startsWith("img/") ? `${prefix}/${obj}` : obj;
  }
  if (Array.isArray(obj)) return obj.map((v) => rewriteImages(v, prefix));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = rewriteImages(v, prefix);
    return out;
  }
  return obj;
}

for (const id of TEMPLATES) {
  const mod = await import(
    join(ROOT, "templates", id, "src", "data", "content.ts")
  );
  const def = mod.__DEFAULT_CONTENT__;
  if (!def) throw new Error(`__DEFAULT_CONTENT__ introuvable dans ${id}`);
  const prefix = `/_templates/${id}`;
  const content = rewriteImages(structuredClone(def), prefix);
  // Galerie absolue (alice-r / target dérivent la galerie de galleryOrder).
  if (Array.isArray(content.galleryOrder)) {
    content.gallery = content.galleryOrder.map(
      (n) => `${prefix}/img/p${n}.jpg`,
    );
  }
  const out = join(ROOT, "public", "_templates", id, "default-content.json");
  writeFileSync(out, JSON.stringify(content, null, 2));

  // Copie le manifest source dans public/ (consommé par le formulaire opérateur).
  const manifestSrc = join(ROOT, "templates", id, "manifest.json");
  if (existsSync(manifestSrc)) {
    copyFileSync(manifestSrc, join(ROOT, "public", "_templates", id, "manifest.json"));
  }
  console.log(`✓ ${id}: ${Object.keys(content).length} champs + manifest → ${out}`);
}
