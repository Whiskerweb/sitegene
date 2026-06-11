import { NextResponse } from "next/server";
import { scrapeSite } from "@/lib/scrape-site";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";

export const maxDuration = 30;

/**
 * Scrape d'un site existant pour pré-remplir l'étape collect de /creer.
 * Public (avant création de compte) : rate-limité par IP, fetch borné et
 * anti-SSRF dans scrapeSite. Aucune persistance — le client fusionne le
 * résultat dans son état local (mergeScrapedIntoCollected).
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`scrape:${requestIp(request)}`, { windowMs: 60_000, max: 6 })) {
    return NextResponse.json({ error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim().slice(0, 300) : "";
  if (url.length < 4) {
    return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
  }

  const data = await scrapeSite(url);
  if (!data) {
    return NextResponse.json({ ok: false, error: "Site inaccessible — vérifiez l'adresse." });
  }
  return NextResponse.json({ ok: true, data });
}
