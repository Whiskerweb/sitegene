"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CRM_CATEGORIES } from "@/lib/crm/categories";
import { LOST_REASONS, isTerminalStatus } from "@/lib/crm/stages";
import { setProspectStatus, updateProspectFields } from "@/app/admin/_actions";
import type { Prospect } from "@/lib/types/db";

const FIELDS: { key: keyof Prospect; label: string; type?: string }[] = [
  { key: "first_name", label: "Prénom / nom" },
  { key: "company_name", label: "Entreprise" },
  { key: "phone", label: "Téléphone" },
  { key: "city", label: "Ville / région" },
  { key: "website", label: "Site web" },
  { key: "instagram", label: "Instagram" },
  { key: "source", label: "Source du lead" },
];

export function ProspectActions({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [lostOpen, setLostOpen] = useState(false);

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { category: prospect.category ?? "" };
    for (const f of FIELDS) init[f.key] = (prospect[f.key] as string | null) ?? "";
    return init;
  });

  const inputCls =
    "w-full rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-paper outline-none focus:border-violet-400/50";

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateProspectFields(prospect.id, form);
      if (res.ok) {
        setMsg({ ok: true, text: "Enregistré." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  function status(s: "PERDU" | "NON_QUALIFIE" | "EN_COURS", reason?: string) {
    setLostOpen(false);
    startTransition(async () => {
      const res = await setProspectStatus(prospect.id, s, reason ?? null);
      if (res.ok) {
        setMsg({ ok: true, text: "Statut mis à jour." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  const terminal = isTerminalStatus(prospect.pipeline_status);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-ink-800 p-6">
        <h2 className="font-display text-lg font-semibold">Coordonnées</h2>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[12px] text-faint">Catégorie</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              <option value="">Non classé</option>
              {CRM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[12px] text-faint">{f.label}</span>
              <input
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className={inputCls}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="btn-violet rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Enregistrer
          </button>
          {msg ? (
            <span className={`text-[12px] ${msg.ok ? "text-mint-400" : "text-[#ef6d6d]"}`}>{msg.text}</span>
          ) : null}
        </div>
      </div>

      {/* Actions de statut */}
      <div className="rounded-2xl border border-line bg-ink-800 p-6">
        <h2 className="font-display text-lg font-semibold">Statut</h2>
        <p className="mt-1 text-[12px] text-faint">
          L&apos;étape avance toute seule selon les signaux. Ici tu poses une décision humaine.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {terminal ? (
            <button
              type="button"
              onClick={() => status("EN_COURS")}
              disabled={isPending}
              className="rounded-full border border-mint-400/30 px-4 py-2 text-sm text-mint-400 hover:bg-ink-700 disabled:opacity-50"
            >
              Réactiver
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setLostOpen(!lostOpen)}
                disabled={isPending}
                className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-paper disabled:opacity-50"
              >
                Marquer perdu…
              </button>
              <button
                type="button"
                onClick={() => status("NON_QUALIFIE")}
                disabled={isPending}
                className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-paper disabled:opacity-50"
              >
                Non qualifié
              </button>
            </>
          )}
        </div>

        {lostOpen && !terminal ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {LOST_REASONS.filter((r) => r.id !== "no_response").map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => status("PERDU", r.id)}
                className="rounded-full border border-[#ef6d6d]/30 px-3 py-1.5 text-[13px] text-[#ef6d6d] hover:bg-ink-700"
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
