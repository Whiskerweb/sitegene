/**
 * Catalogue de domaines/métiers concrets pour le sélecteur de l'étape « pitch »
 * de /creer (autocomplétion). Chaque domaine est mappé à un `TradeId` parent
 * (réutilise l'affinité DA de da-personas) et, si pertinent, à un sous-persona
 * (`sub`) connu de da-personas (aujourd'hui seul « musicien » a rap/rock/
 * contemporain). Le `label` est affiché ET envoyé à l'IA pour générer des
 * questions adaptées ; les `aliases` (sans accents) élargissent la recherche.
 *
 * Valeur libre autorisée : si l'utilisateur tape un domaine absent du catalogue,
 * on le conserve tel quel (l'IA s'en sort, et `detectTrade` retombe sur « autre »).
 */
import type { TradeId } from "./da-personas";

export interface DomainEntry {
  label: string; // ex. « Musicien rap »
  tradeId: TradeId; // famille (affinité vibes)
  sub?: string; // sous-persona da-personas (rap | rock | contemporain…)
  aliases?: string[]; // termes de recherche supplémentaires, en minuscules sans accents
}

export const DOMAIN_CATALOG: DomainEntry[] = [
  // — Musicien (avec sous-personas da-personas) —
  { label: "Musicien", tradeId: "musicien", aliases: ["musique", "artiste", "groupe", "scene"] },
  { label: "Musicien rap", tradeId: "musicien", sub: "rap", aliases: ["rappeur", "rappeuse", "hip-hop", "trap", "drill"] },
  { label: "Musicien rock", tradeId: "musicien", sub: "rock", aliases: ["groupe", "band", "metal", "punk", "guitare"] },
  { label: "Chanteur / Auteur-compositeur", tradeId: "musicien", sub: "contemporain", aliases: ["chanteuse", "compositeur", "pop", "folk", "acoustique", "variete"] },
  { label: "DJ / Producteur", tradeId: "musicien", aliases: ["dj", "producteur", "beatmaker", "electro", "techno", "house"] },
  { label: "Beatmaker", tradeId: "musicien", aliases: ["beatmaker", "prod", "instru", "type beat"] },
  { label: "Instrumentiste", tradeId: "musicien", aliases: ["pianiste", "guitariste", "violoniste", "saxophoniste", "musicien"] },

  // — Fitness —
  { label: "Coach sportif", tradeId: "fitness", aliases: ["coach sportif", "personal trainer", "preparateur physique"] },
  { label: "Salle de sport / Studio fitness", tradeId: "fitness", aliases: ["salle de sport", "fitness", "musculation", "studio"] },
  { label: "Coach CrossFit", tradeId: "fitness", aliases: ["crossfit", "box", "wod"] },
  { label: "Coach de musculation", tradeId: "fitness", aliases: ["musculation", "prise de masse", "bodybuilding"] },

  // — Coach / thérapie —
  { label: "Coach en développement personnel", tradeId: "coach", aliases: ["developpement personnel", "coach de vie", "epanouissement"] },
  { label: "Coach professionnel / business", tradeId: "coach", aliases: ["coach pro", "business coach", "entreprise", "carriere"] },
  { label: "Thérapeute", tradeId: "coach", aliases: ["therapeute", "therapie", "accompagnement"] },
  { label: "Hypnothérapeute", tradeId: "coach", aliases: ["hypnose", "hypnotherapeute"] },
  { label: "Psychologue / Psychopraticien", tradeId: "coach", aliases: ["psy", "psychologue", "psychopraticien"] },

  // — Bien-être —
  { label: "Professeur de yoga", tradeId: "bien-etre", aliases: ["yoga", "yogi", "vinyasa", "hatha"] },
  { label: "Sophrologue", tradeId: "bien-etre", aliases: ["sophrologie", "sophrologue", "relaxation"] },
  { label: "Naturopathe", tradeId: "bien-etre", aliases: ["naturopathe", "naturopathie"] },
  { label: "Masseur / Praticien bien-être", tradeId: "bien-etre", aliases: ["massage", "masseur", "spa", "reiki"] },
  { label: "Professeur de Pilates", tradeId: "bien-etre", aliases: ["pilates"] },
  { label: "Praticien en méditation", tradeId: "bien-etre", aliases: ["meditation", "pleine conscience", "mindfulness"] },

  // — Photographe —
  { label: "Photographe", tradeId: "photographe", aliases: ["photographie", "photo", "shooting"] },
  { label: "Photographe de mariage", tradeId: "photographe", aliases: ["mariage", "wedding"] },
  { label: "Photographe portrait", tradeId: "photographe", aliases: ["portrait", "studio"] },
  { label: "Vidéaste", tradeId: "photographe", aliases: ["videaste", "video", "film", "clip"] },

  // — Artisan / bâtiment —
  { label: "Électricien", tradeId: "artisan", aliases: ["electricien", "electricite", "depannage electrique"] },
  { label: "Plombier / Chauffagiste", tradeId: "artisan", aliases: ["plombier", "chauffagiste", "plomberie", "chauffage"] },
  { label: "Menuisier", tradeId: "artisan", aliases: ["menuisier", "menuiserie", "bois"] },
  { label: "Maçon", tradeId: "artisan", aliases: ["macon", "maconnerie", "gros oeuvre"] },
  { label: "Peintre en bâtiment", tradeId: "artisan", aliases: ["peintre", "peinture", "ravalement"] },
  { label: "Paysagiste / Jardinier", tradeId: "artisan", aliases: ["paysagiste", "jardinier", "jardin", "espaces verts"] },
  { label: "Couvreur", tradeId: "artisan", aliases: ["couvreur", "toiture", "charpente"] },
  { label: "Serrurier", tradeId: "artisan", aliases: ["serrurier", "serrurerie"] },
  { label: "Artisan rénovation", tradeId: "artisan", aliases: ["renovation", "travaux", "btp", "tout corps d'etat"] },

  // — Restaurant / food —
  { label: "Restaurant", tradeId: "restaurant", aliases: ["resto", "table", "cuisine", "bistrot"] },
  { label: "Traiteur", tradeId: "restaurant", aliases: ["traiteur", "evenement", "reception"] },
  { label: "Chef à domicile", tradeId: "restaurant", aliases: ["chef", "chef a domicile", "prive"] },
  { label: "Boulangerie / Pâtisserie", tradeId: "restaurant", aliases: ["boulangerie", "patisserie", "boulanger", "patissier"] },
  { label: "Café / Bistrot", tradeId: "restaurant", aliases: ["cafe", "bistrot", "brunch", "salon de the"] },
  { label: "Food truck", tradeId: "restaurant", aliases: ["food truck", "street food", "ambulant"] },

  // — Beauté —
  { label: "Coiffeur / Coiffeuse", tradeId: "beaute", aliases: ["coiffeur", "coiffure", "salon"] },
  { label: "Barbier", tradeId: "beaute", aliases: ["barbier", "barbe", "barbershop"] },
  { label: "Esthéticienne / Institut", tradeId: "beaute", aliases: ["esthetique", "estheticienne", "institut", "soin"] },
  { label: "Prothésiste ongulaire", tradeId: "beaute", aliases: ["onglerie", "ongles", "nail", "manucure"] },
  { label: "Maquilleur(se)", tradeId: "beaute", aliases: ["maquillage", "make up", "mua"] },
  { label: "Tatoueur", tradeId: "beaute", aliases: ["tatoueur", "tatouage", "tattoo"] },

  // — Conseil / services —
  { label: "Consultant", tradeId: "conseil", aliases: ["consultant", "conseil", "expertise"] },
  { label: "Avocat", tradeId: "conseil", aliases: ["avocat", "juridique", "droit"] },
  { label: "Expert-comptable", tradeId: "conseil", aliases: ["expert-comptable", "comptable", "comptabilite"] },
  { label: "Architecte", tradeId: "conseil", aliases: ["architecte", "architecture", "maitre d'oeuvre"] },
  { label: "Développeur / Freelance tech", tradeId: "conseil", aliases: ["developpeur", "freelance", "saas", "logiciel", "application"] },
  { label: "Agence (web / com / marketing)", tradeId: "conseil", aliases: ["agence", "web", "communication", "marketing"] },
  { label: "Courtier / Immobilier", tradeId: "conseil", aliases: ["courtier", "immobilier", "agent immobilier"] },
  { label: "Formateur", tradeId: "conseil", aliases: ["formateur", "formation", "organisme"] },
];

