import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase anonyme sans session (lecture publique). Utilisé par le
 * serveur de sites pour lire les sites `live` via les policies RLS publiques.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
