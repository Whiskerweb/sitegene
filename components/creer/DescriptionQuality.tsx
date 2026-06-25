"use client";

/**
 * Retour qualité EN TEMPS RÉEL d'une description d'activité, sous le champ texte.
 *
 * Hybride IA + local :
 *  - La DÉTECTION est 100 % locale et instantanée : `diagnose(text, criteria)`
 *    rejoue à chaque frappe (aucun réseau dans la boucle de frappe).
 *  - Les CRITÈRES sont d'abord génériques (gauge instantanée), puis remplacés
 *    UNE fois par des critères SUR-MESURE générés par l'IA selon le métier
 *    (un artiste, un plombier et un coach n'ont pas les mêmes questions).
 *
 * Affiche : (a) badge label + score coloré, (b) jauge dégradé rouge→vert masquée
 * par un rectangle gris à left:{score}% + curseur (transition 300 ms), (c) les
 * questions restantes (info ambrée), (d) félicitations quand le ton est vert.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Check } from "lucide-react";
import { diagnose, criteriaFromTopics, type Criterion, type Tone } from "@/lib/foundry/describe-quality";
import { pickFallbackTopics } from "@/lib/foundry/criteria";
import { detectTrade } from "@/lib/foundry/suggest";

const TONE_UI: Record<Tone, { badge: string; score: string }> = {
  red: { badge: "bg-red-50 text-red-600 ring-red-200", score: "text-red-600" },
  amber: { badge: "bg-amber-50 text-amber-700 ring-amber-200", score: "text-amber-600" },
  green: { badge: "bg-green-50 text-green-700 ring-green-200", score: "text-green-600" },
};

export default function DescriptionQuality({
  text,
  domain = "",
  onBusinessName,
}: {
  text: string;
  domain?: string;
  onBusinessName?: (name: string) => void;
}) {
  // Critères sur-mesure (null = on tourne sur le générique en attendant l'IA).
  const [aiCriteria, setAiCriteria] = useState<Criterion[] | null>(null);
  const gotCriteriaRef = useRef(false); // critères déjà récupérés (stables) ?
  const nameFoundRef = useRef(false); // nom déjà extrait du brief ?
  const attemptsRef = useRef(0); // bornage des tentatives d'extraction du nom
  const lastReqRef = useRef<string>(""); // brief déjà interrogé
  const loadingRef = useRef(false);

  // Le domaine change → on régénère des critères adaptés au nouveau domaine.
  useEffect(() => {
    gotCriteriaRef.current = false;
    lastReqRef.current = "";
    setAiCriteria(null);
  }, [domain]);

  // Personnalisation des critères selon le DOMAINE + extraction du nom de
  // l'activité depuis le brief. Un appel pour les critères (stables) ; on
  // retente (borné) tant que le nom n'a pas été trouvé. La jauge, elle, tourne
  // déjà en local sur le générique — aucun blocage.
  useEffect(() => {
    const b = text.trim();
    const d = domain.trim();
    const hasDomain = d.length >= 2;
    // Déclenché par le DOMAINE (dès qu'il est choisi, même brief vide) OU, à
    // défaut de domaine, par un brief déjà conséquent.
    if (!hasDomain && b.length < 24) return;
    const reqKey = `${d}::${b}`;
    if (loadingRef.current || lastReqRef.current === reqKey) return;
    if (gotCriteriaRef.current && (nameFoundRef.current || attemptsRef.current >= 4)) return;
    const t = setTimeout(async () => {
      lastReqRef.current = reqKey;
      loadingRef.current = true;
      attemptsRef.current += 1;
      try {
        const res = await fetch("/api/foundry/criteria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: b, domain: domain.trim() }),
        });
        const data = await res.json().catch(() => null);
        if (data?.ok) {
          const bn = typeof data.businessName === "string" ? data.businessName.trim() : "";
          const justFoundName = !!bn && !nameFoundRef.current;
          // Pose les critères au 1er appel ; les rafraîchit quand le nom vient
          // d'être trouvé (la question « nom de l'activité » disparaît alors).
          if (Array.isArray(data.topics) && data.topics.length > 0 && (!gotCriteriaRef.current || justFoundName)) {
            setAiCriteria(criteriaFromTopics(data.topics));
            gotCriteriaRef.current = true;
          }
          if (justFoundName) {
            nameFoundRef.current = true;
            onBusinessName?.(bn);
          }
        }
      } catch {
        /* best-effort : on reste sur les critères génériques */
      } finally {
        loadingRef.current = false;
      }
    }, 700);
    return () => clearTimeout(t);
  }, [text, domain, onBusinessName]);

  // Repli PAR MÉTIER dès le 1er rendu (avant l'IA) : on dérive le métier du
  // domaine (puis du brief) côté client et on pose ses sujets — un musicien ne se
  // voit donc jamais demander « client cible / zone ». L'IA remplace ensuite via
  // aiCriteria. (criteria → suggest → da-personas = chaîne pure, client-safe.)
  const localCriteria = useMemo(() => {
    const trade = detectTrade((domain.trim() ? `${domain.trim()}. ` : "") + text).trade;
    return criteriaFromTopics(pickFallbackTopics(trade));
  }, [domain, text]);

  const { score, label, tone, tips } = useMemo(
    () => diagnose(text, aiCriteria ?? localCriteria),
    [text, aiCriteria, localCriteria],
  );

  if (!text.trim()) return null;
  const ui = TONE_UI[tone];

  return (
    <div className="mt-3">
      {/* (a) Badge label + score */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ring-1 ${ui.badge}`}
        >
          {tone === "green" && <Check size={13} />}
          {label}
        </span>
        <span className={`text-[12.5px] font-bold tabular-nums ${ui.score}`}>{score}%</span>
      </div>

      {/* (b) Jauge : dégradé fixe rouge→vert, masqué à droite du score, + curseur */}
      <div className="relative mt-2 h-2.5">
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ background: "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)" }}
        >
          <div
            className="absolute inset-y-0 right-0 bg-[rgb(var(--m-elevated))] transition-[left] duration-300 ease-out"
            style={{ left: `${score}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-[left] duration-300 ease-out"
          style={{ left: `${score}%` }}
          aria-hidden
        />
      </div>

      {/* (c) Questions restantes — adaptées au métier, aide non obligatoire */}
      {tips.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-1.5 text-[12.5px] text-[rgb(var(--m-muted))]">
              <Info size={13} className="mt-px shrink-0 text-amber-500" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {/* (d) Félicitation en vert */}
      {tone === "green" && (
        <p className="mt-2 text-[12.5px] font-medium text-green-600">
          🎉 Parfait — votre description a tout ce qu'il faut pour un super site.
        </p>
      )}
    </div>
  );
}
