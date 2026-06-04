import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildContent } from "@/lib/content-overlay";
import { templateMeta } from "@/lib/templates";

const BUCKET = "site-photos";

/**
 * Garantit que le template existe dans public.templates AVANT d'y référencer
 * un site : `sites.template_id` porte une FK vers cette table, mais le
 * catalogue vit dans le code (TEMPLATE_IDS) et seuls alice-r/potozon/target
 * sont seedés par 0001 — sans cet upsert, l'écriture échoue (silencieusement
 * si on ne lit pas l'erreur) et le site reste sur le template par défaut.
 */
export async function ensureTemplateRow(
  admin: ReturnType<typeof createAdminClient>,
  templateId: string,
): Promise<void> {
  await admin.from("templates").upsert(
    {
      id: templateId,
      name: templateMeta(templateId).name,
      bundle_path: `/_templates/${templateId}/`,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
}

export type PhotoUpload = {
  /** URL démo à remplacer, ex "/_templates/alice-r/img/p1.jpg". */
  slotUrl: string;
  data: ArrayBuffer;
  contentType: string;
};

export type GenerateInput = {
  templateId: string;
  firstName: string;
  email?: string | null;
  textOverrides: Record<string, unknown>;
  photos: PhotoUpload[];
  baseContent: Record<string, unknown>;
  createdBy: string;
};

export type GenerateResult = {
  siteId: string;
  token: string;
  revealPath: string;
};

/** Génère un site (draft) + son contenu + un code/lien de reveal. Service role. */
export async function generateSite(
  input: GenerateInput,
): Promise<GenerateResult> {
  const admin = createAdminClient();
  const siteId = randomUUID();

  // 1) Upload des photos vers Storage → map URL démo → URL publique.
  const imageMap: Record<string, string> = {};
  for (const photo of input.photos) {
    const base = photo.slotUrl.split("/").pop() || `${randomUUID()}.jpg`;
    const path = `${siteId}/${base}`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, photo.data, {
        contentType: photo.contentType,
        upsert: true,
      });
    if (upErr) throw new Error(`Upload ${base}: ${upErr.message}`);
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    imageMap[photo.slotUrl] = pub.publicUrl;
  }

  // 2) Contenu final.
  const content = buildContent(
    input.baseContent,
    input.textOverrides,
    imageMap,
  );

  // 3) Template enregistré (FK de sites.template_id) puis prospect.
  await ensureTemplateRow(admin, input.templateId);
  const { data: prospect, error: pErr } = await admin
    .from("prospects")
    .insert({
      first_name: input.firstName,
      email: input.email ?? null,
      template_id: input.templateId,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (pErr) throw new Error(`Prospect: ${pErr.message}`);

  // 4) Site (draft, sans slug — nommé par le prospect au go-live).
  const { error: sErr } = await admin.from("sites").insert({
    id: siteId,
    template_id: input.templateId,
    status: "draft",
  });
  if (sErr) throw new Error(`Site: ${sErr.message}`);

  // 5) Contenu v1 (non publié tant que pas en ligne).
  const { error: cErr } = await admin.from("site_content").insert({
    site_id: siteId,
    version: 1,
    content_json: content,
    is_published: false,
    created_by: "operator",
  });
  if (cErr) throw new Error(`Contenu: ${cErr.message}`);

  // 6) Code + token de reveal.
  const token = randomUUID().replace(/-/g, "");
  const code = input.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const { error: codeErr } = await admin.from("prospect_codes").insert({
    prospect_id: prospect.id,
    code,
    token,
    site_id: siteId,
    status: "sent",
  });
  if (codeErr) throw new Error(`Code: ${codeErr.message}`);

  return { siteId, token, revealPath: `/r/${token}` };
}
