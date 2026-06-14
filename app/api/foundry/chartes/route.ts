import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cleanCharteName,
  countUserChartes,
  listUserChartes,
  normalizeCharteSpec,
  MAX_USER_CHARTES,
} from "@/lib/foundry/user-chartes";

/** Liste les chartes personnelles de l'utilisateur (compte). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const admin = createAdminClient();
  const chartes = await listUserChartes(admin, user.id);
  return NextResponse.json({ chartes });
}

/**
 * Crée une nouvelle charte personnelle (nom + spec). Appelé quand l'utilisateur
 * « enregistre » une charte de base modifiée (ou importée/composée). La spec est
 * normalisée serveur (repairCharte). Renvoie la charte créée (id inclus).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = cleanCharteName(body?.name);
  if (!name) return NextResponse.json({ error: "Donnez un nom à votre charte." }, { status: 400 });
  if (!body?.spec || typeof body.spec !== "object") {
    return NextResponse.json({ error: "Charte invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  if ((await countUserChartes(admin, user.id)) >= MAX_USER_CHARTES) {
    return NextResponse.json(
      { error: `Vous avez atteint la limite de ${MAX_USER_CHARTES} chartes enregistrées.` },
      { status: 409 },
    );
  }

  const spec = normalizeCharteSpec({ ...body.spec, name });
  const { data, error } = await admin
    .from("user_chartes")
    .insert({ user_id: user.id, name, spec })
    .select("id, name, spec")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
  return NextResponse.json({ charte: { id: data.id, name: data.name, spec: data.spec } });
}
