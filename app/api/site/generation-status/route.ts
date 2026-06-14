import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwnsSite } from "@/lib/onboarding";

/**
 * État de la génération de site (pour le polling du dashboard).
 * GET ?siteId= → { status: "pending"|"running"|"done"|"error"|"none", error? }.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("status, error")
    .eq("site_id", siteId)
    .eq("type", "generate_site")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ status: job?.status ?? "none", error: job?.error ?? null });
}
