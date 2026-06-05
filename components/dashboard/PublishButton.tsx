"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconAlert, IconCloud } from "@/components/ui/icons";

/**
 * Met en ligne la peau en cours d'édition depuis le dashboard (sans passer par
 * l'éditeur). Publier coûte 1 crédit (sauf abonnement illimité) — l'erreur 409
 * « solde insuffisant » est affichée telle quelle. Au succès, on recharge la
 * page pour que l'aperçu et le statut reflètent la nouvelle peau en ligne.
 */
export function PublishButton({ siteId, balance }: { siteId: string; balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/site/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Échec de la publication.");
        return;
      }
      router.refresh();
    } catch {
      setError("Échec de la publication.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => void publish()} loading={busy} disabled={balance < 1}>
        <IconCloud size={16} /> Publier en ligne
      </Button>
      {balance < 1 && !error && (
        <p className="text-[12px] text-mist">Solde insuffisant — 1 crédit requis pour publier.</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-[12px] text-danger">
          <IconAlert size={13} /> {error}
        </p>
      )}
    </div>
  );
}
