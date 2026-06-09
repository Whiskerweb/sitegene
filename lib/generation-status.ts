import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** Vrai si une génération de site est en cours/à venir (job generate_site non terminé). */
export async function generationPending(admin: Admin, siteId: string): Promise<boolean> {
  const { data } = await admin
    .from("jobs")
    .select("id")
    .eq("site_id", siteId)
    .eq("type", "generate_site")
    .in("status", ["pending", "running"])
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}
