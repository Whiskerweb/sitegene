import { describe, it, expect } from "vitest";
import { publicSiteUrlFrom } from "./site-url";

describe("publicSiteUrlFrom", () => {
  it("prod → sous-domaine sur la racine", () => {
    expect(publicSiteUrlFrom("https://akyra.io", "arelec")).toBe("https://arelec.akyra.io");
  });
  it("dev localhost avec port → sous-domaine localhost", () => {
    expect(publicSiteUrlFrom("http://localhost:3000", "arelec")).toBe("http://arelec.localhost:3000");
  });
  it("slug vide → chaîne vide", () => {
    expect(publicSiteUrlFrom("https://akyra.io", "")).toBe("");
    expect(publicSiteUrlFrom("https://akyra.io", null)).toBe("");
  });
  it("appUrl vide ou invalide → chaîne vide (pas de crash)", () => {
    expect(publicSiteUrlFrom("", "arelec")).toBe("");
    expect(publicSiteUrlFrom("pas-une-url", "arelec")).toBe("");
  });
});
