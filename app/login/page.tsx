"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthSplit } from "@/components/ui/auth-split";
import { AkyraMark } from "@/components/ui/Logo";

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
      logo={<AkyraMark size={28} tone="dark" />}
      homeHref="/"
      title="Connexion"
      subtitle="Entrez votre email, on vous envoie un code à 6 chiffres."
      quote="Votre site pro vous attend."
      quoteAuthor="Akyra"
      imageSrc="/landing/tpl-alice-r.png"
      onSubmitEmail={sendCode}
      onVerifyCode={verifyCode}
      initialError={initialError}
      background={
        <div className="absolute inset-0 bg-ink-900">
          <div className="glow-violet absolute inset-x-0 top-0 h-[440px] opacity-70" />
          <div className="absolute -bottom-20 right-[-10%] h-[420px] w-[420px] rounded-full bg-gold-400/10 blur-[130px]" />
          {/* Quadrillage façon landing */}
          <div className="absolute inset-0 flex justify-center">
            <div className="h-full w-full max-w-5xl border-l border-r border-white/[0.04]" />
          </div>
        </div>
      }
    />
  );
}
