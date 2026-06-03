import { describe, it, expect } from "vitest";
import { advanceAfterSend, stopStatusForCode } from "./sequence";

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

describe("stopStatusForCode", () => {
  it("reveal vu → engaged", () => expect(stopStatusForCode("opened")).toBe("engaged"));
  it("payé → converted", () => expect(stopStatusForCode("paid")).toBe("converted"));
  it("expiré → completed", () => expect(stopStatusForCode("expired")).toBe("completed"));
  it("encore 'sent' → pas de stop", () => expect(stopStatusForCode("sent")).toBeNull());
  it("inconnu/null → pas de stop", () => expect(stopStatusForCode(null)).toBeNull());
});
