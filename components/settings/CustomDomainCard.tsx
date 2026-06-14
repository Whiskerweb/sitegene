"use client";

import { useState, useEffect, useCallback } from "react";
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

  return <CustomDomainBody currentDomain={currentDomain} />;
}

function CustomDomainBody({ currentDomain }: { currentDomain: string | null }) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [saved, setSaved] = useState<string | null>(currentDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    configured: boolean;
    verified: boolean;
    misconfigured: boolean;
    records: { type: string; name: string; value: string }[];
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/site/custom-domain/status");
      const data = (await res.json().catch(() => null)) as
        | { connected?: boolean; status?: typeof status }
        | null;
      if (data?.connected && data.status) setStatus(data.status);
      else setStatus(null);
    } catch {
      /* silencieux : le polling réessaiera */
    }
  }, []);

  // Polling : au montage si un domaine est branché, puis toutes les 5 s tant que non vérifié.
  useEffect(() => {
    if (!saved) {
      setStatus(null);
      return;
    }
    fetchStatus();
    const id = setInterval(() => {
      setStatus((s) => {
        if (s?.verified) return s; // stop quand vérifié
        fetchStatus();
        return s;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [saved, fetchStatus]);

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
        | { ok?: boolean; custom_domain?: string | null; status?: typeof status; error?: string }
        | null;
      if (res.ok && data?.ok) {
        setSaved(data.custom_domain ?? null);
        setStatus(data.status ?? null);
      } else {
        setError(data?.error ?? "Une erreur est survenue.");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setLoading(false);
  };

  const verified = status?.verified ?? false;
  const pending = Boolean(saved) && !verified;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-archivo text-base font-semibold text-night">Domaine personnalisé</h2>
        {verified ? (
          <Badge tone="success">
            <IconCheck size={13} /> Branché
          </Badge>
        ) : pending ? (
          <Badge tone="warn">En attente DNS…</Badge>
        ) : (
          <Badge tone="brand">Pro</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-slate">
        Branchez votre propre nom de domaine, puis posez les enregistrements DNS ci-dessous chez
        votre registrar. La propagation peut prendre quelques heures.
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

      {status?.configured === false && (
        <p className="mt-2 text-xs font-medium text-danger">
          Connexion Vercel indisponible côté serveur. Le domaine est enregistré mais pas encore
          actif — vérifiez la configuration.
        </p>
      )}

      {saved && status && status.records.length > 0 && (
        <div className="mt-4 rounded-xl border border-sky-300 bg-surface-2 p-3">
          <p className="mb-2 text-[13px] font-medium text-night">
            Enregistrements DNS à créer chez votre registrar :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-mist">
                <tr>
                  <th className="pb-1 pr-4 font-medium">Type</th>
                  <th className="pb-1 pr-4 font-medium">Nom</th>
                  <th className="pb-1 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody className="font-mono text-night">
                {status.records.map((r, i) => (
                  <tr key={i}>
                    <td className="py-0.5 pr-4">{r.type}</td>
                    <td className="py-0.5 pr-4">{r.name}</td>
                    <td className="py-0.5">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {verified ? (
            <p className="mt-2 text-[13px] text-night">
              Domaine vérifié et actif sur <code className="font-semibold">{saved}</code>.
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-mist">
              En attente de propagation DNS. Cette carte se met à jour automatiquement.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
