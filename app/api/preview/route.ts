import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSiteHtml,
  fetchDefaultContent,
  fetchTemplateManifest,
} from "@/lib/site-server";
import { contentForTemplate, metaForTemplate } from "@/lib/site-content";
import { injectEditChrome, type EditableFieldSpec } from "@/lib/edit-runtime";
import { getEffect } from "@/lib/effects";
import {
  appliedComponents,
  sanitizeEffectConfig,
  type AppliedComponent,
} from "@/lib/effects/render";
import { ownsItem } from "@/lib/marketplace-server";
import { isTemplateId } from "@/lib/templates";
import { loadEditableSnapshot } from "@/lib/site-content-store";

/**
 * Aperçu authentifié du site du propriétaire (brouillon inclus). Avec ?edit=1,
 * injecte le runtime d'édition WYSIWYG. Servi en iframe same-origin depuis /editor.
 * ?previewComponent=<json> : aperçu ÉPHÉMÈRE d'un effet acheté (componentDraft
 * de /api/site/ai), mergé au rendu sans rien écrire en base — « Annuler » dans
 * l'éditeur se résume à recharger sans le paramètre.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Non connecté.", { status: 401 });

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId") ?? "";
  const edit = url.searchParams.get("edit") === "1";
  const origin = url.origin;

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, template_id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return new Response("Site non autorisé.", { status: 403 });
  }
  if (!site.template_id) return new Response("Template inconnu.", { status: 400 });

  // ?templateId= permet de prévisualiser une AUTRE peau (galerie biblio) ;
  // par défaut, la peau en cours d'édition.
  const previewTpl = url.searchParams.get("templateId");
  const renderTpl = previewTpl && isTemplateId(previewTpl) ? previewTpl : site.template_id;

  // Snapshot de la peau à rendre (brouillon le plus récent), sinon défaut.
  const sc = await loadEditableSnapshot(admin, site.id, renderTpl);
  const raw = sc?.content_json ?? (await fetchDefaultContent(origin, renderTpl));
  // ?path= permet à l'éditeur de prévisualiser une page précise (multi-pages).
  const pagePath = url.searchParams.get("path") || "/";
  // Contenu par lignée : v2 (SPA) ou PLAT (HTML clone-site).
  let content = contentForTemplate(raw, renderTpl);

  // Aperçu éphémère d'un composant (effet) avant commit : re-validation
  // complète (effet connu + possédé + config sanitizée), merge non persisté.
  const previewComponentRaw = url.searchParams.get("previewComponent");
  if (previewComponentRaw && content && typeof content === "object") {
    try {
      const draft = JSON.parse(previewComponentRaw) as Partial<AppliedComponent>;
      const effect = typeof draft?.effectId === "string" ? getEffect(draft.effectId) : undefined;
      if (effect && (await ownsItem(admin, user.id, "effect", effect.id))) {
        const clone = structuredClone(content) as Record<string, unknown>;
        const sane: AppliedComponent = {
          effectId: effect.id,
          selector: typeof draft.selector === "string" ? draft.selector : "",
          position: (["replace", "before", "after", "inside"] as const).includes(
            draft.position as never,
          )
            ? (draft.position as AppliedComponent["position"])
            : (effect.defaultPosition ?? "replace"),
          config: sanitizeEffectConfig(effect, draft.config),
        };
        if (effect.kind === "global") {
          const effects = Array.isArray(clone.__effects) ? [...(clone.__effects as unknown[])] : [];
          clone.__effects = [
            ...effects.filter((e) =>
              typeof e === "string" ? e !== effect.id : (e as { id?: string })?.id !== effect.id,
            ),
            { id: effect.id, config: sane.config },
          ];
        } else if (sane.selector) {
          const rest = appliedComponents(clone).filter(
            (c) => !(c.effectId === sane.effectId && c.selector === sane.selector),
          );
          clone.__components = [...rest, sane];
        }
        content = clone as typeof content;
      }
    } catch {
      // paramètre illisible → aperçu sans composant (dégradation silencieuse)
    }
  }

  let html = await buildSiteHtml(
    origin,
    renderTpl,
    content,
    metaForTemplate(content, renderTpl, pagePath),
    { pagePath }, // pas de basePath : liens inter-pages inertes dans l'éditeur
  );
  if (!html) return new Response("Template indisponible.", { status: 500 });

  if (edit) {
    const manifest = (await fetchTemplateManifest(origin, renderTpl)) as
      | { fields?: { editable?: EditableFieldSpec[] } }
      | null;
    const editableFields = (manifest?.fields?.editable ?? []).map((f) => ({
      path: f.path,
      type: f.type,
      maxLen: f.maxLen,
    }));
    html = injectEditChrome(html, { editableFields });
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
