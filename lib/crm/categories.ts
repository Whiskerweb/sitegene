/**
 * lib/crm/categories.ts — Catégories métier du CRM (filtre/groupement/reporting).
 *
 * DÉRIVÉES de lib/categories.ts, la source de vérité UNIQUE du mapping
 * template → catégorie (5 verticaux). Ce module n'ajoute que la couche CRM :
 * couleurs de chips + helpers de classement.
 *
 * Le miroir SQL est piloté par `templates.category` (migration 0015) : à
 * l'enregistrement d'un NOUVEAU template, renseigner sa catégorie en base.
 */
import { CATEGORIES, type CategoryId } from "@/lib/categories";

export type CrmCategoryId = CategoryId;

export type CrmCategory = {
  id: CrmCategoryId;
  label: string;
  /** Templates rattachés à ce métier (classement auto des prospects). */
  templateIds: string[];
  /** Accent de chip (classes Tailwind). */
  cls: string;
};

const CHIP_CLS: Record<string, string> = {
  photographe: "text-[#f0a9cf] border-[#f0a9cf]/30",
  musicien: "text-[#a9c5f0] border-[#a9c5f0]/30",
  artisan: "text-[#9fd6a8] border-[#9fd6a8]/30",
  portfolio: "text-gold-400 border-gold-400/30",
  saas: "text-violet-400 border-violet-400/30",
};

export const CRM_CATEGORIES: CrmCategory[] = CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  templateIds: [...c.templateIds],
  cls: CHIP_CLS[c.id] ?? "text-muted border-line",
}));

/** Templates historiques retirés du catalogue mais encore présents en base. */
const LEGACY_TEMPLATE_CATEGORY: Record<string, CrmCategoryId> = {
  arelec: "artisan",
  eloctix: "artisan",
};

const BY_ID = new Map(CRM_CATEGORIES.map((c) => [c.id, c]));

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "Non classé";
  return BY_ID.get(id as CrmCategoryId)?.label ?? id;
}

export function categoryDef(id: string | null | undefined): CrmCategory | undefined {
  return id ? BY_ID.get(id as CrmCategoryId) : undefined;
}

/** Catégorie déduite d'un template (site photographe → photographe, etc.). */
export function categoryFromTemplate(templateId: string | null | undefined): CrmCategoryId | null {
  if (!templateId) return null;
  const hit = CRM_CATEGORIES.find((c) => c.templateIds.includes(templateId));
  return hit ? hit.id : (LEGACY_TEMPLATE_CATEGORY[templateId] ?? null);
}
