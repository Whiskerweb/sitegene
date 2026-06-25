/**
 * Critères de qualité SUR-MESURE par métier (étape « pitch » de /creer). Mistral
 * lit la description et renvoie les sujets qu'un bon site pour CE métier devrait
 * couvrir — un artiste (univers, œuvres, expositions, commandes), un plombier
 * (urgences, devis, zone), un coach (accompagnement, résultats, séances) n'ont
 * PAS les mêmes questions. Chaque sujet : `tip` (la question à poser si l'info
 * manque) + `keywords` (mots-clés de détection LOCALE, instantanée côté client).
 * Ne peut pas échouer : repli sur un jeu générique ; jamais bloquant.
 */

import { detectTrade, type TradeId } from "./suggest";

type ChatFn = (
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { json?: boolean; maxTokens?: number; temperature?: number },
) => Promise<string>;

export type QualityTopic = { tip: string; keywords: string[] };

const TIMEOUT_MS = 12_000;

/** Heuristique de repli pour extraire un nom de marque si l'IA n'en renvoie pas
 *  (ex. « Je suis Atelier Lumière, … » → « Atelier Lumière »). Best-effort. */
function fallbackBrand(brief: string): string {
  const m =
    brief.match(/(?:je suis|c'?est|nous sommes|au|chez|mon (?:entreprise|activite|studio|cabinet|atelier) (?:s'?appelle|est))\s+«?\s*([A-ZÉÈÀ][\wÀ-ÿ&'’.-]*(?:\s+[A-ZÉÈÀ0-9][\wÀ-ÿ&'’.-]*){0,3})/);
  return m ? m[1].trim().slice(0, 60) : "";
}

/** Repli GÉNÉRIQUE (métier inconnu / « autre »). */
export const FALLBACK: QualityTopic[] = [
  { tip: "Quelles sont vos offres ou prestations concrètes ?", keywords: ["service", "prestation", "offre", "propose", "formule", "forfait"] },
  { tip: "Pour qui travaillez-vous (votre clientèle) ?", keywords: ["accompagn", "clientele", "particulier", "professionnel", "entreprise", "destine", "aupres"] },
  { tip: "Depuis combien de temps exercez-vous ?", keywords: ["depuis", "ans", "experience", "annee"] },
  { tip: "Où intervenez-vous (ville, zone, à distance) ?", keywords: ["region", "ville", "zone", "secteur", "domicile", "visio", "ligne", "departement"] },
  { tip: "Qu'est-ce qui vous différencie des autres ?", keywords: ["different", "unique", "approche", "specialit", "sur-mesure", "personnalis", "expertise"] },
  { tip: "Donnez une idée de vos tarifs (ou « à partir de »).", keywords: ["tarif", "prix", "euro", "forfait", "devis", "gratuit"] },
];

/** Repli ADAPTÉ AU MÉTIER : si Mistral est indisponible/lent, on garde des
 *  questions pertinentes pour le secteur (détectées via le domaine), au lieu de
 *  retomber sur du générique. tradeId déduit par detectTrade(domaine). */
