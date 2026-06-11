import { NextResponse } from "next/server";
import { chat } from "@/lib/mistral";
import { generateChartes } from "@/lib/foundry/charte";
import { detectTrade } from "@/lib/foundry/suggest";

export const maxDuration = 60;

// Rate limit naïf par IP (par instance) : l'étape DA du tunnel est publique
// (avant la création de compte) — on borne le coût Mistral des abus simples.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) return false;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // borne mémoire
  return true;
}

/**
 * 3 chartes graphiques SUR MESURE pour un pitch (étape DA de /creer).
 * Sortie IA réparée serveur (contrastes/saturation/fonts) — ne peut pas
 * échouer : repli sur les vibes curées du métier.
 */
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim().slice(0, 80) : "";
  const attempt = typeof body?.attempt === "number" ? body.attempt : 0;
  if (brief.length < 10 || brief.length > 2000) {
    return NextResponse.json({ error: "Décrivez votre activité en quelques phrases." }, { status: 400 });
  }

  const { trade } = detectTrade(brief);
  const { chartes, source } = await generateChartes({ brief, businessName, trade, attempt }, chat);
  return NextResponse.json({ ok: true, source, chartes });
}
