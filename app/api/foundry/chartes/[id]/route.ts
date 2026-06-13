import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanCharteName, normalizeCharteSpec } from "@/lib/foundry/user-chartes";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Met à jour une charte personnelle EXISTANTE (nom et/ou spec). Appelé quand
 * l'utilisateur modifie SA propre charte enregistrée puis enregistre : on met à
 * jour en place (pas de doublon). Propriété vérifiée.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("user_chartes")
    .select("id, name, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Charte introuvable." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const nextName = cleanCharteName(body?.name) || (existing.name as string);
  if (typeof body?.name === "string") patch.name = nextName;
  if (body?.spec && typeof body.spec === "object") {
    patch.spec = normalizeCharteSpec({ ...body.spec, name: nextName });
  }

  const { data, error } = await admin
    .from("user_chartes")
    .update(patch)
    .eq("id", id)
    .select("id, name, spec")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
  return NextResponse.json({ charte: { id: data.id, name: data.name, spec: data.spec } });
}

/** Supprime une charte personnelle (propriété vérifiée). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("user_chartes")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Charte introuvable." }, { status: 404 });
  }
  await admin.from("user_chartes").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
