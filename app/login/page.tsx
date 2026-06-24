"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthSplit } from "@/components/ui/auth-split";

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/dashboard");
  const [initialError, setInitialError] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get("next") ?? "/dashboard");
    if (params.get("error") === "not-operator") {
      setInitialError("Ce compte n'a pas accès à l'espace opérateur.");
    } else if (params.get("error")) {
      setInitialError("Lien invalide ou expiré. Réessayez.");
    }
  }, []);

  // Étape 1 : envoyer un code à 6 chiffres (pas de lien, donc pas de redirect).
  async function sendCode(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { error: error.message };
  }

  // Étape 2 : vérifier le code → ouvre la session côté client, puis redirige.
  async function verifyCode(email: string, code: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) return { error: error.message };
    router.push(next);
    router.refresh();
  }

  return (
    <AuthSplit
      brandName="Akyra"
      homeHref="/"
      title="Connexion"
      subtitle="Entrez votre email, on vous envoie un code à 6 chiffres."
      onSubmitEmail={sendCode}
      onVerifyCode={verifyCode}
      initialError={initialError}
    />
  );
}
