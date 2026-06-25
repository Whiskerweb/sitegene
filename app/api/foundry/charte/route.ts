import { NextResponse } from "next/server";
import { chat } from "@/lib/mistral";
import { selectChartes } from "@/lib/foundry/charte";

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
 * 3 chartes graphiques piochées dans la banque curée pour un pitch (étape DA de
 * /creer). Mistral CHOISIT les plus adaptées (il ne crée rien) ; `exclude` = ids
 * déjà montrés (bouton « 3 autres ») → rotation sans répétition. Ne peut pas
 * échouer : repli sur le classement métier déterministe.
 */
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim().slice(0, 80) : "";
  const exclude = Array.isArray(body?.exclude)
    ? body.exclude.filter((x: unknown): x is string => typeof x === "string").slice(0, 64)
    : [];
  if (brief.length < 10 || brief.length > 6000) {
    return NextResponse.json({ error: "Décrivez votre activité en quelques phrases." }, { status: 400 });
  }

  const { chartes, source } = await selectChartes({ brief, businessName, exclude }, chat);
  return NextResponse.json({ ok: true, source, chartes });
}
