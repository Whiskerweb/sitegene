import { describe, it, expect } from "vitest";
import { parseHost } from "./subdomain";

describe("parseHost", () => {
  it("apex et www → app", () => {
    expect(parseHost("akyra.io").kind).toBe("app");
    expect(parseHost("www.akyra.io").kind).toBe("app");
  });
  it("sous-domaine client → site + slug", () => {
    expect(parseHost("lea.akyra.io")).toEqual({ kind: "site", slug: "lea" });
  });
  it("sous-domaine réservé → app", () => {
    expect(parseHost("admin.akyra.io").kind).toBe("app");
    expect(parseHost("api.akyra.io").kind).toBe("app");
  });
  it("dev: lea.localhost:3000 → site", () => {
    expect(parseHost("lea.localhost:3000")).toEqual({ kind: "site", slug: "lea" });
  });
  it("localhost nu → app", () => {
    expect(parseHost("localhost:3000").kind).toBe("app");
  });
  it("domaine inconnu (preview vercel) → app", () => {
    expect(parseHost("akyra-test.vercel.app").kind).toBe("app");
  });
});
