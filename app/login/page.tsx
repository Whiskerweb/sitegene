"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthComponent } from "@/components/ui/sign-up";
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
    <AuthComponent
      brandName="Akyra"
      logo={<AkyraMark size={28} />}
      homeHref="/"
      onSubmitEmail={sendMagicLink}
      initialError={initialError}
      title="Connexion"
      subtitle="Entrez votre email, on vous envoie un lien sécurisé."
      background={
        <>
          <CosmicParallaxBg bgOnly />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1f3a5f]/20 via-transparent to-[#0e2138]/40" />
        </>
      }
      rootStyle={
        {
          // Texte blanc, lisible sur le ciel étoilé sombre.
          // Tailwind v4 : les classes text-foreground/bg-card lisent --color-*.
          "--color-background": "#0e2138",
          "--color-foreground": "#ffffff",
          "--color-muted-foreground": "#ffffff",
          "--color-card": "transparent",
          // L'effet verre de l'input lit ces variables sans préfixe.
          "--foreground": "#ffffff",
          "--background": "#0e2138",
        } as CSSProperties
      }
    />
  );
}