export const FALLBACK_BY_TRADE: Partial<Record<TradeId, QualityTopic[]>> = {
  musicien: [
    { tip: "Quel est votre univers / style musical ?", keywords: ["style", "univers", "genre", "sonorite", "influence", "ambiance"] },
    { tip: "Quels morceaux ou projets avez-vous sortis ?", keywords: ["morceau", "album", "single", "ep", "titre", "sortie", "projet"] },
    { tip: "Où jouez-vous en concert (vos dates) ?", keywords: ["concert", "scene", "date", "live", "tournee", "salle"] },
    { tip: "Où peut-on vous écouter (streaming, clips) ?", keywords: ["spotify", "deezer", "youtube", "soundcloud", "streaming", "clip", "ecouter"] },
    { tip: "Comment vous booker (contact pro) ?", keywords: ["booking", "booker", "contact", "management", "label"] },
  ],
  fitness: [
    { tip: "Quel type de coaching proposez-vous ?", keywords: ["coaching", "programme", "seance", "cours", "suivi", "perso"] },
    { tip: "Pour qui (niveau, objectifs) ?", keywords: ["debutant", "sportif", "objectif", "perte", "prise", "public"] },
    { tip: "En salle, à domicile ou en ligne ?", keywords: ["salle", "domicile", "ligne", "visio", "exterieur"] },
    { tip: "Vos résultats / transformations ?", keywords: ["resultat", "transformation", "avant", "apres", "progres", "temoignage"] },
    { tip: "Vos formules et tarifs ?", keywords: ["tarif", "prix", "forfait", "abonnement", "seance", "formule"] },
  ],
  coach: [
    { tip: "Quel accompagnement proposez-vous ?", keywords: ["accompagn", "coaching", "seance", "programme", "suivi"] },
    { tip: "Pour qui (votre public) ?", keywords: ["public", "particulier", "professionnel", "dirigeant", "cible", "aupres"] },
    { tip: "Quelle est votre méthode / approche ?", keywords: ["methode", "approche", "outil", "technique", "demarche"] },
    { tip: "Quels résultats vos clients obtiennent ?", keywords: ["resultat", "transformation", "temoignage", "avis", "progres"] },
    { tip: "Comment se déroule une séance ?", keywords: ["seance", "deroule", "etape", "premier", "rendez-vous", "visio"] },
  ],
  "bien-etre": [
    { tip: "Quelles pratiques / soins proposez-vous ?", keywords: ["soin", "pratique", "seance", "massage", "yoga", "cours", "atelier"] },
    { tip: "Pour quels besoins (stress, sommeil…) ?", keywords: ["stress", "sommeil", "detente", "equilibre", "besoin", "bienfait"] },
    { tip: "En studio, à domicile ou en ligne ?", keywords: ["studio", "domicile", "ligne", "visio", "cabinet"] },
    { tip: "Pour qui (votre public) ?", keywords: ["public", "particulier", "debutant", "femme", "enceinte", "senior"] },
    { tip: "Vos formules et tarifs ?", keywords: ["tarif", "prix", "forfait", "seance", "carte", "abonnement"] },
  ],
  photographe: [
    { tip: "Quel type de photo (mariage, portrait…) ?", keywords: ["mariage", "portrait", "shooting", "evenement", "produit", "famille"] },
    { tip: "Votre style / univers visuel ?", keywords: ["style", "univers", "lumineux", "naturel", "argentique", "editorial"] },
    { tip: "Que comprennent vos prestations (livrables) ?", keywords: ["livrable", "galerie", "retouche", "tirage", "album", "seance"] },
    { tip: "Où intervenez-vous ?", keywords: ["region", "ville", "deplacement", "studio", "domicile", "zone"] },
    { tip: "Vos forfaits et tarifs ?", keywords: ["tarif", "prix", "forfait", "formule", "a partir"] },
  ],
  artisan: [
    { tip: "Quelles prestations proposez-vous ?", keywords: ["prestation", "installation", "depannage", "renovation", "pose", "travaux"] },
    { tip: "Intervenez-vous en urgence / délais ?", keywords: ["urgence", "depannage", "delai", "rapide", "disponibilite"] },
    { tip: "Quelle est votre zone d'intervention ?", keywords: ["zone", "secteur", "region", "ville", "deplacement", "rayon", "departement"] },
    { tip: "Proposez-vous un devis gratuit ?", keywords: ["devis", "gratuit", "estimation"] },
    { tip: "Vos garanties / certifications ?", keywords: ["garantie", "decennale", "certifi", "label", "rge", "qualibat", "qualifelec", "assurance"] },
  ],
  restaurant: [
    { tip: "Quel type de cuisine / votre carte ?", keywords: ["cuisine", "carte", "menu", "plat", "specialite", "maison"] },
    { tip: "Quelle ambiance / quel cadre ?", keywords: ["ambiance", "cadre", "decor", "terrasse", "convivial", "cosy"] },
    { tip: "Où êtes-vous situé / vos horaires ?", keywords: ["adresse", "situe", "horaire", "ouvert", "ville", "quartier"] },
    { tip: "Réservation / commande possible ?", keywords: ["reservation", "reserver", "commande", "emporter", "livraison"] },
    { tip: "Vos prix / formules ?", keywords: ["tarif", "prix", "menu", "formule", "midi", "carte"] },
  ],
  beaute: [
    { tip: "Quelles prestations proposez-vous ?", keywords: ["prestation", "coupe", "coloration", "soin", "manucure", "maquillage"] },
    { tip: "Pour qui (homme, femme, enfant) ?", keywords: ["homme", "femme", "enfant", "mixte", "public"] },
    { tip: "En salon, à domicile ?", keywords: ["salon", "domicile", "institut", "cabine", "deplacement"] },
    { tip: "Réservation / prise de rendez-vous ?", keywords: ["reservation", "rendez-vous", "rdv", "reserver", "booking"] },
    { tip: "Vos tarifs / prestations phares ?", keywords: ["tarif", "prix", "forfait", "carte", "prestation"] },
  ],
  conseil: [
    { tip: "Quels services / expertises proposez-vous ?", keywords: ["service", "expertise", "prestation", "accompagn", "mission", "conseil"] },
    { tip: "Pour quels clients (TPE, PME…) ?", keywords: ["client", "tpe", "pme", "entreprise", "particulier", "startup", "secteur"] },
    { tip: "Quelle est votre approche / méthode ?", keywords: ["approche", "methode", "demarche", "process", "accompagn"] },
    { tip: "Vos références / réalisations ?", keywords: ["reference", "realisation", "portfolio", "cas", "projet"] },
    { tip: "Comment vous contacter (premier échange) ?", keywords: ["contact", "rendez-vous", "devis", "echange", "appel"] },
  ],
};

/** Repli trade-aware PUR (client-safe) : set de sujets dédié au métier, sinon
 *  le générique. Réutilisable côté client pour une 1re jauge déjà par métier
 *  (avant l'appel IA), via detectTrade(domaine). */
