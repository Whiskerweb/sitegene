import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits-server";
import { spinReward, WHEEL_SEGMENTS } from "@/lib/wheel";

/**
 * Tire la roue de bienvenue. AUTORITÉ SERVEUR : le gain est décidé ici, le
 * client ne fait qu'animer jusqu'au résultat.
 *
 * Anti-rejeu : claim ATOMIQUE de profiles.wheel_spun_at
 * (update ... where wheel_spun_at is null) — seul le tout premier appel
 * remporte le claim et crédite. Un crash après le claim relâche le verrou.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = createAdminClient();

  // Claim atomique : passe wheel_spun_at de null → now pour CE compte seulement.
  const { data: claimed, error: claimErr } = await admin
    .from("profiles")
    .update({ wheel_spun_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("wheel_spun_at", null)
    .select("id")
    .maybeSingle();

  // Vraie erreur DB (typiquement : migration 0024_wheel.sql non appliquée →
  // colonne wheel_spun_at absente). On le signale clairement, ce n'est PAS un
  // « déjà tourné ».
  if (claimErr) {
    return NextResponse.json(
      { error: "Roue indisponible (migration wheel non appliquée ?)." },
      { status: 500 },
    );
  }

  if (!claimed) {
    return NextResponse.json(
      { error: "Roue déjà utilisée.", alreadySpun: true },
      { status: 409 },
    );
  }

  const reward = spinReward();
  let balance: number;
  try {
    // Réutilise la raison "signup_grant" (libellé « Crédits offerts ») : c'est
    // bien le don de bienvenue, juste révélé via la roue.
    balance = await grantCredits(admin, user.id, reward, "signup_grant", {});
  } catch {
    // Échec du crédit après le claim → on relâche le verrou pour réessai.
    await admin.from("profiles").update({ wheel_spun_at: null }).eq("id", user.id);
    return NextResponse.json({ error: "Échec du crédit, réessayez." }, { status: 500 });
  }

  return NextResponse.json({ reward, balance, segments: WHEEL_SEGMENTS });
}
