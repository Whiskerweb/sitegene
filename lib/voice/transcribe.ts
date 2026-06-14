/** Transcription audio → texte (Whisper OpenAI). Swappable Voxtral en changeant l'URL/clé. */
export type TranscribeResult = { ok: true; text: string } | { ok: false; reason: string };

export async function transcribeAudio(audio: Blob, lang = "fr"): Promise<TranscribeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, reason: "no-key" };
  try {
    const fd = new FormData();
    fd.append("file", audio, "audio.webm");
    fd.append("model", "whisper-1");
    fd.append("language", lang);
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const j = await res.json();
    const text = typeof j.text === "string" ? j.text.trim() : "";
    return text ? { ok: true, text } : { ok: false, reason: "vide" };
  } catch {
    return { ok: false, reason: "fetch-fail" };
  }
}
