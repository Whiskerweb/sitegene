import { describe, it, expect } from "vitest";
import { receiptEmail, outreachEmail, customOutreachEmail } from "./templates";

describe("customOutreachEmail", () => {
  const msg =
    "Bonjour Gael,\n\nVotre site est prêt :\nhttps://akyra.io/r/abc123\n\nLucas";
  const m = customOutreachEmail({
    subject: "Gael, votre site est prêt",
    message: msg,
    unsubUrl: "https://akyra.io/api/email/unsubscribe?token=tok",
  });

  it("garde le message intact dans le texte", () => {
    expect(m.text).toContain("Bonjour Gael,");
    expect(m.text).toContain("https://akyra.io/r/abc123");
  });
  it("transforme le lien du message en lien cliquable HTML", () => {
    expect(m.html).toContain('href="https://akyra.io/r/abc123"');
  });
  it("ajoute l'option de désinscription", () => {
    expect(m.html).toContain("https://akyra.io/api/email/unsubscribe?token=tok");
    expect(m.text.toLowerCase()).toContain("contacté");
  });
  it("aucun lien localhost possible (le lien vient du message)", () => {
    expect(m.html).not.toContain("localhost");
  });
});

describe("receiptEmail", () => {
  const mail = receiptEmail({ firstName: "Camille", dashboardUrl: "https://akyra.io/dashboard" });

  it("subject, html et text non vides", () => {
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.html).toContain("<html");
    expect(mail.text.length).toBeGreaterThan(0);
  });
  it("injecte le prénom et le lien dashboard", () => {
    expect(mail.html).toContain("Camille");
    expect(mail.html).toContain("https://akyra.io/dashboard");
    expect(mail.text).toContain("https://akyra.io/dashboard");
  });
  it("transactionnel : pas de lien de désinscription", () => {
    expect(mail.html.toLowerCase()).not.toContain("désinscrire");
  });
  it("sans prénom → salutation générique", () => {
    const m = receiptEmail({ firstName: null, dashboardUrl: "https://akyra.io/dashboard" });
    expect(m.html).toContain("Bonjour,");
  });
});

describe("outreachEmail", () => {
  const opts = {
    firstName: "Léa",
    revealUrl: "https://akyra.io/r/abc123",
    unsubUrl: "https://akyra.io/api/email/unsubscribe?token=tok",
  };

  it("3 variantes avec des sujets distincts", () => {
    const subjects = [0, 1, 2].map((s) => outreachEmail(s, opts).subject);
    expect(new Set(subjects).size).toBe(3);
  });

  it("chaque étape injecte le reveal + l'option de désinscription", () => {
    for (const step of [0, 1, 2]) {
      const m = outreachEmail(step, opts);
      expect(m.html).toContain("https://akyra.io/r/abc123");
      expect(m.html).toContain(opts.unsubUrl);
      expect(m.html.toLowerCase()).toContain("contacté");
      expect(m.text).toContain(opts.revealUrl);
      expect(m.text.toLowerCase()).toContain("contacté");
    }
  });

  it("reste en texte brut : pas de logo, pas de bouton/table", () => {
    const m = outreachEmail(0, opts);
    expect(m.html).not.toContain("<table");
    expect(m.html).not.toContain("akyra-light.png");
    expect(m.html).not.toContain("brand");
  });

  it("step hors borne → borné sur la dernière variante", () => {
    expect(outreachEmail(9, opts).subject).toBe(outreachEmail(2, opts).subject);
  });

  it("échappe le prénom (anti-injection HTML)", () => {
    const m = outreachEmail(0, { ...opts, firstName: "<b>x</b>" });
    expect(m.html).not.toContain("<b>x</b>");
    expect(m.html).toContain("&lt;b&gt;");
  });
});
