"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Variant = "primary" | "ghost" | "subtle" | "danger";

/**
 * Bouton qui appelle une route de facturation (POST → { url }) puis redirige
 * vers Stripe. Partagé par l'abonnement, le top-up et le portail.
 */
export function CheckoutButton({
  endpoint,
  payload,
  children,
  variant = "primary",
  size,
  className = "",
}: {
  endpoint: string;
  payload?: Record<string, unknown>;
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return; // on garde l'état loading pendant la redirection
      }
      setError(data?.error ?? "Une erreur est survenue.");
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setLoading(false);
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Button onClick={go} loading={loading} variant={variant} size={size} className={className}>
        {children}
      </Button>
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </span>
  );
}
