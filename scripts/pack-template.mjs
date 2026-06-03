import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEGENE = join(__dirname, '..');
const REPO_ROOT = join(SITEGENE, '..');

/** Extrait l'objet littéral window.__SITE_CONTENT__ = (…||) {…}; du HTML. */
export function extractContent(html) {
  const m = html.match(/window\.__SITE_CONTENT__\s*=\s*(?:window\.__SITE_CONTENT__\s*\|\|\s*)?(\{[\s\S]*?\})\s*;/);
  if (!m) throw new Error('window.__SITE_CONTENT__ introuvable');
  return Function('"use strict";return (' + m[1] + ')')();
}

/** Récupère les chemins data-sg-path (textes) et data-sg-img (images). */
export function collectSgPaths(html) {
  const grab = (re) => {
    const out = new Set();
    let m;
    while ((m = re.exec(html))) out.add(m[1]);
    return [...out];
  };
  return {
    texts: grab(/data-sg-path="([^"]+)"/g),
    images: grab(/data-sg-img="([^"]+)"/g),
  };
}

/** 'releases[0].title' → 'releases[].title' (convention manifest). */
export function toFieldPath(path) {
  return path.replace(/\[\d+\]/g, '[]');
}

function getAt(obj, path) {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.')
    .reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function humanize(path) {
  return path.replace(/\[\]/g, '').replace(/\./g, ' · ');
}

function roleFor(path) {
  if (/cover|album/i.test(path)) return 'cover';
  if (/hero/i.test(path)) return 'hero';
  if (/avatar|portrait|team/i.test(path)) return 'avatar';
  if (/gallery|work|portfolio/i.test(path)) return 'gallery';
  return 'image';
}

/** Construit un manifest schema 2 (stub) à partir du contenu + chemins. */
export function buildManifestStub(id, content, sgPaths, name) {
  const fieldPaths = [...new Set(sgPaths.texts.map(toFieldPath))];
  const editable = fieldPaths.map((p) => {
    const concrete = p.includes('[]') ? p.replace('[]', '[0]') : p;
    const v = getAt(content, concrete);
    const len = typeof v === 'string' ? v.length : 0;
    return { path: p, label: humanize(p), type: 'text', maxLen: Math.max(40, Math.round(len * 1.6)) };
  });
  const photoPaths = [...new Set(sgPaths.images.map(toFieldPath))];
  const photos = photoPaths.map((p, i) => ({
    slot: `p${i + 1}`, path: p, role: roleFor(p), required: true, note: humanize(p),
  }));
  return {
    id, name: name || id, schema: 2,
    pageTypes: ['home'], sections: { home: Object.keys(content || {}) },
    photos, fields: { editable },
  };
}

/** Réécrit les chemins d'images relatifs 'img/x' en absolus '/_templates/<id>/img/x'. */
function absolutizeImages(node, id) {
  if (typeof node === 'string') {
    return node.startsWith('img/') ? `/_templates/${id}/${node}` : node;
  }
  if (Array.isArray(node)) return node.map((n) => absolutizeImages(n, id));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = absolutizeImages(node[k], id);
    return out;
  }
  return node;
}

/** Garantit le guard `|| {…}` pour que l'injection serveur l'emporte. */
function guardInlineContent(html) {
  return html.replace(
    /window\.__SITE_CONTENT__\s*=\s*(?!window\.__SITE_CONTENT__)/,
    'window.__SITE_CONTENT__ = window.__SITE_CONTENT__ || ',
  );
}

/** Packaging complet d'un template. */
export function packTemplate({ id, srcRel, name }) {
  const src = join(REPO_ROOT, srcRel);
  const html = readFileSync(join(src, 'index.html'), 'utf8');
  const content = extractContent(html);
  const sgPaths = collectSgPaths(html);

  const outDir = join(SITEGENE, 'public', '_templates', id);
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, 'index.html'), guardInlineContent(html));
  const defaultContent = absolutizeImages(content, id);
  writeFileSync(join(outDir, 'default-content.json'), JSON.stringify(defaultContent, null, 2));
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(buildManifestStub(id, content, sgPaths, name), null, 2));

  for (const sub of ['img', 'assets']) {
    if (existsSync(join(src, sub))) cpSync(join(src, sub), join(outDir, sub), { recursive: true });
  }
  return outDir;
}

// CLI : node scripts/pack-template.mjs <id> <srcRel> ["Nom"]
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [id, srcRel, name] = process.argv.slice(2);
  if (!id || !srcRel) { console.error('Usage: node scripts/pack-template.mjs <id> <srcRel> ["Nom"]'); process.exit(1); }
  console.log('Packagé →', packTemplate({ id, srcRel, name }));
}
