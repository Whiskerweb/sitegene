import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBalance, grantCredits } from "@/lib/credits-server";
import { hasActiveSubscription } from "@/lib/subscription";
import { sanitizeCss } from "@/lib/css-sanitize";
import { getEffect } from "@/lib/effects";
import {
  appliedComponents,
  sanitizeEffectConfig,
  type AppliedComponent,
} from "@/lib/effects/render";
import { ownsItem } from "@/lib/marketplace-server";
import { logAiMessage } from "@/lib/ai-history";

const COST = 1;

/**
 * Le client valide la proposition de l'IA. Deux modes :
 *  - CSS (body.css) : nouvelle version avec __css, débite 1 crédit (ai_edit) —
 *    comportement historique, abonnés exemptés ;
 *  - composant (body.component) : persiste le componentDraft d'un effet ACHETÉ
 *    dans __components/__effects — GRATUIT (l'intégration est incluse dans le
 *    prix de l'effet). Re-validation serveur complète dans les deux cas.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  if (!siteId) return NextResponse.json({ error: "siteId requis." }, { status: 400 });

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id, status, template_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  // ---- Mode composant (effet acheté, commit gratuit) -------------------
  if (body?.component && typeof body.component === "object") {
    const draft = body.component as Partial<AppliedComponent>;
    const effect = typeof draft.effectId === "string" ? getEffect(draft.effectId) : undefined;
    if (!effect) {
      return NextResponse.json({ error: "Effet inconnu." }, { status: 400 });
    }
    if (!(await ownsItem(admin, user.id, "effect", effect.id))) {
      return NextResponse.json({ error: "Effet non débloqué." }, { status: 403 });
    }
    const selector = typeof draft.selector === "string" ? draft.selector : "";
    if (effect.kind === "component" && !selector) {
      return NextResponse.json({ error: "Section cible manquante." }, { status: 400 });
    }
    const sane: AppliedComponent = {
      effectId: effect.id,
      selector,
      position: (["replace", "before", "after", "inside"] as const).includes(
        draft.position as never,
      )
        ? (draft.position as AppliedComponent["position"])
        : (effect.defaultPosition ?? "replace"),
      config: sanitizeEffectConfig(effect, draft.config),
    };

    const { data: top } = await admin
      .from("site_content")
      .select("version, content_json")
      .eq("site_id", siteId)
      .eq("template_id", site.template_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const base = structuredClone((top?.content_json as Record<string, unknown>) ?? {});
    if (effect.kind === "global") {
      const effects = Array.isArray(base.__effects) ? [...(base.__effects as unknown[])] : [];
      base.__effects = [
        ...effects.filter((e) =>
          typeof e === "string" ? e !== effect.id : (e as { id?: string })?.id !== effect.id,
        ),
        { id: effect.id, config: sane.config },
      ];
    } else {
      // dédupe : un même effet sur la même section remplace l'existant
      const rest = appliedComponents(base).filter(
        (c) => !(c.effectId === sane.effectId && c.selector === sane.selector),
      );
      base.__components = [...rest, sane];
    }

    const version = (top?.version ?? 0) + 1;
    const { error } = await admin.from("site_content").insert({
      site_id: siteId,
      template_id: site.template_id,
      version,
      content_json: base,
      is_published: site.status === "live",
      created_by: "ai",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const balance = await getBalance(admin, user.id);
    await logAiMessage(admin, siteId, user.id, "assistant", "commit", { action: "component" });
    return NextResponse.json({
      ok: true,
      version,
      balance,
      free: true,
      published: site.status === "live",
    });
  }

  // ---- Mode CSS — comportement historique (1 crédit, abonnés exemptés) --
  const clean = sanitizeCss(body?.css);
  if (!clean.ok) return NextResponse.json({ error: clean.reason }, { status: 400 });

  // Abonné « tout illimité » : aucune vérif de solde ni débit.
  const unlimited = await hasActiveSubscription(admin, user.id);
  if (!unlimited) {
    const balance = await getBalance(admin, user.id);
    if (balance < COST) {
      return NextResponse.json(
        { error: "Solde insuffisant. Achetez des crédits ou passez à l'illimité pour valider." },
        { status: 409 },
      );
    }
  }

  const { data: top } = await admin
    .from("site_content")
    .select("version, content_json")
    .eq("site_id", siteId)
    .eq("template_id", site.template_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = structuredClone((top?.content_json as Record<string, unknown>) ?? {});
  base.__css = clean.css;
  const version = (top?.version ?? 0) + 1;

  const { error } = await admin.from("site_content").insert({
    site_id: siteId,
    template_id: site.template_id,
    version,
    content_json: base,
    is_published: site.status === "live",
    created_by: "ai",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const newBalance = unlimited
    ? await getBalance(admin, user.id)
    : await grantCredits(admin, user.id, -COST, "ai_edit", {});
  await logAiMessage(admin, siteId, user.id, "assistant", "commit", { action: "css" });
  return NextResponse.json({
    ok: true,
    version,
    balance: newBalance,
    unlimited,
    published: site.status === "live",
  });
}