export function pickFallbackTopics(trade: TradeId): QualityTopic[] {
  return FALLBACK_BY_TRADE[trade] ?? FALLBACK;
}

/** Choisit le repli le plus pertinent à partir du domaine (puis du brief). */
function fallbackTopics(domain: string, brief: string): QualityTopic[] {
  return pickFallbackTopics(detectTrade(domain || brief).trade);
}

export async function generateQualityCriteria(
  input: { brief: string; domain: string },
  chat: ChatFn,
): Promise<{ topics: QualityTopic[]; businessName: string; source: "ai" | "fallback" }> {
  const brief = input.brief.trim();
  const domain = input.domain.trim();
  if (!process.env.MISTRAL_API_KEY) return { topics: fallbackTopics(domain, brief), businessName: fallbackBrand(brief), source: "fallback" };

  const system = `Tu aides un professionnel à enrichir la description de son activité pour qu'on lui crée un meilleur site vitrine. Son DOMAINE t'est donné ; tu listes les SUJETS qu'un bon site pour CE domaine précis devrait couvrir, et tu EXTRAIS le nom de son activité/marque s'il est énoncé. Les sujets DIFFÈRENT selon le secteur :
- un ARTISTE (peintre, musicien…) : son univers/style, ses œuvres/réalisations, expositions/concerts, commandes sur-mesure, ce qui l'inspire — PAS forcément des « tarifs » classiques.
- un ARTISAN (plombier, électricien…) : prestations, urgences/délais, zone d'intervention, devis gratuit, garanties.
- un COACH / THÉRAPEUTE : accompagnement, public, méthode, résultats/preuves, déroulé d'une séance.
- un COMMERCE / RESTAURANT : offre/carte, ambiance, horaires, localisation, réservation.
Adapte-toi à CE domaine, n'invente pas de sujet hors-sujet.

RÈGLES :
- "businessName" : le NOM de l'activité/marque s'il est CLAIREMENT énoncé dans la description (ex. « Atelier Lumière », « EloMoc »). Si aucun nom propre n'est donné, renvoie une chaîne vide "". N'invente JAMAIS de nom.
- "topics" : 6 à 8 sujets, ORDONNÉS du plus important au moins important POUR CE DOMAINE.
- Pour chaque sujet :
  • "tip" : la question à poser au client si l'info manque — COURTE (max ~60 caractères), en français, vouvoiement, SPÉCIFIQUE au domaine (ex. pour un artiste : « Où exposez-vous vos œuvres ? », pas « Vos tarifs ? »). L'un des sujets DOIT concerner le nom de l'activité si "businessName" est vide (ex. « Quel est le nom de votre activité ? »).
  • "keywords" : 4 à 7 mots-clés DISCRIMINANTS en MINUSCULES, SANS accents, d'au moins 4 lettres, qui détectent dans un texte libre que le sujet est traité. Privilégie des RADICAUX (ex. "exposit", "galerie", "commande", "depannage", "urgence"). ÉVITE les mots vides ou trop courants ("pour", "avec", "comment", "client", "service").
- Réponds en JSON STRICT : { "businessName": "...", "topics": [ { "tip": "...", "keywords": ["...", "..."] }, ... ] }. Rien d'autre.`;

  const user = `DOMAINE : « ${domain || "(non précisé)"} »
DESCRIPTION DONNÉE PAR LE CLIENT :
"""${brief.slice(0, 2500) || "(pas encore de description — base-toi sur le DOMAINE)"}"""

Renvoie le JSON : le nom extrait (ou "") + 6-8 sujets adaptés à CE domaine.`;

  let raw: string;
  try {
    raw = await Promise.race([
      chat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { json: true, maxTokens: 600, temperature: 0.3 },
      ),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
  } catch {
    return { topics: fallbackTopics(domain, brief), businessName: fallbackBrand(brief), source: "fallback" };
  }

  try {
    const obj = JSON.parse(raw) as { topics?: unknown; businessName?: unknown };
    const businessName =
      typeof obj.businessName === "string" && obj.businessName.trim()
        ? obj.businessName.trim().slice(0, 60)
        : fallbackBrand(brief);
    const arr = Array.isArray(obj.topics) ? obj.topics : [];
    const topics = arr
      .map((x) => {
        const o = x as Record<string, unknown>;
        const tip = typeof o?.tip === "string" ? o.tip.trim().slice(0, 90) : "";
        const keywords = Array.isArray(o?.keywords)
          ? (o.keywords as unknown[])
              .filter((k): k is string => typeof k === "string" && k.trim().length > 1)
              .map((k) => k.trim().toLowerCase())
              .slice(0, 8)
          : [];
        return tip && keywords.length > 0 ? { tip, keywords } : null;
      })
      .filter((x): x is QualityTopic => x !== null)
      .slice(0, 8);
    if (topics.length === 0) return { topics: fallbackTopics(domain, brief), businessName, source: "fallback" };
    return { topics, businessName, source: "ai" };
  } catch {
    return { topics: fallbackTopics(domain, brief), businessName: fallbackBrand(brief), source: "fallback" };
  }
}
