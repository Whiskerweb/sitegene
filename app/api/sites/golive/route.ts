import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generationPending } from "@/lib/generation-status";
import { isValidSlug, normalizeSlug } from "@/lib/templates";

/** Nomme le site et le met en ligne (publie le contenu, statut live). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { token, slug: rawSlug } = await request.json();
  const slug = normalizeSlug(String(rawSlug ?? ""));
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Nom invalide (2–40 caractères, lettres/chiffres)." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("prospect_codes")
    .select("site_id")
    .eq("token", String(token ?? ""))
    .maybeSingle();
  if (!code?.site_id) {
    return NextResponse.json({ error: "Site introuvable." }, { status: 400 });
  }

  // Génération en cours : ne JAMAIS publier un site partiel.
  if (await generationPending(admin, code.site_id)) {
    return NextResponse.json(
      { error: "Votre site est encore en construction. Réessayez dans un instant." },
      { status: 409 },
    );
  }

  // Unicité du slug.
  const { data: clash } = await admin
    .from("sites")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash && clash.id !== code.site_id) {
    return NextResponse.json({ error: "Ce nom est déjà pris." }, { status: 409 });
  }

  // Publie la dernière version de contenu.
  const { data: sc } = await admin
    .from("site_content")
    .select("id")
    .eq("site_id", code.site_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sc) {
    await admin.from("site_content").update({ is_published: true }).eq("id", sc.id);
  }

  await admin
    .from("sites")
    .update({
      slug,
      status: "live",
      published_at: new Date().toISOString(),
      owner_user_id: user.id,
    })
    .eq("id", code.site_id);

  return NextResponse.json({ slug });
}
