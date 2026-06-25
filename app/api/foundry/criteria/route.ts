import { NextResponse } from "next/server";
import { chat } from "@/lib/mistral";
import { generateQualityCriteria } from "@/lib/foundry/criteria";

export const maxDuration = 30;

// Rate limit naïf par IP (par instance) : l'étape pitch est publique (avant la
// création de compte) — on borne le coût Mistral des abus simples. Un seul appel
// par session suffit côté client : la détection est ensuite 100 % locale.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) return false;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

/**
 * Critères de qualité SUR-MESURE par métier pour une description (étape « pitch »
 * de /creer). Mistral déduit le métier et renvoie les sujets pertinents + leurs
 * mots-clés de détection. La jauge tourne en local instantanément ; cet appel ne
 * sert qu'à PERSONNALISER les critères selon le secteur d'activité.
 */
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!allowed(ip)) {
    return NextResponse.json({ ok: true, topics: [], source: "none" });
  }

  const body = await request.json().catch(() => null);
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim().slice(0, 80) : "";
  // On génère dès qu'on a un DOMAINE (≥ 2) OU un brief déjà conséquent (≥ 16) —
  // le domaine seul suffit à proposer des questions adaptées au métier.
  if ((domain.length < 2 && brief.length < 16) || brief.length > 6000) {
    return NextResponse.json({ ok: true, topics: [], businessName: "", source: "none" });
  }

  const { topics, businessName, source } = await generateQualityCriteria({ brief, domain }, chat);
  return NextResponse.json({ ok: true, topics, businessName, source });
}
