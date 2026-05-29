import { createClient } from '@supabase/supabase-js'

/**
 * Client admin Supabase — service_role, bypass RLS. SERVEUR UNIQUEMENT.
 * Ne JAMAIS importer dans un composant client. Utilisé pour : créer des users,
 * grant de crédits, publication de sites, opérations opérateur.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquant — requis pour les opérations serveur admin.',
    )
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
