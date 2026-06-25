/**
 * [3.4] Extraction des données d'un site existant fourni par le client :
 * fetch côté serveur + extraction des métadonnées, textes, contacts et
 * réseaux sociaux. Les données pré-remplissent l'intake APRÈS validation
 * par l'utilisateur (résumé affiché dans la conversation).
 *
 * `extractSiteData` est pure (HTML → données) et testée ; `scrapeSite`
 * ajoute le fetch borné + garde anti-SSRF (jamais d'IP privée/locale).
 */

export type ScrapedSite = {
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  /** Liens sociaux/profils trouvés (réseaux + musique + pro), dédupliqués. */
  socialLinks: string[];
  /** Liens d'écoute (Spotify, SoundCloud, Bandcamp, Deezer…). */
  musicLinks: string[];
};

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "github.com",
  "behance.net",
  "dribbble.com",
  "pinterest.com",
];

const MUSIC_HOSTS = ["spotify.com", "soundcloud.com", "bandcamp.com", "deezer.com", "music.apple.com"];

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function metaContent(html: string, name: string): string | undefined {
  // <meta name="…" content="…"> ou <meta property="…" content="…"> (ordre libre).
  const re1 = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  const m = html.match(re1) ?? html.match(re2);
  return m ? decodeEntities(m[1]) : undefined;
}

/** Extraction pure des données utiles d'une page HTML. */
export function extractSiteData(html: string): ScrapedSite {
  const out: ScrapedSite = { socialLinks: [], musicLinks: [] };

  const title =
    metaContent(html, "og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (title) out.title = decodeEntities(title).slice(0, 120);

  const description =
    metaContent(html, "description") ?? metaContent(html, "og:description");
  if (description) out.description = description.slice(0, 400);

  // Texte « visible » approximé (sans scripts/styles/balises) pour les contacts.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  const email =
    html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] ??
    text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  if (email) out.email = email;

  const phone =
    html.match(/tel:\+?([\d\s().-]{8,18})/)?.[1] ??
    text.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/)?.[0];
  if (phone) out.phone = phone.trim();

  // Liens sociaux / musique.
  const hrefs = Array.from(html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)).map(
    (m) => m[1],
  );
  const seen = new Set<string>();
  for (const href of hrefs) {
    let host: string;
    try {
      host = new URL(href).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    const clean = href.split("?")[0].replace(/\/$/, "");
    if (seen.has(clean)) continue;
    if (MUSIC_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      seen.add(clean);
      out.musicLinks.push(clean);
    } else if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      seen.add(clean);
      out.socialLinks.push(clean);
      if (!out.instagram && host.endsWith("instagram.com")) {
        const handle = clean.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/)?.[1];
        if (handle) out.instagram = handle;
      }
    }
  }
  out.socialLinks = out.socialLinks.slice(0, 8);
  out.musicLinks = out.musicLinks.slice(0, 8);

  return out;
}

/** Vrai si l'hôte résout vers une cible interdite (anti-SSRF, sans DNS). */
export function isForbiddenHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv4 littérale privée/locale.
  const ip = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  // IPv6 littérale (loopback, link-local…) — on refuse toutes les littérales.
  if (h.includes(":")) return true;
  return false;
}

const MAX_BYTES = 800_000;

/** Récupère et extrait les données d'un site public (http/https uniquement). */
export async function scrapeSite(rawUrl: string): Promise<ScrapedSite | null> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || isForbiddenHost(url.hostname)) return null;

  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AkyraBot/1.0; +https://akyra.io)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("xhtml")) return null;
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(
      buf.slice(0, MAX_BYTES),
    );
    return extractSiteData(html);
  } catch (e) {
    console.error("[scrape-site]", e instanceof Error ? e.message : e);
    return null;
  }
}
