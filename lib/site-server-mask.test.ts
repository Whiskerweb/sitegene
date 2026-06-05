import { describe, it, expect } from "vitest";
import { sectionMaskScript } from "./site-server";

/* [5.1/5.3] Runtime de masquage injecté dans la lignée HTML. */
describe("sectionMaskScript", () => {
  const out = sectionMaskScript();

  it("contient le style des liens désactivés et le script", () => {
    expect(out).toContain('id="sg-mask"');
    expect(out).toContain("nav-link--disabled");
    expect(out).toContain('id="sg-mask-js"');
  });

  it("le script inline est du JavaScript syntaxiquement valide", () => {
    const body = out.match(/<script id="sg-mask-js">([\s\S]*?)<\/script>/)?.[1];
    expect(body).toBeTruthy();
    // jette en cas d'erreur de syntaxe (le DOM n'est pas nécessaire pour parser)
    expect(() => new Function(body!)).not.toThrow();
  });

  it("lit les directives __dropSections/__dropItems du contenu", () => {
    expect(out).toContain("__dropSections");
    expect(out).toContain("__dropItems");
  });
});
