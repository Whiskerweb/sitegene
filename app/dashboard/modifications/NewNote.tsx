"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewNote({ siteId, balance }: { siteId: string; balance: number }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const noCredits = balance <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, message }),
    });
    const text = await res.text();
    let json: { error?: string } = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue.");
      return;
    }
    setMessage("");
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h2 className="font-archivo text-lg font-semibold text-night">
        Demander une modification
      </h2>
      <p className="mt-1 text-sm text-slate">
        Décrivez ce que vous voulez changer — on s'en occupe pour vous.
      </p>
      <form onSubmit={submit} className="mt-4">
        <Field hint={`Coût : 1 crédit par modification · Solde : ${balance} crédit${balance > 1 ? "s" : ""}`}>
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex : « Change le titre en ‹ Studio Lumière › et mets la photo du couple en grand. »"
          />
        </Field>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        {noCredits && (
          <p className="mt-2 text-sm text-warn">
            Vous n'avez plus de crédits.{" "}
            <a href="/dashboard/credits" className="font-semibold text-brand underline">
              Recharger
            </a>
          </p>
        )}
        <div className="mt-4">
          <Button type="submit" loading={busy} disabled={message.trim().length < 3 || noCredits}>
            Envoyer la demande
          </Button>
        </div>
      </form>
    </Card>
  );
}
