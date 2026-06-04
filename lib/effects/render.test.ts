import { describe, it, expect } from "vitest";
import {
  appliedComponents,
  appliedEffects,
  buildEffectsInjection,
  sanitizeEffectConfig,
} from "./render";
import { getEffect, listEffects, DEMO_CONFIGS } from "./index";
import { defaultConfig } from "./types";

describe("catalogue d'effets — invariants", () => {
  it("chaque effet a un id unique, un aiGuide non vide et une démo", () => {
    const ids = new Set<string>();
    for (const e of listEffects()) {
      expect(ids.has(e.id), `id dupliqué: ${e.id}`).toBe(false);
      ids.add(e.id);
      expect(e.aiGuide.length, `${e.id}: aiGuide vide`).toBeGreaterThan(50);
      expect(e.demo.html.length, `${e.id}: démo vide`).toBeGreaterThan(0);
      expect(e.css.length, `${e.id}: css vide`).toBeGreaterThan(0);
      if (e.kind === "component") {
        // un composant doit produire un markup OU décorer la cible (css only)
        expect(e.htmlSnippet || e.css, `${e.id}: ni markup ni css`).toBeTruthy();
      }
    }
  });

  it("les htmlSnippet échappent les valeurs texte (pas d'injection)", () => {
    for (const e of listEffects()) {
      if (!e.htmlSnippet) continue;
      const cfg = defaultConfig(e);
      for (const f of e.configSchema ?? []) {
        if (f.type === "text") cfg[f.key] = `<script>alert("x")</script>`;
      }
      const html = e.htmlSnippet(cfg);
      expect(html.includes("<script>alert"), `${e.id}: snippet non échappé`).toBe(false);
    }
  });

  it("les configs de démo passent la sanitisation", () => {
    for (const e of listEffects()) {
      const merged = { ...defaultConfig(e), ...(DEMO_CONFIGS[e.id] ?? {}) };
      const sane = sanitizeEffectConfig(e, merged);
      for (const f of e.configSchema ?? []) {
        expect(sane[f.key], `${e.id}.${f.key} perdu par la sanitisation`).toBeDefined();
      }
    }
  });
});

describe("sanitizeEffectConfig", () => {
  const effect = getEffect("container-scroll")!;

  it("supprime les clés inconnues et coerce les types", () => {
    const sane = sanitizeEffectConfig(effect, {
      title: "Bonjour",
      evil: "javascript:alert(1)",
      titleColor: "red", // pas un hex → défaut
      imageUrl: "javascript:alert(1)", // pas une URL valide → défaut
    });
    expect(sane.evil).toBeUndefined();
    expect(sane.title).toBe("Bonjour");
    expect(sane.titleColor).toBe("#111111");
    expect(sane.imageUrl).toBe("");
  });

  it("borne les nombres et tronque les textes", () => {
    const dc = getEffect("display-cards")!;
    const sane = sanitizeEffectConfig(dc, {
      title1: "x".repeat(500),
      accent: "#abc",
    });
    expect(String(sane.title1).length).toBeLessThanOrEqual(24);
    expect(sane.accent).toBe("#abc");
  });

  it("accepte les URLs http(s), / et data:image", () => {
    const sane = sanitizeEffectConfig(effect, {
      imageUrl: "https://exemple.fr/photo.jpg",
    });
    expect(sane.imageUrl).toBe("https://exemple.fr/photo.jpg");
    const sane2 = sanitizeEffectConfig(effect, { imageUrl: "/_templates/x/img/a.jpg" });
    expect(sane2.imageUrl).toBe("/_templates/x/img/a.jpg");
  });
});

describe("appliedEffects / appliedComponents", () => {
  it("tolère les deux formes de __effects et filtre les entrées invalides", () => {
    const content = {
      __effects: ["cursor-glow", { id: "tilt", config: { intensity: 5 } }, 42, {}],
      __components: [
        { effectId: "display-cards", selector: "#about", position: "replace" },
        { effectId: "x", selector: "", position: "replace" }, // selector vide → rejeté
        { effectId: "y", selector: "#a", position: "nope" }, // position invalide → rejetée
      ],
    };
    expect(appliedEffects(content)).toEqual([
      { id: "cursor-glow", config: undefined },
      { id: "tilt", config: { intensity: 5 } },
    ]);
    expect(appliedComponents(content)).toHaveLength(1);
  });
});

describe("buildEffectsInjection", () => {
  it("injection vide sans effets (zéro overhead)", () => {
    const inj = buildEffectsInjection({}, "luxury-wedding");
    expect(inj.headCss).toBe("");
    expect(inj.headScript).toBe("");
    expect(inj.bodyJs).toBe("");
  });

  it("matérialise un composant possédé sur la lignée HTML", () => {
    const content = {
      __components: [
        { effectId: "display-cards", selector: "#services", position: "replace" },
      ],
    };
    const inj = buildEffectsInjection(content, "luxury-wedding");
    expect(inj.headCss).toContain(".sg-fx-display-cards");
    expect(inj.headScript).toContain("__SG_COMPONENTS__");
    expect(inj.headScript).toContain("#services");
    expect(inj.bodyJs).toContain("__SG_FX_BOOT");
  });

  it("exclut les effets non compatibles SPA sur un template SPA", () => {
    const content = {
      __components: [
        { effectId: "container-scroll", selector: "#hero", position: "after" },
      ],
    };
    const spa = buildEffectsInjection(content, "alice-r");
    expect(spa.headCss).toBe(""); // container-scroll: spaCompatible=false
    const html = buildEffectsInjection(content, "luxury-wedding");
    expect(html.headCss).toContain(".sg-fx-container-scroll");
  });

  it("échappe le JSON inline (pas de </script> break-out)", () => {
    const content = {
      __components: [
        {
          effectId: "display-cards",
          selector: "#a",
          position: "replace",
          config: { title1: "</script><script>alert(1)</script>" },
        },
      ],
    };
    const inj = buildEffectsInjection(content, "luxury-wedding");
    expect(inj.headScript.includes("</script><script>alert")).toBe(false);
  });
});
