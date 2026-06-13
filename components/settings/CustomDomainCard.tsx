"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconSpark, IconCheck } from "@/components/ui/icons";

/**
 * Carte « Domaine personnalisé ». Le branchement d'un domaine est réservé aux
 * abonnés « tout compris » — pour les non-abonnés, c'est un mur d'upgrade
 * (intention maximale : le client VEUT son adresse pro).
 */
export function CustomDomainCard({
  isSubscribed,
  currentDomain,
}: {
  isSubscribed: boolean;
  currentDomain: string | null;
}) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [saved, setSaved] = useState<string | null>(currentDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Non-abonné → mur d'upgrade vers l'offre Pro.
  if (!isSubscribed) {
    return (
      <Card className="relative overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-archivo text-base font-semibold text-night">
            Domaine personnalisé
          </h2>
          <Badge tone="brand">Pro</Badge>
        </div>
        <p className="mt-1 text-sm text-slate">
          Branchez votre propre nom de domaine (ex : votre-studio.com) au lieu de{" "}
          <code className="text-night">vous.akyra.io</code>. Inclus dans l'abonnement,
          avec le retrait du badge Akyra et toute la boutique offerte.
        </p>
        <div className="mt-5">
          <Button href="/dashboard/credits" size="sm">
            <IconSpark size={16} /> Passer à l'abonnement
          </Button>
        </div>
      </Card>
    );
  }

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; custom_domain?: string | null; error?: string }
        | null;
      if (res.ok && data?.ok) {
        setSaved(data.custom_domain ?? null);
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
      <div className="flex items-center justify-between">
        <h2 className="font-archivo text-base font-semibold text-night">
          Domaine personnalisé
        </h2>
        {saved ? (
          <Badge tone="success">
            <IconCheck size={13} /> Branché
          </Badge>
        ) : (
          <Badge tone="brand">Pro</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-slate">
        Branchez votre propre nom de domaine. Pointez ensuite un enregistrement
        CNAME vers <code className="text-night">akyra.io</code> chez votre registrar.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="votre-studio.com"
          className="w-full rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 text-sm text-night outline-none focus:border-brand"
        />
        <Button onClick={save} loading={loading} size="sm" className="shrink-0">
          {saved ? "Mettre à jour" : "Brancher"}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      {saved && !error && (
        <p className="mt-2 text-[13px] text-mist">
          Actif sur <code className="text-night">{saved}</code> — laissez le DNS
          se propager (jusqu'à quelques heures).
        </p>
      )}
    </Card>
  );
}
