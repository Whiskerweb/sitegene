/**
 * lib/crm/categories.ts — Catégories métier DU CRM (filtre/tri/reporting).
 *
 * Volontairement SÉPARÉ de lib/categories.ts (qui pilote la landing publique) :
 * on peut ajouter un vertical au CRM sans modifier la landing ni la base
 * (la colonne prospects.category est un text libre, validé ici).
 *
 * `templateIds` sert au backfill (migration 0011) et au pré-remplissage de la
 * catégorie à la création d'un prospect depuis un template.
 */
export type CrmCategoryId =
  | "photographe"
  | "artisan"
  | "musicien"
  | "electricien"
  | "elearning";

export type CrmCategory = {
  id: CrmCategoryId;
  label: string;
  /** Templates rattachés à ce métier (mapping de backfill). */
  templateIds: string[];
  /** Accent de chip (classes Tailwind). */
  cls: string;
};

export const CRM_CATEGORIES: CrmCategory[] = [
  { id: "photographe", label: "Photographe", templateIds: ["alice-r", "potozon", "target"], cls: "text-[#f0a9cf] border-[#f0a9cf]/30" },
  { id: "artisan",     label: "Artisan",     templateIds: ["arelec", "eloctix"],            cls: "text-[#9fd6a8] border-[#9fd6a8]/30" },
  { id: "musicien",    label: "Musicien",    templateIds: [],                                cls: "text-[#a9c5f0] border-[#a9c5f0]/30" },
  { id: "electricien", label: "Électricien", templateIds: [],                                cls: "text-gold-400 border-gold-400/30" },
  { id: "elearning",   label: "E-learning",  templateIds: [],                                cls: "text-violet-400 border-violet-400/30" },
];

const BY_ID = new Map(CRM_CATEGORIES.map((c) => [c.id, c]));

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "Non classé";
  return BY_ID.get(id as CrmCategoryId)?.label ?? id;
}

export function categoryDef(id: string | null | undefined): CrmCategory | undefined {
  return id ? BY_ID.get(id as CrmCategoryId) : undefined;
}

/** Catégorie déduite d'un template (mapping inverse du backfill). */
export function categoryFromTemplate(templateId: string | null | undefined): CrmCategoryId | null {
  if (!templateId) return null;
  const hit = CRM_CATEGORIES.find((c) => c.templateIds.includes(templateId));
  return hit ? hit.id : null;
}
