// Optimise des images (réduit le poids en gardant la qualité) avant publication.
// - redimensionne au plus long côté (défaut 2200px ; jamais d'agrandissement)
// - réencode en JPEG mozjpeg qualité 82 (ou WebP via --webp), métadonnées supprimées
// - conserve les noms de base (utiles : cli-build-site relie les images par basename)
//
// Usage :
//   node scripts/optimize-images.mjs --in <dossierEntree> --out <dossierSortie> \
//        [--max 2200] [--quality 82] [--webp]
//
// Astuce : pour partir d'URLs, télécharge-les d'abord dans <dossierEntree> (curl),
// puis lance ce script. Affiche le gain de poids total.
import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return process.argv.includes(`--${name}`) ? true : def;
}

const inDir = arg("in");
const outDir = arg("out");
const maxEdge = parseInt(arg("max", "2200"), 10);
const quality = parseInt(arg("quality", "82"), 10);
const toWebp = !!arg("webp", false);

if (!inDir || !outDir || !existsSync(inDir)) {
  console.error("Usage: optimize-images.mjs --in <dir> --out <dir> [--max 2200] [--quality 82] [--webp]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const files = readdirSync(inDir).filter((f) => EXT.has(extname(f).toLowerCase()));
if (!files.length) {
  console.error(`Aucune image dans ${inDir}`);
  process.exit(1);
}

let before = 0, after = 0, ok = 0;
for (const file of files) {
  const src = join(inDir, file);
  const stem = basename(file, extname(file));
  const outName = toWebp ? `${stem}.webp` : `${stem}.jpg`;
  const dst = join(outDir, outName);
  try {
    let img = sharp(src, { failOn: "none" }).rotate(); // respecte l'orientation EXIF
    img = img.resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true });
    img = toWebp ? img.webp({ quality }) : img.jpeg({ quality, mozjpeg: true });
    const info = await img.toFile(dst);
    before += statSync(src).size;
    after += info.size;
    ok++;
    console.log(`✓ ${file} → ${outName}  (${(info.size / 1024).toFixed(0)} Ko)`);
  } catch (e) {
    console.error(`✗ ${file}: ${e.message}`);
  }
}
const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`\n${ok}/${files.length} images optimisées. Poids : ${mb(before)} Mo → ${mb(after)} Mo ` +
  `(−${before ? Math.round((1 - after / before) * 100) : 0}%) dans ${outDir}`);
