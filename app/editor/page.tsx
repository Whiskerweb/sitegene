import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance } from "@/lib/credits-server";
import { fetchTemplateManifest } from "@/lib/site-server";
import EditorClient, { type EditableField } from "./EditorClient";

export const dynamic = "force-dynamic";

/** Charge le site du propriétaire + le brouillon courant + le manifest, puis monte l'éditeur WYSIWYG. */
export default async function EditorPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: site } = await admin
    .from("sites")
    .select("id, slug, status, template_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!site || !site.template_id) redirect("/dashboard");

  const balance = await getBalance(admin, user.id);

  const { data: top } = await admin
    .from("site_content")
    .select("version, is_published, content_json")
    .eq("site_id", site.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const manifest = (await fetchTemplateManifest(appUrl, site.template_id)) as
    | { fields?: { editable?: { path: string; label?: string; type: string; maxLen?: number }[] } }
    | null;
  const editableFields: EditableField[] = (manifest?.fields?.editable ?? []).map((f) => ({
    path: f.path,
    label: f.label ?? f.path,
    type: f.type,
    maxLen: f.maxLen ?? null,
  }));

  return (
    <EditorClient
      siteId={site.id}
      slug={site.slug}
      balance={balance}
      hasUnpublished={top ? !top.is_published : false}
      editableFields={editableFields}
      content={(top?.content_json as Record<string, unknown>) ?? {}}
    />
  );
}
