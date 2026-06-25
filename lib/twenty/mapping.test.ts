import { describe, it, expect } from "vitest";
import {
  AKYRA_OWNED_PERSON_FIELDS,
  AKYRA_OWNED_OPP_FIELDS,
  inscriptionStatusFor,
  prospectToPersonPatch,
  opportunityPatchFor,
  signalToNoteBody,
  displayName,
  type ProspectRow,
  type ClientContext,
} from "./mapping";

const prospect: ProspectRow = {
  id: "11111111-2222-3333-4444-555555555555",
  first_name: "Léa",
  email: "lea@example.com",
  phone: "+33600000000",
  instagram: "@lea",
  city: "Lyon",
  category: "musicien",
  lead_score: 25,
  source: "tremplin",
};

const notClient: ClientContext = {
  isClient: false,
  isTrialing: false,
  hasAccount: false,
  plan: null,
  mrrCents: null,
  conversionDate: null,
};

describe("inscriptionStatusFor", () => {
  it("pas inscrit par défaut", () => {
    expect(inscriptionStatusFor(notClient)).toBe("PAS_INSCRIT");
  });
  it("inscrit si compte ou essai", () => {
    expect(inscriptionStatusFor({ ...notClient, hasAccount: true })).toBe("INSCRIT");
    expect(inscriptionStatusFor({ ...notClient, isTrialing: true })).toBe("INSCRIT");
  });
  it("client payant prime sur tout", () => {
    expect(
      inscriptionStatusFor({ ...notClient, isClient: true, hasAccount: true, isTrialing: true }),
    ).toBe("CLIENT_PAYANT");
  });
});

describe("prospectToPersonPatch — propriété des champs", () => {
  it("ne produit QUE des clés Akyra-owned", () => {
    const patch = prospectToPersonPatch(prospect, { ...notClient, isClient: true, mrrCents: 1499, conversionDate: "2026-06-24T10:00:00Z", plan: "abonnement" });
    for (const key of Object.keys(patch)) {
      expect(AKYRA_OWNED_PERSON_FIELDS).toContain(key);
    }
  });
  it("ne contient JAMAIS de clé Twenty-owned (stage, noteTargets, etc.)", () => {
    const patch = prospectToPersonPatch(prospect, notClient);
    for (const forbidden of ["stage", "noteTargets", "tasks", "assignee", "pipelineStep"]) {
      expect(patch).not.toHaveProperty(forbidden);
    }
  });
  it("mappe name/email/phone en composites Twenty", () => {
    const patch = prospectToPersonPatch(prospect, notClient);
    expect(patch.name).toEqual({ firstName: "Léa", lastName: "" });
    expect(patch.emails).toEqual({ primaryEmail: "lea@example.com" });
    expect(patch.phones).toEqual({ primaryPhoneNumber: "+33600000000" });
    expect(patch.akyraProspectId).toBe(prospect.id);
    expect(patch.inscriptionStatus).toBe("PAS_INSCRIT");
    expect(patch.category).toBe("MUSICIEN");
  });
  it("omet les champs optionnels absents (pas de clé vide)", () => {
    const bare: ProspectRow = { ...prospect, phone: null, city: null, instagram: null, source: null };
    const patch = prospectToPersonPatch(bare, notClient);
    expect(patch).not.toHaveProperty("phones");
    expect(patch).not.toHaveProperty("city");
    expect(patch).not.toHaveProperty("instagram");
    expect(patch).not.toHaveProperty("akyraSource");
  });
  it("leadScore par défaut à 0", () => {
    const patch = prospectToPersonPatch({ ...prospect, lead_score: null }, notClient);
    expect(patch.leadScore).toBe(0);
  });
});

describe("opportunityPatchFor", () => {
  it("ne produit QUE des clés Akyra-owned et JAMAIS stage", () => {
    const patch = opportunityPatchFor(prospect, { ...notClient, isClient: true, mrrCents: 1499 });
    for (const key of Object.keys(patch)) {
      expect(AKYRA_OWNED_OPP_FIELDS).toContain(key);
    }
    expect(patch).not.toHaveProperty("stage");
  });
  it("convertit les cents en micros Twenty (1499 c → 14 990 000 µ)", () => {
    const patch = opportunityPatchFor(prospect, { ...notClient, mrrCents: 1499 });
    expect(patch.amount).toEqual({ amountMicros: 14_990_000, currencyCode: "EUR" });
  });
  it("omet amount si pas de MRR", () => {
    const patch = opportunityPatchFor(prospect, notClient);
    expect(patch).not.toHaveProperty("amount");
  });
});

describe("displayName", () => {
  it("prénom, sinon email, sinon id court", () => {
    expect(displayName(prospect)).toBe("Léa");
    expect(displayName({ ...prospect, first_name: "  " })).toBe("lea@example.com");
    expect(displayName({ ...prospect, first_name: null, email: null })).toContain("Prospect ");
  });
});

describe("signalToNoteBody", () => {
  it("titre lisible daté", () => {
    expect(signalToNoteBody("reveal_opened", "2026-06-24T10:00:00Z").title).toMatch(/Reveal ouvert/);
  });
  it("signal inconnu → fallback", () => {
    expect(signalToNoteBody("wat").title).toBe("Signal : wat");
  });
});
