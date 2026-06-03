import { describe, it, expect } from "vitest";
import { advanceAfterSend, shouldStop } from "./sequence";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("advanceAfterSend", () => {
  it("initial (step 0) → active, relance à J+3", () => {
    const s = advanceAfterSend({ step: 0, maxSteps: 3, nowMs: NOW });
    expect(s.status).toBe("active");
    expect(s.step).toBe(1);
    expect(new Date(s.next_run_at).getTime()).toBe(NOW + 3 * DAY);
  });

  it("relance 1 (step 1) → active, relance à +4 jours (J+7)", () => {
    const s = advanceAfterSend({ step: 1, maxSteps: 3, nowMs: NOW });
    expect(s.status).toBe("active");
    expect(s.step).toBe(2);
    expect(new Date(s.next_run_at).getTime()).toBe(NOW + 4 * DAY);
  });

  it("dernière étape (step 2) → completed", () => {
    const s = advanceAfterSend({ step: 2, maxSteps: 3, nowMs: NOW });
    expect(s.status).toBe("completed");
    expect(s.step).toBe(3);
  });

  it("respecte des gaps personnalisés", () => {
    const s = advanceAfterSend({ step: 0, maxSteps: 2, nowMs: NOW, gaps: [10] });
    expect(new Date(s.next_run_at).getTime()).toBe(NOW + 10 * DAY);
  });
});

describe("shouldStop", () => {
  it("payé → converted", () =>
    expect(shouldStop({ codeStatus: "paid", engagedAfterSend: false })).toBe("converted"));
  it("expiré → completed", () =>
    expect(shouldStop({ codeStatus: "expired", engagedAfterSend: false })).toBe("completed"));
  it("engagement réel après envoi → engaged", () =>
    expect(shouldStop({ codeStatus: "sent", engagedAfterSend: true })).toBe("engaged"));
  it("'opened' pré-campagne (aucun engagement après envoi) → PAS de stop", () =>
    expect(shouldStop({ codeStatus: "opened", engagedAfterSend: false })).toBeNull());
  it("rien → pas de stop", () =>
    expect(shouldStop({ codeStatus: "sent", engagedAfterSend: false })).toBeNull());
});
