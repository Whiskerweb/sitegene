/**
 * [3.4] Extraction du site existant du client : fetch + métadonnées, contacts
 * et réseaux. Le client affiche le résumé et demande VALIDATION avant de
 * pré-remplir l'intake (rien n'est écrit ici — lecture seule).
 */
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { scrapeSite } from "@/lib/scrape-site";

export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let body: { siteId?: string; url?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  if (!(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = String(body.url ?? "").trim();
  if (url.length < 4 || url.length > 300) {
    return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
  }

  const data = await scrapeSite(url);
  if (!data) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, data });
}
