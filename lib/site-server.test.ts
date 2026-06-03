import { describe, it, expect } from "vitest";
import {
  absolutizeContentAssets,
  absolutizeTemplateAssets,
  buildHeadInjection,
} from "./site-server";

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

describe("absolutizeTemplateAssets", () => {
  it("absolutise src/href/poster, srcset et url() relatifs vers /_templates/<id>/", () => {
    const shell = [
      '<img data-sg-img="blog.posts[1].image" src="img/blog2.jpg" alt="Blog post 2" />',
      '<link rel="stylesheet" href="css/style.css">',
      '<video poster="media/poster.jpg"></video>',
      '<img srcset="img/a.jpg 1x, img/b.jpg 2x" src="img/a.jpg">',
      '<div style="background:url(img/cta-bg.jpg)"></div>',
      "<div style=\"background:url('assets/bg.png')\"></div>",
    ].join("\n");
    const out = absolutizeTemplateAssets(shell, "eco-garden-care");
    expect(out).toContain('src="/_templates/eco-garden-care/img/blog2.jpg"');
    expect(out).toContain('href="/_templates/eco-garden-care/css/style.css"');
    expect(out).toContain('poster="/_templates/eco-garden-care/media/poster.jpg"');
    expect(out).toContain(
      'srcset="/_templates/eco-garden-care/img/a.jpg 1x, /_templates/eco-garden-care/img/b.jpg 2x"',
    );
    expect(out).toContain("url(/_templates/eco-garden-care/img/cta-bg.jpg)");
    expect(out).toContain("url('/_templates/eco-garden-care/assets/bg.png')");
  });

  it("ne touche ni aux URLs absolues, ni aux ancres, ni aux data:", () => {
    const shell = [
      '<img src="/_templates/alice-r/img/p1.jpg">',
      '<img src="https://storage.example/site-photos/x/p1.jpg">',
      '<a href="#contact">Contact</a>',
      '<img src="data:image/png;base64,AAAA">',
    ].join("\n");
    expect(absolutizeTemplateAssets(shell, "alice-r")).toBe(shell);
  });
});

describe("absolutizeContentAssets", () => {
  it("absolutise les valeurs d'images relatives du contenu (runtime data-sg-img)", () => {
    const content = {
      blog: { posts: [{ image: "img/blog1.jpg" }, { image: "img/blog2.jpg" }] },
      hero: { bg: "https://storage.example/p.jpg", title: "img sans extension" },
    };
    const out = absolutizeContentAssets(content, "eco-garden-care") as typeof content;
    expect(out.blog.posts[1].image).toBe("/_templates/eco-garden-care/img/blog2.jpg");
    expect(out.hero.bg).toBe("https://storage.example/p.jpg");
    expect(out.hero.title).toBe("img sans extension");
  });
});
