// lib/foundry/resalib.ts
// Import « profil Resalib » (coachs / médecine douce du tunnel /creer). La page
// profil resalib.fr est rendue côté serveur → nom, bio, spécialités, adresse,
// avis et photos sont dans le HTML. On en déduit le maximum (parse pur + Mistral)
// et on fusionne dans `Collected` SANS jamais écraser une saisie du client. Le
// lien Resalib lui-même devient le bouton « Prendre rendez-vous » du site.
import { decodeEntities } from "@/lib/scrape-site";
import type { Collected, ReviewItem } from "./link-catalog";

/**
 * Contenu d'une balise <meta property|name="prop"> — robuste aux apostrophes
 * (fréquentes dans les bios FR) : on isole d'abord la balise, puis on extrait
 * `content` avec la MÊME quote ouvrante/fermante (une apostrophe interne à un
 * attribut double-quote ne coupe plus la valeur, contrairement à scrape-site).
 */
function ogMeta(html: string, prop: string): string | undefined {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, "i"))?.[0];
  const c = tag?.match(/content=(["'])([\s\S]*?)\1/i);
  return c ? decodeEntities(c[2]) : undefined;
}

export type ResalibProfile = {
  name?: string;
  /** Intitulé de métier (ex. « Psychologue Clinicienne »). */
  title?: string;
  /** Présentation COMPLÈTE, reformulée proprement (parcours, approche, philosophie). */
  bio?: string;
  specialties?: string[];
  /** Publics accompagnés (Enfant, Adolescent, Adulte…). */
  audiences?: string[];
  /** Modalités / lieux (Cabinet, À distance, Entreprise…). */
  modalities?: string[];
  /** Moyens de paiement (Espèces, Chèque, CB…). */
  payments?: string[];
  /** Diplômes & formations (1 par entrée). */
  credentials?: string[];
  /** Tarif lisible (ex. « 50€ »). */
  pricing?: string;
  /** Ancienneté déductible (ex. « depuis 2011 »). */
  experience?: string;
  address?: string;
  reviews?: ReviewItem[];
};

/** URL de profil Resalib valide (resalib.fr, chemin /praticien/…). */
export function isResalibUrl(raw: string): boolean {
  const v = (raw ?? "").trim();
  if (!v) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    return (host === "resalib.fr") && /\/praticien\//i.test(u.pathname);
  } catch {
    return false;
  }
}

/** Hôtes d'images autorisés au ré-hébergement (CDN/domaine Resalib uniquement). */
export function isResalibImageHost(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    return host === "resalib.fr" || host.endsWith(".resalib.fr") || host.endsWith(".cloudfront.net");
  } catch {
    return false;
  }
}

/**
 * Extraction PURE (regex, testable) des métadonnées d'une page profil Resalib :
 * nom (og:title nettoyé), bio (og:description), adresse (code postal + ville) et
 * URLs d'images Resalib. Les avis/spécialités fines viennent de Mistral.
 */
