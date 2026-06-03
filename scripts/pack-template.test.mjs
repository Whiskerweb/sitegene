import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractContent, collectSgPaths, toFieldPath, buildManifestStub } from './pack-template.mjs';

const HTML = `
<!doctype html><html><head>
<script>window.__SITE_CONTENT__ = { brand: "Marina Cole", hero: { title: "Where", image: "img/hero.jpg" }, releases: [{ title: "After Midnight", cover: "img/c1.jpg" }] };</script>
</head><body>
<h1 data-sg-path="hero.title">Where</h1>
<img data-sg-img="hero.image" src="img/hero.jpg"/>
<h3 data-sg-path="releases[0].title">After Midnight</h3>
<img data-sg-img="releases[0].cover" src="img/c1.jpg"/>
</body></html>`;

test('extractContent lit l\'objet __SITE_CONTENT__ inline', () => {
  const c = extractContent(HTML);
  assert.equal(c.brand, 'Marina Cole');
  assert.equal(c.hero.title, 'Where');
  assert.equal(c.releases[0].cover, 'img/c1.jpg');
});

test('collectSgPaths récupère textes et images', () => {
  const { texts, images } = collectSgPaths(HTML);
  assert.deepEqual(texts.sort(), ['hero.title', 'releases[0].title'].sort());
  assert.deepEqual(images.sort(), ['hero.image', 'releases[0].cover'].sort());
});

test('toFieldPath réduit les indices en []', () => {
  assert.equal(toFieldPath('releases[0].title'), 'releases[].title');
  assert.equal(toFieldPath('hero.title'), 'hero.title');
});

test('buildManifestStub: champs + photos + maxLen plancher 40', () => {
  const c = extractContent(HTML);
  const m = buildManifestStub('jazz-vocalist', c, collectSgPaths(HTML));
  assert.equal(m.id, 'jazz-vocalist');
  const titleField = m.fields.editable.find((f) => f.path === 'hero.title');
  assert.ok(titleField && titleField.maxLen >= 40);
  assert.ok(m.photos.some((p) => p.path === 'hero.image'));
  assert.ok(m.fields.editable.some((f) => f.path === 'releases[].title'));
});
