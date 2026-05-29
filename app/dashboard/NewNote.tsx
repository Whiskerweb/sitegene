"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewNote({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, message }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Erreur.");
      return;
    }
    setMessage("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-[16px] border border-line bg-ink-700 p-5">
      <label className="mb-2 block text-sm font-medium text-paper">
        Demander une modification
      </label>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ex : « Change le titre en ‹ Studio Lumière › et mets la photo du couple en grand. »"
        className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-paper outline-none focus:border-violet-500"
      />
      {error && <p className="mt-2 text-sm text-gold-400">{error}</p>}
      <button
        type="submit"
        disabled={busy || message.trim().length < 3}
        className="btn-violet mt-3 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
