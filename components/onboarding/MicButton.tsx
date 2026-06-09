"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";

type MicState = "idle" | "recording" | "transcribing";

interface MicButtonProps {
  siteId: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function MicButton({ siteId, onTranscript, disabled }: MicButtonProps) {
  const [micState, setMicState] = useState<MicState>("idle");
  // unsupported: mic not available or permission denied or server missing key
  const [unsupported, setUnsupported] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    // Guard: check browser support (SSR-safe — only runs in event handler)
    if (!navigator?.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permission denied or device not found → hide silently
      setUnsupported(true);
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Prefer webm, fall back to browser default
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setMicState("transcribing");

      try {
        const fd = new FormData();
        fd.append("siteId", siteId);
        fd.append("audio", blob, "audio.webm");

        const res = await fetch("/api/onboarding/transcribe", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          // 502 with reason no-key → hide the button permanently
          if (res.status === 502) {
            try {
              const data = await res.json();
              if (data?.reason === "no-key") {
                setUnsupported(true);
                return;
              }
            } catch {
              // ignore JSON parse error
            }
          }
          setMicState("idle");
          return;
        }

        const data = await res.json();
        if (typeof data?.text === "string" && data.text.trim()) {
          onTranscript(data.text);
        }
      } catch {
        // Network/server error → fail silently, back to idle
      } finally {
        setMicState("idle");
      }
    };

    recorder.start();
    setMicState("recording");
  }, [siteId, onTranscript]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    // Stop all tracks to release the mic indicator
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    // onstop handler will transition to transcribing then idle
  }, []);

  const handleClick = useCallback(() => {
    if (micState === "idle") {
      void startRecording();
    } else if (micState === "recording") {
      stopRecording();
    }
    // transcribing: ignore clicks
  }, [micState, startRecording, stopRecording]);

  // Hide entirely if unsupported
  if (unsupported) return null;

  const ariaLabel =
    micState === "recording"
      ? "Arrêter l'enregistrement"
      : micState === "transcribing"
        ? "Transcription en cours…"
        : "Dicter votre réponse";

  const isDisabled = disabled || micState === "transcribing";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={[
        "relative grid h-9 w-9 place-items-center rounded-xl transition-colors",
        micState === "recording"
          ? "bg-rose-50 text-rose-500 ring-1 ring-rose-200 hover:bg-rose-100"
          : "bg-sky-50 text-sky-600 ring-1 ring-sky-200 hover:bg-sky-100",
        isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {micState === "idle" && <Mic className="h-4 w-4" />}

      {micState === "recording" && (
        <>
          <MicOff className="h-4 w-4" />
          {/* Pulsing rose dot — recording indicator */}
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500"
            style={{ animation: "micPulse 1s ease-in-out infinite" }}
          />
          <style>{`
            @keyframes micPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.75); }
            }
          `}</style>
        </>
      )}

      {micState === "transcribing" && <Loader2 className="h-4 w-4 animate-spin" />}
    </button>
  );
}
