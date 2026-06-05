import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Retourne l'ID du site de l'utilisateur pour un template donné. */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const templateId = new URL(request.url).searchParams.get("templateId") ?? "";
  if (!templateId) return NextResponse.json({ error: "templateId requis." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("sites")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("template_id", templateId)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ siteId: data?.id ?? null });
}
