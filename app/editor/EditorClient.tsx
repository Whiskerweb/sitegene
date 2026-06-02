"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import {
  IconAlert,
  IconArrowUp,
  IconCheck,
  IconChevron,
  IconClose,
  IconDesktop,
  IconEdit,
  IconMic,
  IconPhone,
  IconPin,
  IconStar4,
  IconTablet,
} from "@/components/ui/icons";
import { getAtPath, setAtPath, pageIndexForPath } from "@/lib/content-path";
import { normalizeContent, type SiteContentV2 } from "@/lib/site-content";
import { useDictation } from "@/lib/use-dictation";
import type { PinSelector } from "@/lib/notes-selector";

export type EditableField = {
  path: string;
  label: string;
  type: string;
  maxLen: number | null;
};

type Props = {
  siteId: string;
  slug: string | null;
  balance: number;
  hasUnpublished: boolean;
  editableFields: EditableField[];
  content: Record<string, unknown>;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type Panel = { path: string; label: string; type: string; maxLen: number | null; value: string };
type Device = "desktop" | "tablet" | "mobile";
type NoticeKind = "info" | "success" | "error";
type Notice = { msg: string; kind: NoticeKind; id: number } | null;
const NOTICE_MS = 4500;

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "834px",
  mobile: "390px",
};

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function EditorClient({
  siteId,
  balance: initialBalance,
  hasUnpublished: initialHasUnpub,
  editableFields,
  content,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // On stocke le contenu sous sa forme NORMALISÉE v2 (idempotent sur un contenu
  // déjà v2 ; promeut un ancien contenu v1 plat en page unique « / », index 0).
  // L'éditeur lit/écrit donc toujours via les helpers page-aware getAtPath/setAtPath.
  const contentRef = useRef<SiteContentV2>(normalizeContent(structuredClone(content)));
  const changesRef = useRef<Record<string, unknown>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeSeq = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPhoto = useRef<string | null>(null);
  const aiInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Pages du site (forme v2). Le sélecteur de page pilote currentPageIndex et
  // l'URL ?path= de l'iframe d'aperçu. Mémoïsé à partir du contenu initial : la
  // structure des pages (slug/title) ne change pas pendant une session d'édition.
  const pages = contentRef.current.pages;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [balance, setBalance] = useState(initialBalance);
  const [hasUnpub, setHasUnpub] = useState(initialHasUnpub);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [touched, setTouched] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [device, setDevice] = useState<Device>("desktop");

  const [tool, setTool] = useState<"edit" | "note">("edit");
  const [aiDraft, setAiDraft] = useState<{ target: PinSelector; message: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<{ css: string; explanation: string } | null>(null);
  // Picker photo : clic sur un emplacement → choix « téléverser » ou « bibliothèque ».
  const [photoPicker, setPhotoPicker] = useState<{ path: string } | null>(null);
  const [libPhotos, setLibPhotos] = useState<
    { path: string; url: string; name: string }[] | null
  >(null);
  const reduce = useReducedMotion();

  // Notifications : message typé (info / succès / erreur). Succès & erreurs disparaissent
  // seules après NOTICE_MS ; les infos (« Téléversement… ») persistent jusqu'au remplacement.
  const notify = useCallback((msg: string, kind: NoticeKind = "info") => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    if (!msg) {
      setNotice(null);
      return;
    }
    noticeSeq.current += 1;
    setNotice({ msg, kind, id: noticeSeq.current });
    if (kind !== "info") {
      noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
    }
  }, []);
  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  // Autosize de la zone de texte IA : la fenêtre grandit avec le contenu (façon ChatGPT).
  const resizeAi = useCallback(() => {
    const ta = aiInputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
  }, []);
  // Callback ref : recalcule la hauteur au moment où le textarea (re)monte — y compris
  // après une erreur IA où l'effet ci-dessous tournerait avant que le nœud n'existe.
  const setAiInput = useCallback(
    (node: HTMLTextAreaElement | null) => {
      aiInputRef.current = node;
      if (node) resizeAi();
    },
    [resizeAi],
  );
  useEffect(() => {
    resizeAi();
  }, [aiDraft?.message, aiLoading, resizeAi]);

  // Dictée vocale : on ajoute le texte reconnu à la fin de la demande en cours.
  const dictation = useDictation((chunk) =>
    setAiDraft((d) => (d ? { ...d, message: d.message ? `${d.message} ${chunk}` : chunk } : d)),
  );

  // Remonte à l'utilisateur les erreurs de dictée (micro refusé, réseau indisponible).
  useEffect(() => {
    if (!dictation.error) return;
    if (dictation.error === "not-allowed" || dictation.error === "service-not-allowed") {
      notify("Micro refusé — autorisez-le dans votre navigateur pour dicter.", "error");
    } else if (dictation.error === "network") {
      notify("Dictée vocale indisponible sur ce navigateur.", "error");
    } else if (dictation.error === "audio-capture") {
      notify("Aucun micro détecté.", "error");
    }
  }, [dictation.error, notify]);

  // Échap ferme la modale IA quel que soit l'élément focalisé (textarea, micro, envoi).
  useEffect(() => {
    if (!aiDraft || aiProposal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAi();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDraft, aiProposal]);

  // Champs éditables : UNION PLATE de tous les champs connus du manifest (E3).
  // Pour cette v1 multi-pages on ne segmente PAS les champs par type de page : un
  // chemin matche s'il figure dans `editableFields`, sinon l'éditeur retombe sur
  // un champ générique (textarea). Tolérant par construction — suffisant ici.
  const specFor = useCallback(
    (path: string): EditableField | null => {
      for (const f of editableFields) {
        const re = new RegExp("^" + f.path.split("[]").map(escapeRe).join("\\[\\d+\\]") + "$");
        if (re.test(path)) return f;
      }
      return null;
    },
    [editableFields],
  );

  const flushSave = useCallback(async () => {
    if (Object.keys(changesRef.current).length === 0) return;
    setSaveState("saving");
    const snapshot = changesRef.current;
    // Vide le buffer AVANT l'envoi : tout changement enregistré pendant le fetch
    // appartient à la prochaine itération et ne doit pas être re-soumis.
    changesRef.current = {};
    try {
      const res = await fetch("/api/site/draft", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, changes: snapshot, pageIndex: currentPageIndex }),
      });
      if (!res.ok) {
        // Échec : on remet les changements non sauvegardés dans le buffer
        // (merge : les changements survenus pendant le fetch ont priorité).
        changesRef.current = { ...snapshot, ...changesRef.current };
        throw new Error();
      }
      setSaveState("saved");
      setHasUnpub(true);
    } catch {
      setSaveState("error");
    }
  }, [siteId, currentPageIndex]);

  const scheduleSave = useCallback(() => {
    setTouched(true);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 800);
  }, [flushSave]);

  const recordChange = useCallback(
    (path: string, value: string) => {
      changesRef.current[path] = value;
      // Écriture page-aware : on pose la valeur dans pages[currentPageIndex].content.
      // setAtPath renvoie une COPIE immuable → on réaffecte le ref.
      contentRef.current = setAtPath(contentRef.current, currentPageIndex, path, value);
      scheduleSave();
    },
    [scheduleSave, currentPageIndex],
  );

  const post = useCallback((msg: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  // Construction UNIQUE de l'URL d'aperçu. ?path=<slug de la page> cible la page
  // courante (multi-pages) ; la home ("/") n'a pas besoin du paramètre. `bust`
  // ajoute un cache-buster (rechargement forcé après commit IA / publication).
  const previewUrl = useCallback(
    (pageIndex: number, bust = false) => {
      const slug = pages[pageIndex]?.slug ?? "/";
      const params = new URLSearchParams({ siteId, edit: "1" });
      if (slug && slug !== "/") params.set("path", slug);
      if (bust) params.set("t", String(Date.now()));
      return `/api/preview?${params.toString()}`;
    },
    [pages, siteId],
  );

  // Changement de page depuis le sélecteur : flush les changements en attente
  // AVANT de changer de page (un lot autosave doit appartenir à une seule page),
  // puis MAJ de l'index + rechargement de l'iframe vers la nouvelle page.
  // sg:ready (re)poussera ensuite le mode courant.
  const changePage = useCallback(
    async (idx: number) => {
      if (idx === currentPageIndex || !pages[idx]) return;
      if (Object.keys(changesRef.current).length > 0) {
        await flushSave();
      }
      setCurrentPageIndex(idx);
      if (iframeRef.current) iframeRef.current.src = previewUrl(idx);
    },
    [currentPageIndex, pages, previewUrl, flushSave],
  );

  const switchTool = useCallback(
    (t: "edit" | "note") => {
      setTool(t);
      post({ type: "sg:mode", mode: t });
    },
    [post],
  );

  // Messages venant de l'iframe (runtime d'édition).
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data || {};
      if (d.type === "sg:ready") {
        post({ type: "sg:mode", mode: tool });
        return;
      }
      if (d.type === "sg:editText") {
        if (d.leaf) {
          recordChange(d.path, String(d.value ?? ""));
        } else {
          const spec = specFor(d.path);
          // Lecture page-aware dans pages[currentPageIndex].content.
          const cur = getAtPath(contentRef.current, currentPageIndex, d.path);
          setPanel({
            path: d.path,
            label: spec?.label ?? d.path,
            type: (d.fieldType as string) ?? spec?.type ?? "textarea",
            maxLen: spec?.maxLen ?? (typeof d.maxLen === "number" ? d.maxLen : null),
            value: typeof cur === "string" ? cur : String(d.value ?? ""),
          });
        }
      } else if (d.type === "sg:editPhoto") {
        // Ouvre le choix : nouvelle photo OU une photo de la bibliothèque.
        setLibPhotos(null);
        setPhotoPicker({ path: d.path });
      } else if (d.type === "sg:note") {
        // Mode « Sélectionner » : un clic ouvre directement la demande à l'IA.
        const t = d.target;
        if (t && typeof t.cssSelector === "string") {
          setAiProposal(null);
          setAiDraft({
            target: {
              path: t.path,
              cssSelector: t.cssSelector,
              label: t.label ?? "",
              xPct: t.xPct,
              yPct: t.yPct,
            },
            message: "",
          });
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [recordChange, specFor, post, tool, currentPageIndex]);

  function savePanel() {
    if (!panel) return;
    const v = panel.maxLen ? panel.value.slice(0, panel.maxLen) : panel.value;
    post({ type: "sg:setValue", path: panel.path, value: v });
    recordChange(panel.path, v);
    setPanel(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const path = pendingPhoto.current;
    pendingPhoto.current = null;
    if (!file || !path) return;
    notify("Téléversement de la photo…", "info");
    try {
      const fd = new FormData();
      fd.set("siteId", siteId);
      fd.set("file", file);
      const res = await fetch("/api/site/photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        notify(json.error ?? "Échec de l'upload.", "error");
        return;
      }
      post({ type: "sg:setPhoto", path, url: json.url });
      recordChange(path, json.url);
      notify("Photo mise à jour", "success");
    } catch {
      notify("Échec de l'upload.", "error");
    }
  }

  // Charge la bibliothèque (lazy) à l'ouverture du picker.
  useEffect(() => {
    if (!photoPicker) return;
    let alive = true;
    fetch(`/api/site/photos?siteId=${encodeURIComponent(siteId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive) setLibPhotos(Array.isArray(j.photos) ? j.photos : []);
      })
      .catch(() => {
        if (alive) setLibPhotos([]);
      });
    return () => {
      alive = false;
    };
  }, [photoPicker, siteId]);

  // Applique une photo de la bibliothèque à l'emplacement ciblé.
  function pickFromLibrary(url: string) {
    if (!photoPicker) return;
    post({ type: "sg:setPhoto", path: photoPicker.path, url });
    recordChange(photoPicker.path, url);
    notify("Photo mise à jour", "success");
    setPhotoPicker(null);
  }

  // Bascule vers le téléversement classique (flux onFile existant).
  function pickUpload() {
    if (!photoPicker) return;
    pendingPhoto.current = photoPicker.path;
    setPhotoPicker(null);
    fileRef.current?.click();
  }

  function closeAi() {
    dictation.stop();
    setAiProposal(null);
    setAiDraft(null);
    post({ type: "sg:css", css: "" });
  }

  async function askAi() {
    if (!aiDraft || !aiDraft.message.trim()) return;
    dictation.stop(); // coupe le micro dès l'envoi (Entrée ou clic)
    setAiLoading(true);
    try {
      const res = await fetch("/api/site/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, message: aiDraft.message.trim(), target: aiDraft.target }),
      });
      const json = await res.json();
      if (json.ok && json.action === "css") {
        post({ type: "sg:css", css: json.css });
        setAiProposal({ css: json.css, explanation: json.explanation ?? "Modification appliquée." });
      } else if (json.action === "unsupported") {
        notify(`L'IA ne peut pas le faire : ${json.reason ?? "demande trop large"}.`, "error");
      } else {
        notify(json.error ?? "Erreur de l'IA.", "error");
      }
    } catch {
      notify("Erreur de l'IA.", "error");
    }
    setAiLoading(false);
  }

  function aiRefine() {
    setAiProposal(null);
    post({ type: "sg:css", css: "" });
  }

  function aiRetry() {
    setAiProposal(null);
    post({ type: "sg:css", css: "" });
    void askAi();
  }

  async function aiCommit() {
    if (!aiProposal) return;
    dictation.stop();
    setAiLoading(true);
    try {
      const res = await fetch("/api/site/ai/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, css: aiProposal.css }),
      });
      const json = await res.json();
      if (res.status === 409) {
        notify(json.error ?? "Solde insuffisant.", "error");
      } else if (!res.ok) {
        notify(json.error ?? "Échec de la validation.", "error");
      } else {
        if (typeof json.balance === "number") setBalance(json.balance);
        setAiProposal(null);
        setAiDraft(null);
        notify("Modification appliquée", "success");
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl(currentPageIndex, true);
        }
      }
    } catch {
      notify("Échec de la validation.", "error");
    }
    setAiLoading(false);
  }

  async function doPublish() {
    setConfirmPublish(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await flushSave();
    setPublishing(true);
    try {
      const res = await fetch("/api/site/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const json = await res.json();
      if (res.status === 409) {
        notify(json.error ?? "Solde insuffisant.", "error");
      } else if (!res.ok) {
        notify(json.error ?? "Échec de la publication.", "error");
      } else {
        if (typeof json.balance === "number") setBalance(json.balance);
        setHasUnpub(false);
        changesRef.current = {};
        setSaveState("idle");
        notify("Votre site est à jour", "success");
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl(currentPageIndex, true);
        }
      }
    } catch {
      notify("Échec de la publication.", "error");
    }
    setPublishing(false);
  }

  return (
    <div className="cloud-bg relative flex h-[100dvh] flex-col">
      {/* Barre du haut — minimale */}
      <header className="z-20 flex flex-none items-center justify-between gap-2 px-3 py-2.5 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button href="/dashboard" variant="ghost" size="sm">
            <span className="inline-flex rotate-180">
              <IconChevron size={16} />
            </span>
            <span className="hidden sm:inline">Quitter</span>
          </Button>

          {/* Sélecteur de page — visible seulement pour un site multi-pages (v2).
              Change la page éditée et recharge l'aperçu sur ?path=<slug>. */}
          {pages.length > 1 && (
            <label className="flex min-w-0 items-center">
              <span className="sr-only">Page à modifier</span>
              <select
                className="max-w-[44vw] truncate rounded-lg border border-white/60 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-night shadow-cloud outline-none focus:border-[#2563eb] sm:max-w-[220px]"
                value={currentPageIndex}
                onChange={(e) => void changePage(Number(e.target.value))}
                aria-label="Page à modifier"
              >
                {pages.map((p, i) => (
                  <option key={p.slug ?? i} value={i}>
                    {p.title ?? p.slug}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Aperçu responsive */}
        <div className="gem-dev hidden sm:flex" role="group" aria-label="Aperçu responsive">
          <button type="button" aria-label="Ordinateur" data-on={device === "desktop"} onClick={() => setDevice("desktop")}>
            <IconDesktop size={17} />
          </button>
          <button type="button" aria-label="Tablette" data-on={device === "tablet"} onClick={() => setDevice("tablet")}>
            <IconTablet size={17} />
          </button>
          <button type="button" aria-label="Téléphone" data-on={device === "mobile"} onClick={() => setDevice("mobile")}>
            <IconPhone size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveState === "saving" && (
            <span className="hidden items-center text-mist sm:inline-flex" title="Enregistrement…">
              <Spinner size={13} />
            </span>
          )}
          {saveState === "saved" && (
            <span className="hidden items-center text-success sm:inline-flex" title="Enregistré">
              <IconCheck size={14} />
            </span>
          )}
          <span className="gem-stars" title={`${balance} crédits disponibles`}>
            <IconStar4 size={14} className="text-[#9b72cb]" /> {balance}
          </span>
          <Button
            size="sm"
            loading={publishing}
            disabled={!hasUnpub || publishing}
            onClick={() => setConfirmPublish(true)}
          >
            Publier
          </Button>
        </div>
      </header>

      {/* Aperçu — cadre « appareil » */}
      <main className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden px-2 pb-24 md:px-6">
        <div
          className="relative h-full overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-cloud transition-[width,max-width] duration-300 ease-out"
          style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl(0)}
            title="Éditeur de votre site"
            className="h-full w-full border-0"
          />
          {tool === "note" && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
              <IconPin size={14} /> Touchez l&apos;endroit à retoucher
            </div>
          )}
          {tool === "edit" && !touched && !panel && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
              Touchez un texte ou une photo pour le modifier
            </div>
          )}
        </div>
      </main>

      {/* Dock du bas — Modifier / Sélectionner (liquid glass) */}
      {!aiProposal && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="gem-dock pointer-events-auto" style={{ width: "min(420px, 100%)" }}>
            <div className="gem-distort" style={{ filter: 'url("#radio-glass")' }} aria-hidden />
            <span
              className="gem-thumb"
              aria-hidden
              style={{ left: tool === "note" ? "50%" : "4px", width: "calc(50% - 4px)" }}
            />
            <button type="button" data-on={tool === "edit"} onClick={() => switchTool("edit")}>
              <IconEdit size={16} style={{ color: tool === "edit" ? "#2563eb" : undefined }} />
              Modifier
            </button>
            <button type="button" data-on={tool === "note"} onClick={() => switchTool("note")}>
              <IconPin size={16} style={{ color: tool === "note" ? "#9b72cb" : undefined }} />
              <span className={tool === "note" ? "gem-text" : undefined}>Sélectionner</span>
            </button>
          </div>
        </div>
      )}
      <GlassFilter />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {/* Notifications — au-dessus de TOUT (z-100), donc visibles par-dessus le flou de la modale IA */}
      <AnimatePresence>
        {notice && (
          <motion.div
            key="notice"
            className="pointer-events-none fixed inset-x-0 top-16 z-[100] flex justify-center px-3"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
          >
            <div
              className={`sg-toast sg-toast--${notice.kind} pointer-events-auto`}
              role={notice.kind === "error" ? "alert" : "status"}
              aria-live={notice.kind === "error" ? "assertive" : "polite"}
            >
              <span className="sg-toast__icon" aria-hidden>
                {notice.kind === "success" ? (
                  <IconCheck size={16} />
                ) : notice.kind === "error" ? (
                  <IconAlert size={16} />
                ) : (
                  <Spinner size={15} />
                )}
              </span>
              <span className="sg-toast__msg">{notice.msg}</span>
              <button
                className="sg-toast__close"
                onClick={() => notify("")}
                aria-label="Fermer la notification"
              >
                <IconClose size={15} />
              </button>
              {notice.kind !== "info" && !reduce && (
                <motion.span
                  key={notice.id}
                  className="sg-toast__bar"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: NOTICE_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Édition de texte « composé » (popover) */}
      {panel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
          onClick={() => setPanel(null)}
        >
          <div
            className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-cloud-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 font-archivo text-lg font-semibold text-night">Modifier le texte</h3>
            <Field
              label={panel.label}
              hint={panel.maxLen ? `${panel.value.length} / ${panel.maxLen}` : undefined}
            >
              {panel.type === "text" ? (
                <Input
                  autoFocus
                  value={panel.value}
                  maxLength={panel.maxLen ?? undefined}
                  onChange={(e) => setPanel((p) => (p ? { ...p, value: e.target.value } : p))}
                />
              ) : (
                <Textarea
                  autoFocus
                  rows={4}
                  value={panel.value}
                  maxLength={panel.maxLen ?? undefined}
                  onChange={(e) => setPanel((p) => (p ? { ...p, value: e.target.value } : p))}
                />
              )}
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)}>
                Annuler
              </Button>
              <Button size="sm" onClick={savePanel}>
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Choix d'une photo : téléverser ou piocher dans la bibliothèque */}
      {photoPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
          onClick={() => setPhotoPicker(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[20px] bg-white p-6 shadow-cloud-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-archivo text-lg font-semibold text-night">Changer la photo</h3>
              <Button size="sm" onClick={pickUpload}>
                Téléverser une photo
              </Button>
            </div>
            <p className="mb-3 text-sm text-slate">Ou choisissez dans votre bibliothèque :</p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {libPhotos === null ? (
                <div className="grid place-items-center py-10 text-mist">
                  <Spinner size={22} />
                </div>
              ) : libPhotos.length === 0 ? (
                <p className="py-10 text-center text-sm text-mist">
                  Votre bibliothèque est vide. Téléversez une première photo.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {libPhotos.map((ph) => (
                    <button
                      key={ph.path}
                      type="button"
                      onClick={() => pickFromLibrary(ph.url)}
                      className="overflow-hidden rounded-xl border border-sky-300 transition hover:ring-2 hover:ring-brand"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ph.url}
                        alt={ph.name}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPhotoPicker(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Demande à l'IA — saisie / génération (modal animé) */}
      <AnimatePresence>
        {aiDraft && !aiProposal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeAi}
          >
            <motion.div
              className="w-full max-w-[460px]"
              role="dialog"
              aria-modal="true"
              aria-label="Demander une modification à l'IA"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait" initial={false}>
                {aiLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="sgai-card flex flex-col items-center gap-2 py-3 text-center"
                  >
                    <div className="sgai-orb-wrap">
                      <div className="sgai-orb-glow" />
                      <div className="sgai-orb" />
                    </div>
                    <h3 className="sgai-ink font-archivo text-[17px] font-extrabold">Génération en cours…</h3>
                    <p className="sgai-soft max-w-[300px] text-sm">Quelques secondes.</p>
                    <div className="sgai-prog mt-3">
                      <i />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="sgai-shell">
                      <div className="sgai-promptbox">
                        <textarea
                          ref={setAiInput}
                          autoFocus
                          rows={1}
                          className="sgai-input"
                          value={aiDraft.message}
                          placeholder={dictation.listening ? "À l'écoute…" : "Décrivez le changement…"}
                          onChange={(e) => setAiDraft((d) => (d ? { ...d, message: e.target.value } : d))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && aiDraft.message.trim()) {
                              e.preventDefault();
                              void askAi();
                            }
                          }}
                        />
                        <div className="sgai-promptbar">
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
                          <AnimatePresence>
                            {aiDraft.message.trim() && (
                              <motion.button
                                key="send"
                                type="button"
                                className="sgai-send ml-auto"
                                onClick={askAi}
                                aria-label="Envoyer"
                                title="Envoyer"
                                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                              >
                                <IconArrowUp size={18} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    <span className="sr-only" aria-live="polite">
                      {dictation.listening ? "Dictée en cours, parlez maintenant." : ""}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proposition de l'IA — barre flottante (pas de voile → le site reste visible pour prévisualiser) */}
      <AnimatePresence>
        {aiProposal && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            <div
              className="sgai-card pointer-events-auto w-full max-w-[600px]"
              style={{ padding: "12px 14px" }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="sgai-badge flex-none">✦ Aperçu</span>
                <p className="line-clamp-2 min-w-[160px] flex-1 text-[13px] leading-snug sgai-soft">
                  {aiProposal.explanation}
                </p>
                <div className="flex flex-none items-center gap-1.5">
                  <button className="sgai-cancel text-sm" onClick={closeAi}>
                    Annuler
                  </button>
                  <button className="sgai-ghost text-sm" onClick={aiRetry} aria-label="Réessayer" title="Réessayer">
                    ↻
                  </button>
                  <button className="sgai-ghost text-sm" onClick={aiRefine}>
                    Affiner
                  </button>
                  <button
                    className="sgai-primary flex items-center gap-1.5 text-sm"
                    disabled={balance < 1 || aiLoading}
                    onClick={aiCommit}
                  >
                    {aiLoading && <Spinner size={14} />}
                    Accepter{" "}
                    <span className="rounded-lg bg-white/25 px-1.5 py-0.5 text-[11px] font-extrabold">1 ✦</span>
                  </button>
                </div>
              </div>
              {balance < 1 && (
                <p className="mt-1.5 text-[12px] text-[#c0392b]">
                  Solde insuffisant —{" "}
                  <a className="underline" href="/dashboard/credits">
                    achetez des étoiles
                  </a>
                  .
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation de publication */}
      {confirmPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
          onClick={() => setConfirmPublish(false)}
        >
          <div
            className="w-full max-w-md rounded-[20px] bg-white p-6 text-center shadow-cloud-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-archivo text-lg font-semibold text-night">Publier vos modifications ?</h3>
            <p className="mt-2 text-sm text-slate">
              Cela utilise <b>1 ✦</b>. Solde après : <b>{Math.max(0, balance - 1)} ✦</b>.
            </p>
            {balance < 1 && (
              <p className="mt-2 text-sm text-danger">
                Solde insuffisant —{" "}
                <a className="underline" href="/dashboard/credits">
                  achetez des étoiles
                </a>
                .
              </p>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmPublish(false)}>
                Annuler
              </Button>
              <Button size="sm" disabled={balance < 1} onClick={doPublish}>
                Publier maintenant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
