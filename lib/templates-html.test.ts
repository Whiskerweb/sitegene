import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "_templates");
// Templates HTML (clone-site) packagés. jazz-vocalist ajouté après son retrofit.
const HTML_TEMPLATES = [
  "cleaning-services",
  "eco-garden-care",
  "creative-portfolio",
  "health-saas",
  "luxury-wedding",
  "wedding-fine-art",
];

function getPath(obj: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>(
      (o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]),
      obj,
    );
}

describe.each(HTML_TEMPLATES)("template %s", (id) => {
  const dir = join(ROOT, id);
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const content = JSON.parse(readFileSync(join(dir, "default-content.json"), "utf8"));

  it("index.html garde le guard d'injection", () => {
    expect(html).toContain("__SITE_CONTENT__ || ");
  });

  it("chaque champ manifest existe dans default-content", () => {
    for (const f of manifest.fields.editable as { path: string }[]) {
      const concrete = f.path.replace(/\[\]/g, "[0]");
      expect(getPath(content, concrete), `${id}: ${f.path} absent du contenu`).toBeDefined();
    }
  });

  it("chaque data-sg-path du HTML a un champ manifest (modulo [])", () => {
    const paths = [...html.matchAll(/data-sg-path="([^"]+)"/g)].map((m) =>
      m[1].replace(/\[\d+\]/g, "[]"),
    );
    const declared = new Set(
      (manifest.fields.editable as { path: string }[]).map((f) => f.path),
    );
    for (const p of new Set(paths)) {
      expect(declared.has(p), `${id}: data-sg-path "${p}" non déclaré`).toBe(true);
    }
  });

  it("les images du contenu pointent vers /_templates/<id>/", () => {
    const json = JSON.stringify(content);
    const imgs = [...json.matchAll(/"(\/_templates\/[^"]+\.(?:jpg|png|webp|svg))"/g)];
    expect(imgs.length).toBeGreaterThan(0);
    for (const [, url] of imgs) expect(url.startsWith(`/_templates/${id}/`)).toBe(true);
  });
});
