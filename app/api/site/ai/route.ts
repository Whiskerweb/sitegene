import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { proposeComponentIntegration, proposeDesignEdit } from "@/lib/mistral";
import { sanitizeCss } from "@/lib/css-sanitize";
import { getEffect } from "@/lib/effects";
import { sanitizeEffectConfig, type AppliedComponent } from "@/lib/effects/render";
import { ownsItem } from "@/lib/marketplace-server";
import { absolutizeContentAssets } from "@/lib/site-server";
import { isSpaTemplate } from "@/lib/templates";

/**
 * Propose une modification via Mistral. Deux modes — AUCUNE persistance,
 * AUCUN débit (aperçu seulement) :
 *  - design (CSS) : comportement historique ;
 *  - composant (body.effectId) : intégration d'un effet ACHETÉ dans la section
 *    sélectionnée → renvoie un componentDraft {effectId, selector, position,
 *    config} que l'éditeur prévisualise via /api/preview?previewComponent=…
 *    et persiste au commit (gratuit, l'effet est déjà payé).
 */

const IMAGE_URL_RE = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i;

/** Toutes les URLs d'images du contenu (photos client + visuels du template). */
function collectImageUrls(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") {
    const isImg =
      (/^https?:\/\//i.test(node) || node.startsWith("/_templates/")) &&
      (IMAGE_URL_RE.test(node) || node.includes("/storage/v1/object/"));
    if (isImg && !out.includes(node)) out.push(node);
  } else if (Array.isArray(node)) {
    for (const v of node) collectImageUrls(v, out);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) collectImageUrls(v, out);
  }
  return out;
}

/** Extraits de textes réels du site (pour que l'IA reprenne le ton du client). */
function collectTextSnippets(node: unknown, out: string[] = []): string[] {
  if (out.length >= 36) return out;
  if (typeof node === "string") {
    const s = node.trim();
    if (
      s.length >= 3 &&
      s.length <= 180 &&
      !/^https?:\/\//i.test(s) &&
      !s.startsWith("/") &&
      !s.startsWith("#") &&
      !IMAGE_URL_RE.test(s) &&
      !out.includes(s)
    ) {
      out.push(s);
    }
  } else if (Array.isArray(node)) {
    for (const v of node) collectTextSnippets(v, out);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("__")) continue; // clés réservées (css, effets…)
      collectTextSnippets(v, out);
    }
  }
  return out;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  const message = String(body?.message ?? "").trim();
  const target = body?.target ?? null;
  const effectId = typeof body?.effectId === "string" ? body.effectId : "";
  if (!siteId || !message) {
    return NextResponse.json({ error: "Demande requise." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  const { data: top } = await admin
    .from("site_content")
    .select("content_json")
    .eq("site_id", siteId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cur = (top?.content_json as Record<string, unknown>) ?? {};
  const currentCss = typeof cur.__css === "string" ? (cur.__css as string) : "";

  // ---- Mode composant (effet acheté) ----------------------------------
  if (effectId) {
    const effect = getEffect(effectId);
    if (!effect) {
      return NextResponse.json({ error: "Effet inconnu." }, { status: 400 });
    }
    if (!(await ownsItem(admin, user.id, "effect", effectId))) {
      return NextResponse.json({ error: "Effet non débloqué." }, { status: 403 });
    }
    if (site.template_id && isSpaTemplate(site.template_id) && !effect.spaCompatible) {
      return NextResponse.json({
        ok: false,
        action: "unsupported",
        reason: "Cet effet n'est pas encore disponible sur votre template.",
      });
    }
    const selector = typeof target?.cssSelector === "string" ? target.cssSelector : "";
    if (effect.kind === "component" && !selector) {
      return NextResponse.json(
        { error: "Sélectionnez d'abord la section où intégrer le composant." },
        { status: 400 },
      );
    }

    const absContent = site.template_id
      ? absolutizeContentAssets(cur, site.template_id)
      : cur;

    let proposal;
    try {
      proposal = await proposeComponentIntegration({
        request: message,
        target,
        effect: {
          id: effect.id,
          name: effect.name,
          description: effect.description,
          aiGuide: effect.aiGuide,
          defaultPosition: effect.defaultPosition,
          configSchema: effect.configSchema,
        },
        currentCss,
        sitePhotoUrls: collectImageUrls(absContent),
        siteTextSnippets: collectTextSnippets(absContent),
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur IA." },
        { status: 502 },
      );
    }

    if (proposal.action !== "component") {
      return NextResponse.json({ ok: false, action: "unsupported", reason: proposal.reason });
    }

    const componentDraft: AppliedComponent = {
      effectId: effect.id,
      selector: effect.kind === "component" ? selector : "",
      position: proposal.position,
      config: sanitizeEffectConfig(effect, proposal.config),
    };
    return NextResponse.json({
      ok: true,
      action: "component",
      componentDraft,
      explanation: proposal.explanation,
    });
  }

  // ---- Mode design (CSS) — comportement historique ---------------------
  let proposal;
  try {
    proposal = await proposeDesignEdit({ request: message, target, currentCss });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur IA." },
      { status: 502 },
    );
  }

  if (proposal.action !== "css") {
    return NextResponse.json({ ok: false, action: "unsupported", reason: proposal.reason });
  }
  const clean = sanitizeCss(proposal.css);
  if (!clean.ok) {
    return NextResponse.json({
      ok: false,
      action: "unsupported",
      reason: "L'IA a produit un CSS non valide — réessayez.",
    });
  }
  return NextResponse.json({
    ok: true,
    action: "css",
    css: clean.css,
    explanation: proposal.explanation,
  });
}
