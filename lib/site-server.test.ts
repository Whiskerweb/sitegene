import { describe, it, expect } from "vitest";
import { buildHeadInjection } from "./site-server";

describe("buildHeadInjection", () => {
  it("injecte le contenu + le titre échappé de la page", () => {
    const html = buildHeadInjection(
      { version: 2, site: {}, pages: [] } as any,
      { title: "Mon <Titre>", description: "desc" },
    );
    expect(html).toContain("window.__SITE_CONTENT__=");
    expect(html).toContain("<title>Mon &lt;Titre&gt;</title>");
    expect(html).toContain('name="description"');
    expect(html).not.toContain("</script><");
  });

  it("injecte un __SITE_CONTENT__ plat (templates HTML clone-site) sans casser le script", () => {
    const content = {
      brand: "Marina",
      hero: { title: "Where care", image: "/_templates/health-saas/img/hero-doctor.jpg" },
    } as any;
    const html = buildHeadInjection(content, { title: "Marina", description: "Jazz" });
    expect(html).toContain("window.__SITE_CONTENT__=");
    expect(html).toContain("Marina");
    expect(html).not.toContain("</script><");
  });
});