/** Minuscules + sans accents, pour une recherche tolérante. */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const words = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean);

/** Score d'une entrée pour une requête (tokens). Renvoie -1 si un token de la
 *  requête n'est trouvé nulle part (entrée exclue). Le `label` prime sur les
 *  `aliases`, et le préfixe de mot prime sur la sous-chaîne. */
function scoreEntry(entry: DomainEntry, qTokens: string[], qFull: string): number {
  const label = norm(entry.label);
  const aliasText = (entry.aliases ?? []).map(norm).join(" ");
  const labelWords = words(label);
  const aliasWords = words(aliasText);
  let score = 0;
  for (const t of qTokens) {
    let s = 0;
    if (labelWords.some((w) => w.startsWith(t))) s = 4;
    else if (label.includes(t)) s = 3;
    else if (aliasWords.some((w) => w.startsWith(t))) s = 2;
    else if (aliasText.includes(t)) s = 1;
    if (s === 0) return -1; // token absent → pas une suggestion pertinente
    score += s;
  }
  if (label.startsWith(qFull)) score += 3; // bonus : le label commence par la requête
  return score;
}

/**
 * Recherche dans le catalogue : tokenise la requête (multi-mots), exige que
 * CHAQUE token soit trouvé (label ou alias), classe le label avant les alias et
 * le préfixe avant la sous-chaîne. Query vide → premières entrées (amorçage).
 */
export function searchDomains(query: string, limit = 8): DomainEntry[] {
  const qFull = norm(query);
  if (!qFull) return DOMAIN_CATALOG.slice(0, limit);
  const qTokens = qFull.split(/\s+/).filter(Boolean);
  const scored: { entry: DomainEntry; score: number; idx: number }[] = [];
  DOMAIN_CATALOG.forEach((entry, idx) => {
    const score = scoreEntry(entry, qTokens, qFull);
    if (score >= 0) scored.push({ entry, score, idx });
  });
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  return scored.slice(0, limit).map((s) => s.entry);
}

/** Retrouve l'entrée exacte choisie (par label), pour récupérer tradeId + sub. */
export function findDomain(label: string): DomainEntry | undefined {
  const l = norm(label);
  return DOMAIN_CATALOG.find((e) => norm(e.label) === l);
}
