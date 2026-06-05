import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { primarySiteForUser } from "@/lib/primary-site";
import { getBalance } from "@/lib/credits-server";
import { fetchTemplateManifest } from "@/lib/site-server";
import { ownedEffectModules } from "@/lib/marketplace-server";
import { listAiMessages } from "@/lib/ai-history";
import { loadEditableSnapshot } from "@/lib/site-content-store";
import { isSpaTemplate } from "@/lib/templates";
import EditorClient, { type EditableField, type OwnedEffect } from "./EditorClient";

export const dynamic = "force-dynamic";

/** Charge le site du propriétaire + le brouillon courant + le manifest, puis monte l'éditeur WYSIWYG. */
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Site PRINCIPAL (live/payé d'abord) — jamais un brouillon plus récent qui
  // masquerait le site débloqué et renverrait à tort vers le paywall d'essai.
  const site = await primarySiteForUser<{
    id: string;
    slug: string | null;
    status: string;
    template_id: string | null;
    billing_status: string | null;
  }>(admin, user.id, "id, slug, template_id");
  if (!site || !site.template_id) redirect("/dashboard");

  // Garde-fou paywall (1 site / N peaux) : bloquer si le site n'est ni en ligne
  // ni débloqué. Changer de peau ne change pas l'état de facturation du site.
  const LOCKED = new Set(["none", "canceled", "payment_failed"]);
  const siteUnlocked = site.status === "live" || !LOCKED.has((site.billing_status as string) ?? "none");
  if (!siteUnlocked) redirect("/dashboard?paywall=1");

  const balance = await getBalance(admin, user.id);

  // Fil de chat persistant de l'éditeur (50 derniers messages).
  const history = await listAiMessages(admin, site.id, 50);

  // Contenu de la PEAU en cours d'édition (snapshot de site.template_id).
  const top = await loadEditableSnapshot(admin, site.id, site.template_id ?? "");

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

  // Effets POSSÉDÉS (boutique Formules) → popover « composants » du chat IA.
  const spaSite = isSpaTemplate(site.template_id);
  const ownedEffects: OwnedEffect[] = (await ownedEffectModules(admin, user.id)).map((e) => ({
    id: e.id,
    name: e.name,
    accentFrom: e.accent.from,
    accentTo: e.accent.to,
    compatible: !spaSite || e.spaCompatible,
  }));

  // /editor?integrate=<effectId> (depuis la page Formules) : démarre en mode
  // Sélectionner avec le bandeau d'intégration. Validé : effet possédé + compatible.
  const sp = await searchParams;
  const integrateRaw = typeof sp.integrate === "string" ? sp.integrate : "";
  const integrateEffectId =
    ownedEffects.find((e) => e.id === integrateRaw && e.compatible)?.id ?? null;

  return (
    <EditorClient
      siteId={site.id}
      slug={site.slug}
      balance={balance}
      hasUnpublished={top ? !top.is_published : false}
      editableFields={editableFields}
      content={(top?.content_json as Record<string, unknown>) ?? {}}
      ownedEffects={ownedEffects}
      integrateEffectId={integrateEffectId}
      initialMessages={history}
    />
  );
}
