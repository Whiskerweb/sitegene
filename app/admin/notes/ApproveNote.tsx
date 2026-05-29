"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveNote({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/operator/notes/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Erreur.");
    else router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={approve}
        disabled={busy}
        className="btn-violet rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Lancer la modif (Claude)"}
      </button>
      {error && <span className="text-xs text-gold-400">{error}</span>}
    </div>
  );
}
