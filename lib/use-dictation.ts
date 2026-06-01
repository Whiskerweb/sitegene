"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dictée vocale via la Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Disponible sur Chrome, Edge, Safari (https ou localhost requis). Sans support,
 * `supported` reste `false` et le bouton micro n'est pas rendu.
 *
 * Écoute « continue » réelle : le moteur émet `onend` après un silence même avec
 * `continuous=true`, donc on relance une instance NEUVE tant que l'utilisateur n'a
 * pas arrêté (`wantRef`) et qu'aucune erreur fatale n'est survenue. Tous les chemins
 * (arrêt volontaire, erreur, échec de start, démontage) remettent l'état à plat de
 * façon synchrone et neutralisent les handlers pour qu'aucune repo orpheline ne
 * puisse se relancer ni laisser le micro allumé.
 */

interface SRAlternative {
  transcript: string;
}
interface SRResult {
  readonly length: number;
  isFinal: boolean;
  0: SRAlternative;
}
interface SRResultList {
  readonly length: number;
  [index: number]: SRResult;
}
interface SREvent {
  resultIndex: number;
  results: SRResultList;
}
interface SRErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Erreurs qui stoppent définitivement (pas de relance automatique).
// "network" n'en fait PAS partie : elle est souvent transitoire → on retente (cf. run()).
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);
// Une erreur "network" est retentée ce nombre de fois avant d'abandonner avec un message.
const MAX_NETWORK_RETRIES = 2;

export function useDictation(onText: (chunk: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false); // l'utilisateur veut-il encore écouter ? (source de vérité)
  const onTextRef = useRef(onText);
  const runRef = useRef<() => void>(() => {});
  const retriesRef = useRef(0); // tentatives consécutives après erreur réseau

  // On garde la dernière version du callback sans recréer la reconnaissance.
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  // Détection après le montage → pas de mismatch d'hydratation SSR.
  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  // Détache les handlers et avorte une reconnaissance : elle ne peut plus se relancer.
  const kill = useCallback((rec: SpeechRecognitionLike | null) => {
    if (!rec) return;
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    try {
      rec.abort();
    } catch {
      /* déjà arrêtée */
    }
  }, []);

  const run = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Repartir d'un état propre : aucune ancienne repo ne doit survivre.
    kill(recRef.current);
    recRef.current = null;

    const rec = new Ctor();
    let networkErred = false; // cette session a-t-elle échoué sur une erreur réseau ?
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      retriesRef.current = 0; // une repo qui transcrit = backend joignable
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) chunk += r[0].transcript;
      }
      if (chunk.trim()) onTextRef.current(chunk.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "network") {
        networkErred = true; // géré dans onend (retry borné)
      } else if (FATAL_ERRORS.has(e.error)) {
        wantRef.current = false;
        setError(e.error);
      }
    };
    rec.onend = () => {
      if (recRef.current !== rec) return; // onend d'une repo périmée → ignore
      recRef.current = null;
      rec.onresult = null;
      rec.onerror = null;
      if (!wantRef.current) {
        setListening(false);
        return;
      }
      if (networkErred) {
        // Erreur réseau : retenter quelques fois (transitoire), puis abandonner proprement.
        retriesRef.current += 1;
        if (retriesRef.current > MAX_NETWORK_RETRIES) {
          wantRef.current = false;
          retriesRef.current = 0;
          setError("network");
          setListening(false);
          return;
        }
        window.setTimeout(() => {
          if (wantRef.current) runRef.current();
        }, 500);
        return;
      }
      runRef.current(); // fin normale (silence) → relance propre via une instance neuve
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start a échoué (ex. "already started") → tout remettre à plat.
      kill(rec);
      recRef.current = null;
      wantRef.current = false;
      setListening(false);
    }
  }, [kill]);

  // run se référence lui-même dans onend → on passe par un ref pour rester stable.
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // Arrêt déterministe et SYNCHRONE — ne dépend pas de l'émission de onend.
  const stop = useCallback(() => {
    wantRef.current = false;
    retriesRef.current = 0;
    const rec = recRef.current;
    recRef.current = null;
    kill(rec); // onend neutralisé → aucune relance possible
    setListening(false);
  }, [kill]);

  const start = useCallback(() => {
    setError(null);
    retriesRef.current = 0;
    wantRef.current = true;
    run();
  }, [run]);

  // Décision basée sur wantRef (toujours à jour), pas sur le state listening (différé).
  const toggle = useCallback(() => {
    if (wantRef.current) stop();
    else start();
  }, [start, stop]);

  // Nettoyage au démontage : couper sans toucher au state (composant qui part).
  useEffect(() => {
    return () => {
      wantRef.current = false;
      kill(recRef.current);
      recRef.current = null;
    };
  }, [kill]);

  return { supported, listening, error, toggle, stop };
}
