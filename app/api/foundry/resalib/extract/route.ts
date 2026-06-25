import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { chat } from "@/lib/mistral";
import { rateLimitAllowed, requestIp } from "@/lib/rate-limit";
import { isForbiddenHost } from "@/lib/scrape-site";
import {
  isResalibUrl,
  isResalibImageHost,
  parseResalibHtml,
  extractResalibProfile,
} from "@/lib/foundry/resalib";

export const maxDuration = 90;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTML_MAX = 1_500_000; // page profil Resalib riche
const IMG_MAX = 8 * 1024 * 1024;
const MAX_PHOTOS = 6;
const IMG_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Fetch HTML borné + anti-SSRF (http/https public uniquement). */
async function fetchHtml(rawUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || isForbiddenHost(url.hostname)) return null;
  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; AkyraBot/1.0; +https://akyra.io)", accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("html")) return null;
    const buf = await res.arrayBuffer();
    return new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, HTML_MAX));
  } catch {
    return null;
  }
}

/** Télécharge une image Resalib et la ré-héberge en staging ; renvoie l'URL publique. */
async function rehostImage(admin: ReturnType<typeof createAdminClient>, draftId: string, src: string): Promise<string | null> {
  if (!isResalibImageHost(src)) return null;
  try {
    const res = await fetch(src, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = IMG_EXT[type];
    if (!ext) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > IMG_MAX) return null;
    const path = `staging/${draftId.toLowerCase()}/resalib-${randomUUID()}.${ext}`;
    const { error } = await admin.storage.from("site-photos").upload(path, buf, { contentType: type, upsert: false });
    if (error) return null;
    return admin.storage.from("site-photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Import « profil Resalib » (coachs / médecine douce) : à partir d'un lien profil
 * resalib.fr, extrait nom/bio/spécialités/avis/adresse (parse + Mistral, repli
 * garanti) et ré-héberge les photos. Le lien lui-même devient le « Prendre
 * rendez-vous » du site (côté client via mergeResalibIntoCollected).
 */
export async function POST(request: Request) {
  if (!rateLimitAllowed(`resalib:${requestIp(request)}`, { windowMs: 60_000, max: 6 })) {
    return NextResponse.json({ error: "Trop de demandes — réessayez dans une minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const draftId = typeof body?.draftId === "string" ? body.draftId : "";
  if (!isResalibUrl(url)) {
    return NextResponse.json({ error: "Lien Resalib invalide (collez l'adresse de votre page profil)." }, { status: 400 });
  }
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const html = await fetchHtml(normalized);
  if (!html) {
    return NextResponse.json({ error: "Page Resalib introuvable ou inaccessible." }, { status: 502 });
  }

  const profile = await extractResalibProfile(html, chat);

  // Ré-hébergement des photos (best-effort, seulement si brouillon valide).
  let photos: string[] = [];
  if (UUID_RE.test(draftId)) {
    const admin = createAdminClient();
    const candidates = parseResalibHtml(html).imageUrls.slice(0, MAX_PHOTOS);
    const hosted = await Promise.all(candidates.map((src) => rehostImage(admin, draftId, src)));
    photos = hosted.filter((u): u is string => !!u);
  }

  return NextResponse.json({ ok: true, profile, photos, bookingUrl: normalized });
}
