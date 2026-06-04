import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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
  "jazz-vocalist",
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

  // ---- Multi-pages (manifest.pages : [{slug, file, title}]) ----
  const pages = (manifest.pages ?? []) as { slug?: string; file?: string }[];

  it.runIf(pages.length > 0)("chaque page déclarée existe et garde le guard", () => {
    for (const p of pages) {
      expect(p.slug, `${id}: page sans slug`).toMatch(/^\/[a-z0-9-]+$/);
      expect(p.file, `${id}: page sans fichier`).toMatch(/^[a-z0-9][a-z0-9._-]*\.html$/i);
      const fp = join(dir, p.file as string);
      expect(existsSync(fp), `${id}: ${p.file} absent`).toBe(true);
      const pageHtml = readFileSync(fp, "utf8");
      expect(pageHtml, `${id}: ${p.file} sans guard`).toContain("__SITE_CONTENT__ || ");
    }
  });

  it.runIf(pages.length > 0)(
    "les data-sg-path des pages résolvent dans default-content et le manifest",
    () => {
      const declared = new Set(
        (manifest.fields.editable as { path: string }[]).map((f) => f.path),
      );
      for (const p of pages) {
        const pageHtml = readFileSync(join(dir, p.file as string), "utf8");
        const paths = [...pageHtml.matchAll(/data-sg-path="([^"]+)"/g)].map((m) => m[1]);
        for (const concrete of new Set(paths)) {
          expect(
            getPath(content, concrete),
            `${id}/${p.file}: "${concrete}" absent du contenu`,
          ).toBeDefined();
          expect(
            declared.has(concrete.replace(/\[\d+\]/g, "[]")),
            `${id}/${p.file}: "${concrete}" non déclaré dans le manifest`,
          ).toBe(true);
        }
      }
    },
  );

  it.runIf(pages.length > 0)("la nav inter-pages est présente sur toutes les pages", () => {
    const shells = ["index.html", ...pages.map((p) => p.file as string)];
    for (const f of shells) {
      const pageHtml = readFileSync(join(dir, f), "utf8");
      for (const p of pages) {
        expect(
          pageHtml.includes(`data-sg-page="${(p.slug as string).slice(1)}"`) ||
            pageHtml.includes(`data-sg-page="${p.slug}"`),
          `${id}/${f}: lien data-sg-page vers ${p.slug} manquant`,
        ).toBe(true);
      }
    }
  });
});
