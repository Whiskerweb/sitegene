"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AkyraMark } from "@/components/ui/Logo";

/**
 * Popup paywall (DA glass landing) : ouvert par toute action verrouillée tant
 * que le site n'est ni en essai ni payé. Un seul CTA : démarrer l'essai 3 jours
 * (form POST → Stripe Checkout setup). Prix transparent, ton doux.
 */
export default function PaywallModal({
  siteId,
  firstName,
  defaultOpen = false,
  trigger,
}: {
  siteId: string;
  firstName?: string | null;
  defaultOpen?: boolean;
  /** Élément cliquable qui ouvre le popup (bouton « Publier », « Modifier »…). */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Fermeture au clavier (Escape) quand le popup est ouvert.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="contents cursor-pointer">
          {trigger}
        </span>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Essayer Akyra gratuitement"
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="liquid-glass relative w-full max-w-md rounded-3xl border border-sky-300 bg-white/80 p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-mist hover:text-night"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
            <AkyraMark size={40} className="mx-auto" />
            <h2 className="mt-4 font-archivo text-2xl font-semibold text-night">
              {firstName ? `${firstName}, votre site est prêt.` : "Votre site est prêt."}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate">
              Essayez Akyra gratuitement pendant 3 jours : publiez votre site
              maintenant et modifiez-le librement. 50 € après l'essai —
              annulable à tout moment, en un clic.
            </p>
            <form method="post" action="/api/trial/start" className="mt-6">
              <input type="hidden" name="siteId" value={siteId} />
              <button
                type="submit"
                className="w-full rounded-full bg-brand py-3.5 font-bold text-white transition hover:opacity-90"
              >
                Essayer gratuitement 3 jours
              </button>
            </form>
            <button
              type="button"
              className="mt-3 text-sm text-mist hover:text-night"
              onClick={() => setOpen(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
