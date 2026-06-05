"use client";

import { Spinner } from "@/components/ui/Spinner";
import { IconCheck, IconPin, IconStar4 } from "@/components/ui/icons";
import type { ChatMessage as Msg } from "@/lib/chat-thread";

type Props = {
  msg: Msg;
  balance: number;
  aiLoading: boolean;
  onAccept: () => void;
  onRefine: () => void;
  onCancel: () => void;
};

/** Une entrée du fil : bulle utilisateur, bulle IA, ou carte de proposition. */
export default function ChatMessage({
  msg,
  balance,
  aiLoading,
  onAccept,
  onRefine,
  onCancel,
}: Props) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-3.5 py-2.5 text-[13.5px] leading-snug text-white shadow-cloud">
          {(msg.targetLabel || msg.effectName) && (
            <p className="mb-1 flex flex-wrap gap-1">
              {msg.targetLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  <IconPin size={10} /> {msg.targetLabel}
                </span>
              )}
              {msg.effectName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  <IconStar4 size={10} /> {msg.effectName}
                </span>
              )}
            </p>
          )}
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.kind === "text") {
    return (
      <div className="flex justify-start">
        <div
          className={`max-w-[85%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-[13.5px] leading-snug shadow-cloud ${
            msg.isError
              ? "border-red-200 bg-red-50 text-[#c0392b]"
              : "border-white/70 bg-white/85 text-night"
          }`}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  // Carte de proposition (aperçu déjà appliqué sur l'iframe quand status === "active")
  return (
    <div className="sgai-card w-full" style={{ padding: "12px 14px" }}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="sgai-badge flex-none">✦ Aperçu</span>
        {msg.status === "accepted" && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
            <IconCheck size={13} /> Appliquée
          </span>
        )}
        {msg.status === "expired" && (
          <span className="text-[12px] text-mist">Proposition expirée</span>
        )}
      </div>
      <p className="text-[13px] leading-snug sgai-soft">{msg.explanation}</p>
      {msg.status === "active" && (
        <>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button type="button" className="sgai-cancel text-sm" onClick={onCancel}>
              Annuler
            </button>
            <button type="button" className="sgai-ghost text-sm" onClick={onRefine}>
              Affiner
            </button>
            <button
              type="button"
              className="sgai-primary flex items-center gap-1.5 text-sm"
              disabled={(msg.action === "css" && balance < 1) || aiLoading}
              onClick={onAccept}
            >
              {aiLoading && <Spinner size={14} />}
              Accepter{" "}
              <span className="rounded-lg bg-white/25 px-1.5 py-0.5 text-[11px] font-extrabold">
                {msg.action === "component" ? "Inclus" : "1 ✦"}
              </span>
            </button>
          </div>
          {msg.action === "css" && balance < 1 && (
            <p className="mt-1.5 text-[12px] text-[#c0392b]">
              Solde insuffisant —{" "}
              <a className="underline" href="/dashboard/credits">
                achetez des étoiles
              </a>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
