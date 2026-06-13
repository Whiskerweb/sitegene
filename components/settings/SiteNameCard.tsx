"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconClock } from "@/components/ui/icons";

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/** Date locale lisible (ex : « 12 juillet 2026 »). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Carte « Nom & adresse » : renomme le sous-domaine public `name.akyra.io`.
 * Le nom par défaut est modifiable librement (slugChangedAt = null) ; une fois
 * modifié, le renommage suivant n'est possible que tous les 30 jours.
 */
export function SiteNameCard({
  slug,
  slugChangedAt,
}: {
  slug: string;
  slugChangedAt: string | null;
}) {
  const [value, setValue] = useState(slug);
  const [current, setCurrent] = useState(slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState(false);

  // Prochaine fenêtre de renommage (null = libre dès maintenant).
  const initialNext =
    slugChangedAt && Date.now() - new Date(slugChangedAt).getTime() < COOLDOWN_MS
      ? new Date(new Date(slugChangedAt).getTime() + COOLDOWN_MS).toISOString()
      : null;
  const [nextChangeAt, setNextChangeAt] = useState<string | null>(initialNext);

  const locked = nextChangeAt !== null;
  const trimmed = value.trim().toLowerCase();
  const canSave = !loading && !locked && trimmed.length > 0 && trimmed !== current;

  const save = async () => {
    setLoading(true);
    setError(null);
    setOkMsg(false);
    try {
      const res = await fetch("/api/site/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; slug?: string; nextChangeAt?: string; error?: string }
        | null;
      if (res.ok && data?.ok && data.slug) {
        setCurrent(data.slug);
        setValue(data.slug);
        setOkMsg(true);
        if (data.nextChangeAt) setNextChangeAt(data.nextChangeAt);
      } else {
        setError(data?.error ?? "Une erreur est survenue.");
        if (res.status === 429 && data?.nextChangeAt) setNextChangeAt(data.nextChangeAt);
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setLoading(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-archivo text-base font-semibold text-night">Nom & adresse</h2>
        <Badge tone="success">
          <IconCheck size={13} /> En ligne
        </Badge>
      </div>
      <p className="mt-1 text-sm text-slate">
        L'adresse publique de votre portfolio :{" "}
        <code className="text-night">{current}.akyra.io</code>
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center rounded-xl border border-sky-300 bg-surface-2 px-4 py-2.5 focus-within:border-brand">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={locked || loading}
            placeholder="votre-nom"
            className="w-full bg-transparent text-sm text-night outline-none disabled:opacity-60"
          />
          <span className="shrink-0 text-sm text-mist">.akyra.io</span>
        </div>
        <Button onClick={save} loading={loading} disabled={!canSave} size="sm" className="shrink-0">
          Mettre à jour le nom
        </Button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

      {okMsg && !error && (
        <p className="mt-2 text-[13px] text-mist">
          Nom mis à jour. L'ancienne adresse ne fonctionne plus — partagez bien{" "}
          <code className="text-night">{current}.akyra.io</code>.
        </p>
      )}

      {locked ? (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-mist">
          <IconClock size={14} /> Prochain changement possible le{" "}
          <span className="text-night">{formatDate(nextChangeAt!)}</span>.
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-mist">
          Vous pourrez ensuite le changer une fois tous les 30 jours.
        </p>
      )}
    </Card>
  );
}
