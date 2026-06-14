import { describe, it, expect } from "vitest";
import {
  WHEEL_SEGMENTS,
  WHEEL_WEIGHTS,
  spinReward,
  wheelExpectedValue,
} from "./wheel";

describe("roue de la fortune", () => {
  it("segments et poids ont la même longueur", () => {
    expect(WHEEL_WEIGHTS.length).toBe(WHEEL_SEGMENTS.length);
  });

  it("la moyenne de gain est dans la cible 10-15", () => {
    const ev = wheelExpectedValue();
    expect(ev).toBeGreaterThanOrEqual(10);
    expect(ev).toBeLessThanOrEqual(15);
  });

  it("rand=0 → premier segment, rand→1 → dernier (jackpot)", () => {
    expect(spinReward(0)).toBe(WHEEL_SEGMENTS[0]);
    expect(spinReward(0.999999)).toBe(WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1]);
  });

  it("ne renvoie jamais une valeur hors des segments", () => {
    for (let i = 0; i < 1000; i++) {
      const r = spinReward(i / 1000);
      expect(WHEEL_SEGMENTS).toContain(r);
    }
  });

  it("le jackpot reste rare (< 12% des tirages uniformes)", () => {
    let jackpot = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) {
      if (spinReward(i / n) === WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1]) jackpot++;
    }
    expect(jackpot / n).toBeLessThan(0.12);
  });
});
