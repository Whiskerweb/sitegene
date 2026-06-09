import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { transcribeAudio } from "@/lib/voice/transcribe";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const siteId = String(form?.get("siteId") ?? "");
  const audio = form?.get("audio");
  if (!siteId || !(await userOwnsSite(user.id, siteId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > 10_000_000)
    return NextResponse.json({ error: "Audio invalide." }, { status: 400 });
  const res = await transcribeAudio(audio, "fr");
  if (!res.ok) return NextResponse.json({ error: `Transcription indisponible (${res.reason}).` }, { status: 502 });
  return NextResponse.json({ text: res.text });
}
