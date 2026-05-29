import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  is_operator: boolean;
};

/** Utilisateur authentifié courant (ou null). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Profil courant (jointure auth.users → profiles). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_operator")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? null,
    is_operator: Boolean(profile?.is_operator),
  };
}

/** Garde : exige un utilisateur connecté, sinon redirige vers /login. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Garde : exige un opérateur, sinon redirige. */
export async function requireOperator(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!profile.is_operator) redirect("/login?error=not-operator");
  return profile;
}
