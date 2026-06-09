import { describe, it, expect } from "vitest";
import { assembleProgressiveHtml } from "./design-system-gen";

const HEADER = `<!DOCTYPE html><html><head><style>.x{}</style></head><body class="bg-white"><header>NAV+HERO</header></body></html>`;

describe("assembleProgressiveHtml", () => {
  it("insère les sections dans l'ordre avant </body>", () => {
    const html = assembleProgressiveHtml(HEADER, [
      { key: "services", html: `<section data-sg-path="services.title">Services</section>` },
      { key: "contact", html: `<section data-sg-path="contact.title">Contact</section>` },
    ]);
    const iServices = html.indexOf("Services");
    const iContact = html.indexOf("Contact");
    const iBodyEnd = html.indexOf("</body>");
    expect(iServices).toBeGreaterThan(0);
    expect(iServices).toBeLessThan(iContact);
    expect(iContact).toBeLessThan(iBodyEnd);
    expect(html).toContain("<header>NAV+HERO</header>");
  });

  it("sans </body> : concatène à la fin", () => {
    const html = assembleProgressiveHtml("<header>H</header>", [{ key: "a", html: "<section>A</section>" }]);
    expect(html).toContain("<header>H</header>");
    expect(html).toContain("<section>A</section>");
  });

  it("liste vide : renvoie le header inchangé", () => {
    expect(assembleProgressiveHtml(HEADER, [])).toBe(HEADER);
  });
});
