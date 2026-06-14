"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";

type Status = "idle" | "done" | "error";

/**
 * Bouton de confirmation du changement d'adresse. La bascule effective n'a lieu
 * qu'au clic (POST) — pas au chargement de la page : un scanner de liens (Outlook
 * SafeLinks…) qui ouvre l'URL ne consomme donc pas le token.
 */
export function ConfirmEmailButton({ token, newEmail }: { token: string; newEmail: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (res.ok && data?.ok) {
        setStatus("done");
      } else {
        setError(data?.error ?? "Une erreur est survenue.");
        setStatus("error");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
      setStatus("error");
    }
    setLoading(false);
  };

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint-400/15 text-mint-400">
          <IconCheck size={24} />
        </div>
        <h1 className="mt-4 font-archivo text-xl font-semibold text-night">Adresse confirmée</h1>
        <p className="mt-2 text-sm text-slate">
          Vous vous connectez désormais avec <strong className="text-night">{newEmail}</strong>.
        </p>
        <div className="mt-6">
          <Button href="/dashboard" size="md" className="w-full">
            Aller à mon espace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="font-archivo text-xl font-semibold text-night">Confirmez votre adresse</h1>
      <p className="mt-2 text-sm text-slate">
        Activez <strong className="text-night">{newEmail}</strong> comme nouvelle adresse de
        connexion à votre compte Akyra.
      </p>
      <div className="mt-6">
        <Button onClick={confirm} loading={loading} disabled={loading} size="md" className="w-full">
          Confirmer mon adresse
        </Button>
      </div>
      {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