export function parseResalibHtml(html: string): {
  name?: string;
  bio?: string;
  address?: string;
  imageUrls: string[];
} {
  const out: { name?: string; bio?: string; address?: string; imageUrls: string[] } = { imageUrls: [] };

  const rawTitle = ogMeta(html, "og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (rawTitle) {
    // « Sophie Guerriero Naturopathe Sophrologue - Sophrologue à … | Resalib »
    // → on garde la partie avant « - » et on retire le suffixe « | Resalib ».
    const t = decodeEntities(rawTitle).replace(/\s*\|\s*Resalib\s*$/i, "").split(" - ")[0].trim();
    if (t) out.name = t.slice(0, 80);
  }

  // og:description de Resalib = SEO générique (« X pratique le métier de … —
  // découvrez les avis, coordonnées »), inutile comme bio → on l'ignore.
  const desc = ogMeta(html, "og:description") ?? ogMeta(html, "description");
  if (desc && !/pratique le métier de|découvrez les avis|coordonn[ée]es/i.test(desc)) out.bio = desc.slice(0, 600);

  // Adresse : « 855 chemin des pensions, 30380 Saint-Christol-lès-Alès ».
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const addr = text.match(/\d{1,4}\s+[^,<>]{4,60},?\s*\d{5}\s+[A-Za-zÀ-ÿ'\- ]{2,40}/)?.[0]
    ?? text.match(/\b\d{5}\s+[A-Za-zÀ-ÿ'\- ]{2,40}/)?.[0];
  if (addr) out.address = decodeEntities(addr.replace(/\s+/g, " ").trim()).slice(0, 120);

  // Images Resalib (og:image + <img src>), dédupliquées, hôtes Resalib seulement.
  const seen = new Set<string>();
  const push = (u?: string) => {
    if (!u) return;
    const abs = u.startsWith("//") ? `https:${u}` : u;
    if (!/^https?:\/\//i.test(abs) || !isResalibImageHost(abs)) return;
    const clean = abs.split("?")[0];
    if (seen.has(clean)) return;
    seen.add(clean);
    out.imageUrls.push(clean);
  };
  push(ogMeta(html, "og:image"));
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
  out.imageUrls = out.imageUrls.slice(0, 8);

  return out;
}

const SYSTEM_PROMPT = `Tu extrais TOUTES les informations utiles d'une page profil de praticien Resalib (psychologue, coach, sophrologue, naturopathe, thérapeute…) pour créer son site vitrine. On te donne le texte INTÉGRAL de la page. Capture TOUT ce qui est présent, puis METS EN FORME proprement (français soigné, présentation à la 1re personne). N'invente RIEN : si une info est absente, mets "" ou [].
Renvoie un JSON STRICT :
{
  "name": "<nom complet du praticien, sans la ville>",
  "title": "<intitulé de métier, ex. Psychologue Clinicienne>",
  "bio": "<présentation COMPLÈTE et fidèle : reprends TOUT le texte de présentation (parcours, formations, approche, philosophie, ce qu'il/elle propose) reformulé proprement en paragraphes — NE RÉSUME PAS à quelques phrases, garde toute la matière>",
  "specialties": ["<spécialité ou approche>", "..."],
  "audiences": ["<public accompagné, ex. Enfant, Adolescent, Adulte>", "..."],
  "modalities": ["<lieu/format, ex. Cabinet, À distance, Entreprise>", "..."],
  "payments": ["<moyen de paiement, ex. Espèces, Chèque, Carte bancaire>", "..."],
  "credentials": ["<un diplôme ou une formation par entrée, avec l'établissement si présent>", "..."],
  "pricing": "<tarif si présent, ex. 50€, sinon \"\">",
  "experience": "<ancienneté si déductible d'une date de création/d'exercice, ex. depuis 2011, sinon \"\">",
  "address": "<adresse complète si présente, sinon \"\">",
  "reviews": [{ "text": "<avis client>", "name": "<auteur ou initiales>", "rating": <1-5 si visible> }]
}
RÈGLES : la "bio" doit être RICHE et complète (ne perds AUCUNE information importante du parcours/de l'approche). Avis RÉELS uniquement (texte écrit par un client), max 12.`;

/**
 * Extraction structurée via Mistral (avis + spécialités + bio propre), avec repli
 * déterministe sur le parse regex/og — NE PEUT PAS échouer (l'onboarding continue
 * même IA coupée). `chatFn` injecté pour rester testable / client-safe.
 */
export async function extractResalibProfile(
  html: string,
  chatFn: (messages: { role: "system" | "user" | "assistant"; content: string }[], opts?: { json?: boolean; maxTokens?: number; temperature?: number }) => Promise<string>,
  opts?: { timeoutMs?: number },
): Promise<ResalibProfile> {
  const parsed = parseResalibHtml(html);
  const fallback: ResalibProfile = { name: parsed.name, bio: parsed.bio, address: parsed.address };

  if (!process.env.MISTRAL_API_KEY) return fallback;

  // Texte visible borné (sans balises) — suffisant pour bio/spécialités/avis.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16000);

  let raw: string;
  try {
    raw = await Promise.race([
      chatFn(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `PAGE PROFIL RESALIB :\n"""${text}"""\n\nRenvoie le JSON.` },
        ],
        { json: true, maxTokens: 6000, temperature: 0.1 },
      ),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), opts?.timeoutMs ?? 55000)),
    ]);
  } catch {
    return fallback;
  }

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw);
  } catch {
    return fallback;
  }

  const str = (v: unknown, max: number): string | undefined => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s.slice(0, max) : undefined;
  };
  const strList = (v: unknown, max: number, cap: number): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const out = v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, max)).slice(0, cap);
    return out.length ? out : undefined;
  };
  const reviews = Array.isArray(obj.reviews)
    ? obj.reviews
        .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
        .map((r) => ({
          text: typeof r.text === "string" ? r.text.trim().slice(0, 600) : "",
          name: typeof r.name === "string" ? r.name.trim().slice(0, 60) : "",
          rating: typeof r.rating === "number" && Number.isFinite(r.rating) ? r.rating : undefined,
        }))
        .filter((r) => r.text.length > 0)
        .slice(0, 12)
    : undefined;

  return {
    name: str(obj.name, 80) ?? parsed.name,
    title: str(obj.title, 80),
    bio: str(obj.bio, 2500) ?? parsed.bio,
    specialties: strList(obj.specialties, 60, 10),
    audiences: strList(obj.audiences, 40, 8),
    modalities: strList(obj.modalities, 40, 8),
    payments: strList(obj.payments, 40, 8),
    credentials: strList(obj.credentials, 200, 10),
    pricing: str(obj.pricing, 60),
    experience: str(obj.experience, 60),
    address: str(obj.address, 120) ?? parsed.address,
    reviews: reviews && reviews.length ? reviews : undefined,
  };
}

