import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { userOwnsSite } from "@/lib/onboarding";
import { buildStateForSite } from "@/lib/onboarding-sections";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get("siteId") ?? "";
  if (!siteId || !(await userOwnsSite(user.id, siteId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  return NextResponse.json(await buildStateForSite(siteId), { headers: { "cache-control": "no-store" } });
}
