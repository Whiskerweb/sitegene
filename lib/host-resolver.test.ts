import { describe, it, expect } from "vitest";
import { resolveHost, type SiteLookupSource, type SiteLookup } from "./host-resolver";

/** Source fake : map slug→lookup et customDomain→lookup. */
function source(bySlug: Record<string, SiteLookup>, byDomain: Record<string, SiteLookup>): SiteLookupSource {
  return {
    async bySlug(slug) {
      return bySlug[slug] ?? null;
    },
    async byCustomDomain(domain) {
      return byDomain[domain] ?? null;
    },
  };
}

const FOUNDRY: SiteLookup = { slug: "arelec", render: "foundry" };
const STATIC: SiteLookup = { slug: "alice-r", render: "static" };

describe("resolveHost", () => {
  it("sous-domaine fonderie → site render foundry", async () => {
    const s = source({ arelec: FOUNDRY }, {});
    expect(await resolveHost("arelec.akyra.io", s)).toEqual({ kind: "site", slug: "arelec", render: "foundry" });
  });
  it("sous-domaine template statique → site render static", async () => {
    const s = source({ "alice-r": STATIC }, {});
    expect(await resolveHost("alice-r.akyra.io", s)).toEqual({ kind: "site", slug: "alice-r", render: "static" });
  });
  it("sous-domaine inconnu en base → app", async () => {
    const s = source({}, {});
    expect(await resolveHost("inexistant.akyra.io", s)).toEqual({ kind: "app" });
  });
  it("apex akyra.io → app SANS lookup", async () => {
    let touched = false;
    const s: SiteLookupSource = {
      async bySlug() {
        touched = true;
        return null;
      },
      async byCustomDomain() {
        touched = true;
        return null;
      },
    };
    expect(await resolveHost("akyra.io", s)).toEqual({ kind: "app" });
    expect(touched).toBe(false);
  });
  it("preview vercel.app → app SANS lookup custom", async () => {
    let touchedDomain = false;
    const s: SiteLookupSource = {
      async bySlug() {
        return null;
      },
      async byCustomDomain() {
        touchedDomain = true;
        return null;
      },
    };
    expect(await resolveHost("akyra-test.vercel.app", s)).toEqual({ kind: "app" });
    expect(touchedDomain).toBe(false);
  });
  it("domaine personnalisé trouvé → site (render correct)", async () => {
    const s = source({}, { "entreprise-arelec.fr": FOUNDRY });
    expect(await resolveHost("entreprise-arelec.fr", s)).toEqual({ kind: "site", slug: "arelec", render: "foundry" });
  });
  it("domaine personnalisé inconnu → app", async () => {
    const s = source({}, {});
    expect(await resolveHost("pas-branche.fr", s)).toEqual({ kind: "app" });
  });
  it("lookup qui jette → app (jamais de 500)", async () => {
    const s: SiteLookupSource = {
      async bySlug() {
        throw new Error("réseau");
      },
      async byCustomDomain() {
        throw new Error("réseau");
      },
    };
    expect(await resolveHost("arelec.akyra.io", s)).toEqual({ kind: "app" });
  });
});
