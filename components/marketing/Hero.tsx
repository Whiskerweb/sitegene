"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import RotatingText from "@/components/ui/RotatingText";
import { createClient } from "@/lib/supabase/client";
import AuthGate from "@/components/auth/AuthGate";

const ROTATING = [
  "votre site en 30 secondes",
  "un vrai design d'agence",
  "aucune compétence requise",
  "modifiable à la voix",
  "votre adresse en ligne incluse",
  "déjà adopté par 2 400 créateurs",
];

export default function Hero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [gateOpen, setGateOpen] = useState(false);

  // Bulle → gate compte → onboarding gamifié. Si déjà connecté, on file droit.
  // Les photos se déposent à l'étape collect de /creer (drag & drop, compression) —
  // pas ici, où elles étaient perdues en route.
  async function submit() {
    const brief = prompt.trim();
    try {
      sessionStorage.setItem("akyra_brief", brief);
    } catch {
      /* sessionStorage indispo */
    }
    try {
      const { data } = await createClient().auth.getUser();
      if (data.user) {
        router.push("/creer");
        return;
      }
    } catch {
      /* pas de session → gate */
    }
    setGateOpen(true);
  }

  return (
    <section id="demo" className="relative w-full overflow-hidden pb-12 pt-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center">
        {/* Badge animé — [1.1] 100 % français mis en avant */}
        <span className="inline-flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-[rgb(var(--m-line))] bg-[rgb(var(--m-overlay)/0.04)] px-3.5 py-1.5 backdrop-blur-sm">
          <span className="text-[12px] font-semibold text-[rgb(var(--m-ink))]">
            🇫🇷 100 % français
          </span>
          <span className="h-3 w-px bg-[rgb(var(--m-overlay)/0.15)]" />
          <span className="text-[12px] font-semibold text-[rgb(var(--m-ink))]">À partir de 50 €/an</span>
          <span className="hidden h-3 w-px bg-[rgb(var(--m-overlay)/0.15)] sm:block" />
          <RotatingText
            messages={ROTATING}
            className="hidden text-[12px] font-medium text-[rgb(var(--m-accent))] sm:block"
          />
        </span>

        {/* Headline */}
        <h1 className="mt-8 text-[38px] font-medium leading-[1.05] tracking-[-0.04em] text-[rgb(var(--m-ink))] sm:text-[56px] md:text-[64px]">
          Votre site pro, déjà construit.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-[46ch] text-[17px] font-light leading-relaxed tracking-wide text-[rgb(var(--m-muted))] sm:text-[18px]">
          Quelques photos, une courte description, et votre site est prêt en 30 secondes.{" "}
          <a
            href="/modeles"
            className="whitespace-nowrap border-b border-[rgb(var(--m-overlay)/0.25)] pb-0.5 text-[rgb(var(--m-ink))] transition-colors hover:border-[rgb(var(--m-ink))]"
          >
            Voir un exemple.
          </a>
        </p>

        {/* Prompt box */}
        <form
          className="mt-12 flex w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-[rgb(var(--m-line))] bg-[rgb(var(--m-surface))] text-left shadow-[0_24px_70px_-24px_rgba(0,0,0,0.45)] transition-all duration-300 focus-within:border-[rgb(var(--m-overlay)/0.25)]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez votre activité en deux lignes : qui vous êtes, ce que vous proposez…"
            spellCheck={false}
            className="akyra-scroll min-h-[90px] w-full resize-none bg-transparent px-5 py-4 text-[15px] font-normal leading-relaxed tracking-wide text-[rgb(var(--m-ink))] outline-none placeholder:text-[rgb(var(--m-faint))]"
          />

          <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--m-line))] px-3 py-2">
            <span className="px-1 text-[12px] font-medium text-[rgb(var(--m-faint))]">
              Vos photos et vos liens viendront juste après.
            </span>

            <button
              type="submit"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[rgb(var(--m-ink))] px-3.5 text-[13px] font-bold text-[rgb(var(--m-page))] transition-opacity hover:opacity-90"
            >
              <Sparkles size={14} />
              Générer
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        <p className="mt-5 text-[12.5px] text-[rgb(var(--m-faint))]">
          Aucune compétence requise · déjà adopté par plus de{" "}
          <span className="font-semibold text-[rgb(var(--m-muted))]">2 400 créateurs</span>.
        </p>

        {/* [1.1] Arguments Made in France */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {[
            "🇫🇷 Conçu et développé en France",
            "Vos données hébergées en Europe (RGPD)",
            "Support en français, par des humains",
            "Aucune compétence technique requise",
          ].map((t) => (
            <span
              key={t}
              className="flex items-center gap-2 text-[12.5px] font-medium text-[rgb(var(--m-muted))]"
            >
              <span className="h-1 w-1 rounded-full bg-[rgb(var(--m-accent))]" aria-hidden />
              {t}
            </span>
          ))}
        </div>
      </div>

      <AuthGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        brief={prompt.trim()}
        redirectTo="/creer"
        onAuthed={() => router.push("/creer")}
      />
    </section>
  );
}
