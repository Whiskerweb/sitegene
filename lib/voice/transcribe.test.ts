import { describe, it, expect, beforeEach } from "vitest";
import { transcribeAudio } from "./transcribe";

describe("transcribeAudio", () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });
  it("sans OPENAI_API_KEY → { ok:false, reason:'no-key' }", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
    const res = await transcribeAudio(blob, "fr");
    expect(res).toEqual({ ok: false, reason: "no-key" });
  });
});
