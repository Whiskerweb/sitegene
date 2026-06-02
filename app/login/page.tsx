"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthSplit } from "@/components/ui/auth-split";
import { AkyraMark } from "@/components/ui/Logo";
import { CosmicParallaxBg } from "@/components/ui/parallax-cosmic-background";

export default function LoginPage() {
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

  async function sendMagicLink(email: string) {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { error: error.message };
  }

  return (
    <AuthSplit
      brandName="Akyra"
      logo={<AkyraMark size={28} />}
      homeHref="/"
      title="Connexion"
      subtitle="Entrez votre email, on vous envoie un lien sécurisé."
      quote="Votre site pro vous attend."
      quoteAuthor="Akyra"
      onSubmitEmail={sendMagicLink}
      initialError={initialError}
      background={
        <>
          <CosmicParallaxBg bgOnly />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1f3a5f]/20 via-transparent to-[#0e2138]/40" />
        </>
      }
    />
  );
}
