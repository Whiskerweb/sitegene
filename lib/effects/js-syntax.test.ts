import { describe, it, expect } from "vitest";
import { listEffects } from "./index";
import { FX_INJECTOR } from "./render";
import { SMOOTH_SCROLL_JS } from "../smooth-scroll-runtime";
import { injectEditChrome, injectPreviewRuntime } from "../edit-runtime";

/**
 * Les JS des effets, l'injecteur et le runtime d'édition sont des STRINGS
 * (jamais compilées par TypeScript) : on valide ici leur syntaxe avec
 * new Function — une coquille y casserait silencieusement tous les sites.
 */
function expectValidJs(src: string, label: string) {
  expect(() => new Function(src), `${label}: syntaxe JS invalide`).not.toThrow();
}

describe("syntaxe des scripts injectés", () => {
  it("JS de chaque effet du catalogue", () => {
    for (const e of listEffects()) {
      if (e.js) expectValidJs(e.js, e.id);
    }
  });

  it("FX_INJECTOR", () => {
    expectValidJs(FX_INJECTOR, "FX_INJECTOR");
  });

  it("runtime de défilement fluide (smooth scroll global)", () => {
    expectValidJs(SMOOTH_SCROLL_JS, "SMOOTH_SCROLL_JS");
  });

  it("runtime d'édition (RUNTIME) et runtime d'aperçu", () => {
    const html = injectEditChrome("<html><body></body></html>", { editableFields: [] });
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    scripts.forEach((s, i) => expectValidJs(s, `edit-runtime script #${i}`));

    const prev = injectPreviewRuntime("<html><body></body></html>");
    const pScripts = [...prev.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    pScripts.forEach((s, i) => expectValidJs(s, `preview-runtime script #${i}`));
  });

  it("CSS des effets : pas de balise <style> imbriquée ni de </style>", () => {
    for (const e of listEffects()) {
      expect(e.css.includes("</style>"), `${e.id}: </style> dans le css`).toBe(false);
      expect(e.css.includes("<script"), `${e.id}: <script dans le css`).toBe(false);
    }
  });
});
