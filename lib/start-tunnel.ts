/**
 * Tunnel outreach /start/<token> : le prospect a reçu un lien personnalisé,
 * son site (draft) et son contenu ont été préparés par l'admin (CRM/CLI).
 * Ici on amorce/charge son `site_onboarding` en SEMANT l'intake depuis la
 * fiche prospect (téléphone, ville, Instagram…) — c'est ce seed qui permet
 * au chatbot de ne jamais redemander une info connue.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateTemplates } from "@/lib/onboarding";
import { DEFAULT_CATEGORY, getCategory } from "@/lib/categories";
import { isTemplateId, type TemplateId } from "@/lib/templates";
import type { Intake } from "@/lib/onboarding-config";

export type StartState = {
  token: string;
  siteId: string;
  ownerUserId: string | null;
  firstName: string | null;
  categoryId: string;
  templateId: TemplateId | null;
  chosenTemplateId: string | null;
  candidateTemplateIds: TemplateId[];
  billingStatus: string;
  siteStatus: string;
};

/**
 * Charge l'état du tunnel pour un token, en créant le site_onboarding au
 * premier passage (seed depuis la fiche prospect). Renvoie null si token inconnu.
 */
export async function loadStartState(token: string): Promise<StartState | null> {
  const admin = createAdminClient();
  const { data: code } = await admin
    .from("prospect_codes")
    .select("id, site_id, prospect_id, status")
    .eq("token", token)
    .maybeSingle();
  if (!code?.site_id) return null;

  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, owner_user_id, status, billing_status")
    .eq("id", code.site_id)
    .maybeSingle();
  if (!site) return null;

  const { data: prospect } = code.prospect_id
    ? await admin
        .from("prospects")
        .select("first_name, email, phone, city, company_name, instagram, category")
        .eq("id", code.prospect_id)
        .maybeSingle()
    : { data: null };

  let { data: ob } = await admin
    .from("site_onboarding")
    .select("site_id, intake, chosen_template_id, candidate_template_ids")
    .eq("site_id", site.id)
    .maybeSingle();

  if (!ob) {
    // Premier passage : seed de l'intake depuis la fiche prospect (CRM).
    const categoryId =
      (prospect?.category && getCategory(prospect.category)?.id) || DEFAULT_CATEGORY.id;
    const intake: Intake & { categoryId?: string } = {
      categoryId,
      brand: prospect?.company_name || prospect?.first_name || undefined,
      contactEmail: prospect?.email || undefined,
      contactPhone: prospect?.phone || undefined,
      city: prospect?.city || undefined,
      instagram: prospect?.instagram || undefined,
    };
    const inserted = await admin
      .from("site_onboarding")
      .insert({
        site_id: site.id,
        intake,
        step: 0,
        candidate_template_ids: candidateTemplates(categoryId),
      })
      .select("site_id, intake, chosen_template_id, candidate_template_ids")
      .single();
    ob = inserted.data;
  }
  if (!ob) return null;

  const intake = (ob.intake ?? {}) as Intake & { categoryId?: string };
  const categoryId = intake.categoryId ?? DEFAULT_CATEGORY.id;
  const candidates = (ob.candidate_template_ids ?? []).filter(isTemplateId);

  return {
    token,
    siteId: site.id,
    ownerUserId: (site.owner_user_id as string) ?? null,
    firstName: prospect?.first_name ?? null,
    categoryId,
    templateId: isTemplateId(site.template_id) ? site.template_id : null,
    chosenTemplateId: ob.chosen_template_id ?? null,
    candidateTemplateIds:
      candidates.length > 0 ? candidates : candidateTemplates(categoryId),
    billingStatus: (site.billing_status as string) ?? "none",
    siteStatus: (site.status as string) ?? "draft",
  };
}
