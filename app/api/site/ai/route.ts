import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { proposeDesignEdit } from "@/lib/mistral";
import { sanitizeCss } from "@/lib/css-sanitize";

/**
 * Propose une modification de design (CSS) via Mistral, à partir d'une note
 * épinglée. NE SAUVEGARDE RIEN, NE DÉBITE AUCUN CRÉDIT (aperçu seulement).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const siteId = body?.siteId;
  const message = String(body?.message ?? "").trim();
  const target = body?.target ?? null;
  if (!siteId || !message) {
    return NextResponse.json({ error: "Demande requise." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
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
