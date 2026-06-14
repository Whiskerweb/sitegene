"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Carte « Adresse email » : change l'email de connexion du compte.
 * On n'effectue rien tout de suite — un lien de confirmation est envoyé à la
 * nouvelle adresse, et la bascule a lieu après le clic (anti-usurpation).
 */
export function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const trimmed = value.trim().toLowerCase();
  const canSave =
    !loading && EMAIL_RE.test(trimmed) && trimmed !== currentEmail.toLowerCase();

  const save = async () => {
    setLoading(true);
    setError(null);
    setSentTo(null);
    try {
      const res = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; email?: string; error?: string }
        | null;
      if (res.ok && data?.ok && data.email) {
        setSentTo(data.email);
        setValue("");
      } else {
        setError(data?.error ?? "Une erreur est survenue.");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setLoading(false);
  };

  return (
    <Card className="p-6">
      <h2 className="font-archivo text-base font-semibold text-night">Adresse email</h2>
      <p className="mt-1 text-sm text-slate">
        L'email de connexion à votre compte :{" "}
        <code className="text-night">{currentEmail}</code>
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 focus-within:border-brand">
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
            autoComplete="email"
            placeholder="nouvelle@adresse.fr"
            className="w-full bg-transparent text-sm text-night outline-none disabled:opacity-60"
          />
        </div>
        <Button onClick={save} loading={loading} disabled={!canSave} size="sm" className="shrink-0">
          Changer l'email
        </Button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

      {sentTo && !error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-mint-400/30 bg-mint-400/5 px-3.5 py-3 text-[13px] text-night">
          <span className="mt-0.5 text-mint-400">
            <IconCheck size={15} />
          </span>
          <span>
            Lien de confirmation envoyé à <strong>{sentTo}</strong>. Ouvrez-le pour activer cette
            adresse — votre email actuel reste valable tant que ce n'est pas confirmé.
          </span>
        </div>
      )}

      {!sentTo && (
        <p className="mt-3 text-[13px] text-mist">
          Nous enverrons un lien de confirmation à la nouvelle adresse. Le changement ne prend
          effet qu'après ce clic.
        </p>
      )}
    </Card>
  );
}
