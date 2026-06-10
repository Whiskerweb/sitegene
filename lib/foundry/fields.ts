// lib/foundry/fields.ts
// Génère, depuis le contenu d'une section, des CHAMPS éditables simples pour
// le panneau de contenu de L'Atelier — sans aucun jargon technique. Pur (testé),
// pas de JSX : la clé brute (title, desc, items…) devient un libellé FR + un type
// de champ que l'éditeur sait afficher (texte, image, liste…).

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "imageList"
  | "stringList"
  | "objectList";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  value: unknown;
  /** Pour objectList : les sous-champs d'un item (forme du 1er item). */
  itemFields?: Array<{ key: string; label: string; type: FieldType }>;
}

const IMAGE_KEY = /image|avatar|photo|logo|cover|visual/i;
const LONG_KEY = /desc|description|body|quote|answer|tagline|subtitle|bio|intro|text|paragraph|a$/i;

/** Libellés FR des clés courantes (sinon, on embellit la clé brute). */
const LABELS: Record<string, string> = {
  title: "Titre",
  titleA: "Titre — ligne 1",
  titleB: "Titre — ligne 2",
  titleC: "Titre — ligne 3",
  subtitle: "Sous-titre",
  tagline: "Accroche",
  eyebrow: "Pré-titre",
  label: "Étiquette",
  badge: "Badge",
  cta: "Bouton",
  button: "Bouton",
  brand: "Nom de marque",
  name: "Nom",
  author: "Auteur",
  role: "Rôle / fonction",
  quote: "Citation",
  text: "Texte",
  body: "Texte",
  desc: "Description",
  description: "Description",
  subtitle2: "Sous-titre",
  price: "Prix",
  period: "Période",
  features: "Points inclus",
  items: "Éléments",
  plans: "Formules",
  steps: "Étapes",
  columns: "Colonnes",
  links: "Liens",
  q: "Question",
  a: "Réponse",
  question: "Question",
  answer: "Réponse",
  value: "Valeur",
  suffix: "Suffixe",
  proof: "Preuve sociale",
  proofCount: "Chiffre",
  proofLabel: "Légende du chiffre",
  reviews: "Note / avis",
  reviewsLabel: "Légende des avis",
  rating: "Note (étoiles)",
  email: "E-mail",
  phone: "Téléphone",
  address: "Adresse",
  copyright: "Mention légale",
  image: "Image",
  image2: "Image secondaire",
  images: "Images",
  avatar: "Photo",
  avatars: "Photos",
  logo: "Logo",
  heading: "Titre",
  sideTitle: "Titre (encart)",
  sideText: "Texte (encart)",
  availability: "Disponibilité",
  customerName: "Nom du client",
  customerRole: "Rôle du client",
  customerAvatar: "Photo du client",
  topbarPhone: "Téléphone (barre du haut)",
  topbarHours: "Horaires",
  topbarArea: "Zone d'intervention",
};

function prettify(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function scalarType(key: string, value: unknown): FieldType {
  if (IMAGE_KEY.test(key)) return "image";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string" && (value.length > 80 || LONG_KEY.test(key))) return "textarea";
  return "text";
}

/** Type de champ d'une valeur + clé (vue éditeur). */
export function fieldType(key: string, value: unknown): FieldType {
  if (Array.isArray(value)) {
    if (IMAGE_KEY.test(key)) return "imageList";
    if (value.every((v) => typeof v === "string")) return "stringList";
    if (value.some(isPlainObject)) return "objectList";
    return "stringList";
  }
  return scalarType(key, value);
}

/** Sous-champs d'un item de liste d'objets (forme du 1er item non vide). */
function itemFieldsOf(arr: unknown[]): Array<{ key: string; label: string; type: FieldType }> {
  const first = arr.find(isPlainObject) as Record<string, unknown> | undefined;
  if (!first) return [];
  return Object.entries(first).map(([k, v]) => ({ key: k, label: prettify(k), type: scalarType(k, v) }));
}

/**
 * Champs éditables d'une section, dans l'ordre du contenu. On masque les clés
 * vides/inconnues pour rester minimaliste (« voir ce qu'on a besoin de voir »).
 */
export function fieldsFor(content: Record<string, unknown>): Field[] {
  const fields: Field[] = [];
  for (const [key, value] of Object.entries(content)) {
    if (value === undefined || value === null) continue;
    const type = fieldType(key, value);
    const field: Field = { key, label: prettify(key), type, value };
    if (type === "objectList" && Array.isArray(value)) field.itemFields = itemFieldsOf(value);
    fields.push(field);
  }
  return fields;
}

export { prettify as labelForKey };