/**
 * Fusionne un profil Resalib dans `Collected`. Ne remplace JAMAIS une valeur déjà
 * saisie par le client. Le lien Resalib devient le « Prendre rendez-vous » du site.
 */
export function mergeResalibIntoCollected(
  current: Collected,
  profile: ResalibProfile,
  resalibUrl: string,
  hostedPhotos: string[] = [],
): Collected {
  const next: Collected = {
    ...current,
    socials: [...current.socials],
    contact: { ...current.contact },
    photos: [...current.photos],
  };

  if (!next.booking) next.booking = { label: "Prendre rendez-vous", href: resalibUrl };

  if (profile.address && !next.contact.address) next.contact.address = profile.address;

  if (profile.reviews && profile.reviews.length) {
    next.reviews = [...(current.reviews ?? []), ...profile.reviews].slice(0, 24);
    next.hasReviews = true;
  }

  const photos = hostedPhotos.filter((p) => typeof p === "string" && !!p);
  if (photos.length) next.photos = [...next.photos, ...photos].slice(0, 20);

  return next;
}

/**
 * Présentation COMPLÈTE à ajouter à la description (pitch), composée de tout ce
 * que Resalib a livré → le moteur de génération a toute la matière du praticien.
 */
export function resalibBriefAddition(profile: ResalibProfile): string {
  const parts: string[] = [];
  if (profile.title) parts.push(profile.title.trim());
  if (profile.bio) parts.push(profile.bio.trim());
  if (profile.specialties?.length) parts.push(`Spécialités : ${profile.specialties.join(", ")}.`);
  if (profile.audiences?.length) parts.push(`Public accompagné : ${profile.audiences.join(", ")}.`);
  if (profile.modalities?.length) parts.push(`Modalités : ${profile.modalities.join(", ")}.`);
  if (profile.credentials?.length) parts.push(`Diplômes & formations : ${profile.credentials.join(" ; ")}.`);
  if (profile.experience) parts.push(`En activité ${profile.experience}.`);
  if (profile.pricing) parts.push(`Tarif : ${profile.pricing}.`);
  if (profile.payments?.length) parts.push(`Moyens de paiement : ${profile.payments.join(", ")}.`);
  if (profile.address) parts.push(`Adresse : ${profile.address}.`);
  return parts.join("\n");
}
