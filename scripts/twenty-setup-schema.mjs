// Bootstrap idempotent du schéma Twenty (champs custom) via la Metadata API.
// Re-lançable : un champ déjà présent (standard ou custom) est sauté.
//
//   npm run twenty:setup
//
// NOTE : l'enveloppe de réponse de la Metadata API peut varier selon la version
// de Twenty déployée. Le script est tolérant et VERBEUX : il loggue chaque champ
// créé/sauté/échoué et continue. En cas d'échec d'un champ, créez-le à la main
// dans Twenty → Settings → Data model (les noms/types attendus sont ci-dessous).
import { metadataGet, metadataPost, twentyConfigured } from "../lib/twenty/client.ts";

const log = (...a) => console.log(...a);

if (!twentyConfigured()) {
  log("✗ TWENTY_URL / TWENTY_API_KEY manquant.");
  process.exit(1);
}

// --- Champs désirés ---------------------------------------------------------
// Sur Person : identité enrichie + état CRM dérivé d'Akyra.
const PERSON_FIELDS = [
  { name: "akyraProspectId", label: "Akyra Prospect ID", type: "TEXT" },
  { name: "instagram", label: "Instagram", type: "TEXT" },
  { name: "city", label: "Ville", type: "TEXT" },
  { name: "akyraSource", label: "Source Akyra", type: "TEXT" },
  { name: "leadScore", label: "Lead score", type: "NUMBER" },
  { name: "mrrCents", label: "MRR (cents)", type: "NUMBER" },
  { name: "akyraPlan", label: "Plan", type: "TEXT" }, // "plan" est réservé dans Twenty
  { name: "conversionDate", label: "Date de conversion", type: "DATE_TIME" },
  {
    name: "category",
    label: "Catégorie",
    type: "SELECT",
    // Twenty impose des valeurs d'option en MAJUSCULES_SNAKE.
    options: [
      { label: "Photographe", value: "PHOTOGRAPHE", color: "pink", position: 0 },
      { label: "Musicien", value: "MUSICIEN", color: "blue", position: 1 },
      { label: "Artisan", value: "ARTISAN", color: "green", position: 2 },
      { label: "Portfolio", value: "PORTFOLIO", color: "yellow", position: 3 },
      { label: "SaaS", value: "SAAS", color: "purple", position: 4 },
    ],
  },
  {
    name: "inscriptionStatus",
    label: "Statut d'inscription",
    type: "SELECT",
    options: [
      { label: "Pas inscrit", value: "PAS_INSCRIT", color: "gray", position: 0 },
      { label: "Inscrit", value: "INSCRIT", color: "blue", position: 1 },
      { label: "Client payant", value: "CLIENT_PAYANT", color: "green", position: 2 },
    ],
  },
];

// Sur Opportunity : lien vers le prospect Akyra (amount/stage/closeDate natifs).
const OPP_FIELDS = [{ name: "akyraProspectId", label: "Akyra Prospect ID", type: "TEXT" }];

// --- Helpers tolérants -------------------------------------------------------
function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") {
    if (Array.isArray(x.edges)) return x.edges.map((e) => e.node ?? e);
    for (const v of Object.values(x)) if (Array.isArray(v)) return v;
  }
  return [];
}

/** Récupère la liste des objets metadata, peu importe l'enveloppe. */
async function listObjects() {
  const resp = await metadataGet("/objects");
  const data = resp?.data ?? resp;
  return asArray(data);
}

function findObject(objects, nameSingular) {
  return objects.find(
    (o) => o?.nameSingular === nameSingular || o?.namePlural === `${nameSingular}s`,
  );
}

/** Noms de champs existants d'un objet (standard + custom). */
async function existingFieldNames(obj) {
  // L'objet peut déjà embarquer ses champs ; sinon on tente l'endpoint filtré.
  let fields = asArray(obj?.fields);
  if (!fields.length && obj?.id) {
    try {
      const resp = await metadataGet(`/fields?filter=object[eq]:${obj.id}`);
      fields = asArray(resp?.data ?? resp);
    } catch {
      /* ignore — on tentera la création, qui échouera proprement si doublon */
    }
  }
  return new Set(fields.map((f) => f?.name).filter(Boolean));
}

async function ensureField(obj, existing, spec) {
  if (existing.has(spec.name)) {
    log(`  = ${spec.name} (déjà présent)`);
    return "skip";
  }
  const body = {
    name: spec.name,
    label: spec.label,
    type: spec.type,
    objectMetadataId: obj.id,
    isNullable: true,
  };
  if (spec.options) body.options = spec.options;
  try {
    await metadataPost("/fields", body);
    log(`  + ${spec.name} créé (${spec.type})`);
    return "created";
  } catch (e) {
    log(`  ✗ ${spec.name} : ${e?.message ?? e}`);
    return "error";
  }
}

async function run() {
  const objects = await listObjects();
  if (!objects.length) {
    log("✗ Impossible de lister les objets metadata (vérifie l'URL/clé/version).");
    process.exit(1);
  }
  const person = findObject(objects, "person");
  const opportunity = findObject(objects, "opportunity");
  if (!person) {
    log("✗ Objet 'person' introuvable.");
    process.exit(1);
  }

  log("Person :");
  const personExisting = await existingFieldNames(person);
  for (const f of PERSON_FIELDS) await ensureField(person, personExisting, f);

  if (opportunity) {
    log("Opportunity :");
    const oppExisting = await existingFieldNames(opportunity);
    for (const f of OPP_FIELDS) await ensureField(opportunity, oppExisting, f);
  } else {
    log("! Objet 'opportunity' introuvable — champs Opportunity non créés.");
  }

  log("\nTerminé. Pense à noter l'id/nom du stage « gagné » (TWENTY_WON_STAGE).");
}

await run();
process.exit(0);
