"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { IconArrowUp, IconClose, IconMic, IconPin, IconStar4 } from "@/components/ui/icons";
import type { useDictation } from "@/lib/use-dictation";
import type { ChatMessage as Msg } from "@/lib/chat-thread";
import type { PinSelector } from "@/lib/notes-selector";
import ChatMessage from "./ChatMessage";
import GalleryPopover from "./GalleryPopover";
import type { OwnedEffect } from "../EditorClient";

export type Composer = {
  text: string;
  target: PinSelector | null;
  effect: OwnedEffect | null;
};

type Props = {
  messages: Msg[];
  composer: Composer;
  selecting: boolean; // tool === "note"
  aiLoading: boolean;
  balance: number;
  galleryOpen: boolean;
  ownedEffects: OwnedEffect[];
  dictation: ReturnType<typeof useDictation>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onText: (t: string) => void;
  onSend: () => void;
  onToggleSelect: () => void;
  onRemoveTarget: () => void;
  onRemoveEffect: () => void;
  onToggleGallery: () => void;
  onPickEffect: (fx: OwnedEffect) => void;
  onAccept: () => void;
  onRefine: () => void;
  onCancelProposal: () => void;
  onRetry: () => void;
};

/** Colonne de chat façon Lovable : fil de messages + composer (chips cible/effet, galerie, dictée). */
export default function ChatPanel({
  messages,
  composer,
  selecting,
  aiLoading,
  balance,
  galleryOpen,
  ownedEffects,
  dictation,
  inputRef,
  onText,
  onSend,
  onToggleSelect,
  onRemoveTarget,
  onRemoveEffect,
  onToggleGallery,
  onPickEffect,
  onAccept,
  onRefine,
  onCancelProposal,
  onRetry,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Défilement automatique vers le bas à chaque nouveau message / état de chargement.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, aiLoading]);

  // Autosize du textarea (façon ChatGPT), plafonné.
  const resize = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [inputRef]);
  useEffect(() => {
    resize();
  }, [composer.text, resize]);

  const lastIndex = messages.length - 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fil */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-[13.5px] leading-relaxed text-slate">
            <p className="mb-1 font-archivo text-[15px] font-bold text-night">✦ Votre assistant</p>
            Décrivez une modification (« passe les boutons en doré »), ciblez un endroit précis
            avec <b>⌖ Cibler</b>, ou intégrez un composant avec <b>✦</b>.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id}>
            <ChatMessage
              msg={m}
              balance={balance}
              aiLoading={aiLoading}
              onAccept={onAccept}
              onRefine={onRefine}
              onCancel={onCancelProposal}
            />
            {m.role === "assistant" && m.kind === "text" && m.isError && i === lastIndex && (
              <button
                type="button"
                className="mt-1 text-[12px] text-slate underline"
                onClick={onRetry}
              >
                ↻ Réessayer
              </button>
            )}
          </div>
        ))}
        {aiLoading && (
          <div className="flex items-center gap-2 px-1 text-[13px] text-mist">
            <Spinner size={14} /> Génération en cours…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative flex-none px-3 pb-3">
        {galleryOpen && (
          <GalleryPopover effects={ownedEffects} onPick={onPickEffect} onClose={onToggleGallery} />
        )}
        <div className="sgai-promptbox">
          {(composer.target || composer.effect) && (
            <div className="sgai-chiprow">
              {composer.target && (
                <span
                  className="sgai-chip"
                  style={{ background: "linear-gradient(120deg, #2563eb, #60a5fa)" }}
                >
                  <IconPin size={12} /> {composer.target.label || "Élément ciblé"}
                  <button type="button" aria-label="Retirer la cible" onClick={onRemoveTarget}>
                    <IconClose size={11} />
                  </button>
                </span>
              )}
              {composer.effect && (
                <span
                  className="sgai-chip"
                  style={{
                    background: `linear-gradient(120deg, ${composer.effect.accentFrom}, ${composer.effect.accentTo})`,
                  }}
                >
                  <IconStar4 size={12} /> {composer.effect.name}
                  <button type="button" aria-label="Retirer le composant" onClick={onRemoveEffect}>
                    <IconClose size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            className="sgai-input"
            value={composer.text}
            placeholder={
              dictation.listening
                ? "À l'écoute…"
                : composer.effect
                  ? "Précisez l'intégration (optionnel)…"
                  : "Décrivez le changement…"
            }
            onChange={(e) => onText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && composer.text.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <div className="sgai-promptbar">
            <button
              type="button"
              className={`sgai-fxbtn${selecting ? " is-on" : ""}`}
              onClick={onToggleSelect}
              aria-pressed={selecting}
              aria-label="Cibler un endroit sur l'aperçu"
              title="Cibler un endroit sur l'aperçu"
            >
              <IconPin size={17} />
            </button>
            <button
              type="button"
              className={`sgai-fxbtn${composer.effect ? " is-on" : ""}`}
              onClick={onToggleGallery}
              aria-expanded={galleryOpen}
              aria-label="Mes composants"
              title="Mes composants (animations achetées)"
            >
              <IconStar4 size={17} />
            </button>
            {dictation.supported && (
              <button
                type="button"
                className={`sgai-mic${dictation.listening ? " is-on" : ""}`}
                onClick={dictation.toggle}
                aria-pressed={dictation.listening}
                aria-label={dictation.listening ? "Arrêter la dictée" : "Dicter"}
                title={dictation.listening ? "Arrêter la dictée" : "Dicter"}
              >
                <IconMic size={18} />
              </button>
            )}
            <button
              type="button"
              className="sgai-send ml-auto"
              onClick={onSend}
              disabled={!composer.text.trim() || aiLoading}
              aria-label="Envoyer"
              title="Envoyer"
            >
              <IconArrowUp size={18} />
            </button>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {dictation.listening ? "Dictée en cours, parlez maintenant." : ""}
        </span>
      </div>
    </div>
  );
}
