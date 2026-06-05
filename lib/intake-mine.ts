/**
 * [3.1] Extraction de champs structurés depuis un texte libre (brief de la
 * landing, réponses de la conversation). Pur et client-safe.
 *
 * À chaque réponse, on « coche » les champs déjà couverts : si la description
 * mentionne la ville, le tarif ou les spécialités, ces questions ne seront
 * PAS reposées (les questions inutiles = friction = abandon).
 *
 * Règle de fusion : ce qui est miné ne remplace JAMAIS une réponse explicite
 * du client (voir `mergeMined`).
 */
import type { Intake } from "@/lib/onboarding-config";

/** Retire les diacritiques et passe en minuscules. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Spécialités photographe détectables (valeurs de PHOTO_EVENT_OPTIONS). */
const EVENT_KEYWORDS: [event: string, needles: string[]][] = [
  ["mariage", ["mariage", "mariages", "wedding"]],
  ["portrait", ["portrait", "portraits"]],
  ["famille", ["famille", "familles", "familial"]],
  ["grossesse", ["grossesse", "naissance", "nouveau-ne", "maternite", "bebe"]],
  ["corporate", ["corporate", "entreprise", "entreprises", "professionnel"]],
  ["mode", ["mode", "editorial", "fashion", "lookbook"]],
  ["evenementiel", ["evenementiel", "concert", "concerts", "soiree", "soirees"]],
  ["immobilier", ["immobilier", "architecture", "architectural"]],
  ["culinaire", ["culinaire", "gastronomie", "restaurant", "food"]],
  ["animalier", ["animalier", "animaux", "chien", "chiens", "chat", "chats", "equin"]],
];

/** Genres musicaux courants (musicien). */
const GENRES = [
  "jazz",
  "rock",
  "electro",
  "techno",
  "house",
  "rap",
  "hip-hop",
  "hiphop",
  "pop",
  "folk",
  "metal",
  "classique",
  "reggae",
  "funk",
  "soul",
  "blues",
  "rnb",
  "variete",
  "chanson francaise",
];

/**
 * Analyse un texte libre et en extrait les champs d'intake qu'il couvre.
 * Ne renvoie QUE les champs trouvés (jamais de valeur vide).
 */
export function mineIntake(text: string): Partial<Intake> {
  const raw = (text ?? "").trim();
  if (raw.length < 3) return {};
  const t = normalize(raw);
  const out: Partial<Intake> = {};

  // Email.
  const email = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (email) out.contactEmail = email[0];

  // Téléphone FR (06 12 34 56 78, +33 6…).
  const phone = raw.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
  if (phone) out.contactPhone = phone[0].trim();

  // Instagram (URL ou @pseudo).
  const insta =
    raw.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/) ??
    raw.match(/(?:^|\s)@([a-zA-Z0-9._]{2,30})\b/);
  if (insta) out.instagram = insta[1];

  // Années d'expérience (« 8 ans d'expérience », « depuis 2012 »).
  const years =
    t.match(/(\d{1,2})\s*ans?\s*(?:d['e]\s*experience|de\s*metier)/) ??
    t.match(/depuis\s*(?:plus de\s*)?(\d{1,2})\s*ans/);
  if (years) out.experienceYears = `${years[1]} ans`;
  else {
    const since = t.match(/depuis\s+(19|20)(\d{2})/);
    if (since) out.experienceYears = `depuis ${since[1]}${since[2]}`;
  }

  // Tarifs (« à partir de 350 € », « dès 90€ », « 350 euros »).
  const price = raw.match(
    /(?:à partir de|a partir de|dès|des)\s*(\d[\d\s]{0,6})\s*(?:€|euros?)|(\d[\d\s]{0,6})\s*(?:€|euros?)/i,
  );
  if (price) {
    const n = (price[1] ?? price[2] ?? "").replace(/\s/g, "");
    if (n) out.priceRange = price[1] ? `à partir de ${n} €` : `${n} €`;
  }

  // Ville (« à Lyon », « basé à La Rochelle », « sur Bordeaux »). NB : pas de
  // \b devant « à » (hors \w ASCII) — on ancre sur début/espace/virgule.
  const city = raw.match(
    /(?:[Bb]asée?\s+à|[Ii]nstallée?\s+à|(?:^|[\s,])(?:à|sur))\s+([A-ZÀ-Þ][a-zà-ÿ'-]+(?:(?:[ -](?:de|du|des|en|le|la|les|sur|sous))*[ -][A-ZÀ-Þ][a-zà-ÿ'-]+)*)/,
  );
  if (city) out.city = city[1].trim();

  // Spécialités photographe.
  const events: string[] = [];
  for (const [event, needles] of EVENT_KEYWORDS) {
    if (needles.some((n) => t.includes(n))) events.push(event);
  }
  if (events.length > 0) out.eventTypes = events;

  // Genre musical.
  const genres = GENRES.filter((g) =>
    new RegExp(`(^|[^a-z0-9])${g}($|[^a-z0-9])`).test(t),
  );
  if (genres.length > 0) out.genre = genres.join(", ");

  return out;
}

/**
 * Fusionne des champs minés dans l'intake : un champ miné ne remplit qu'un
 * champ VIDE — la réponse explicite du client gagne toujours.
 */
export function mergeMined(intake: Intake, mined: Partial<Intake>): Intake {
  const next: Intake = { ...intake };
  for (const [key, value] of Object.entries(mined)) {
    const k = key as keyof Intake;
    const cur = next[k];
    const empty =
      cur === undefined ||
      cur === null ||
      (typeof cur === "string" && cur.trim() === "") ||
      (Array.isArray(cur) && cur.length === 0);
    if (empty) (next as Record<string, unknown>)[k] = value;
  }
  return next;
}
