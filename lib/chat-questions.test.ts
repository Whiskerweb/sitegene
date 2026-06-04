import { describe, expect, it } from "vitest";
import { chatQuestionsFor, CHAT_QUESTIONS } from "./chat-questions";

describe("chatQuestionsFor", () => {
  it("ne repose jamais une question dont la réponse est déjà dans l'intake", () => {
    const qs = chatQuestionsFor("photographe", { contactPhone: "0612345678" }, []);
    expect(qs.map((q) => q.key)).not.toContain("contactPhone");
  });

  it("pose la question du téléphone quand il est inconnu", () => {
    const qs = chatQuestionsFor("photographe", {}, []);
    expect(qs.map((q) => q.key)).toContain("contactPhone");
  });

  it("exclut les questions passées (skipped)", () => {
    const qs = chatQuestionsFor("photographe", {}, ["wantsPricingPage"]);
    expect(qs.map((q) => q.key)).not.toContain("wantsPricingPage");
  });

  it("respecte askIf : pas de fourchette de prix sans page tarifs", () => {
    const noPricing = chatQuestionsFor("photographe", { wantsPricingPage: false }, []);
    expect(noPricing.map((q) => q.key)).not.toContain("priceRange");
    const withPricing = chatQuestionsFor("photographe", { wantsPricingPage: true }, []);
    expect(withPricing.map((q) => q.key)).toContain("priceRange");
  });

  it("transmet une question conditionnelle quand sa dépendance est encore ouverte", () => {
    const qs = chatQuestionsFor("photographe", {}, []);
    expect(qs.map((q) => q.key)).toContain("priceRange");
  });

  it("n'envoie pas la question conditionnelle si la dépendance a été passée", () => {
    const qs = chatQuestionsFor("photographe", {}, ["wantsPricingPage"]);
    expect(qs.map((q) => q.key)).not.toContain("priceRange");
  });

  it("considère un tableau vide comme « pas de réponse »", () => {
    const qs = chatQuestionsFor("photographe", { eventTypes: [] }, []);
    expect(qs.map((q) => q.key)).toContain("eventTypes");
  });

  it("toutes les questions ont un libellé conversationnel et un type valide", () => {
    for (const list of Object.values(CHAT_QUESTIONS)) {
      for (const q of list) {
        expect(q.label.length).toBeGreaterThan(5);
        expect(["boolean", "text", "choice", "multiselect"]).toContain(q.kind);
      }
    }
  });
});
