"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  IconAlert,
  IconCheck,
  IconChevron,
  IconClose,
  IconDesktop,
  IconPhone,
  IconStar4,
  IconTablet,
} from "@/components/ui/icons";
import { getAtPath, setAtPath } from "@/lib/content-path";
import { normalizeContent, type SiteContentV2 } from "@/lib/site-content";
import { useDictation } from "@/lib/use-dictation";
import type { PinSelector } from "@/lib/notes-selector";
import {
  appendMessage,
  rowsToThread,
  settleProposal,
  type AiMessageRow,
  type ChatMessage,
} from "@/lib/chat-thread";
import ChatPanel, { type Composer } from "./components/ChatPanel";
import PreviewFrame, { type Device } from "./components/PreviewFrame";
import TextPanel, { type Panel } from "./components/TextPanel";
import PhotoPicker, { type LibPhoto } from "./components/PhotoPicker";

export type EditableField = {
  path: string;
  label: string;
  type: string;
  maxLen: number | null;
};

/** Effet acheté (boutique Formules), affiché dans la galerie composants. */
export type OwnedEffect = {
  id: string;
  name: string;
  accentFrom: string;
  accentTo: string;
  compatible: boolean;
};

/** Brouillon d'intégration renvoyé par /api/site/ai (mode composant). */
type ComponentDraft = {
  effectId: string;
  selector: string;
  position: "replace" | "before" | "after" | "inside";
  config?: Record<string, unknown>;
};

type Props = {
  siteId: string;
  slug: string | null;
  balance: number;
  hasUnpublished: boolean;
  editableFields: EditableField[];
  content: Record<string, unknown>;
  ownedEffects: OwnedEffect[];
  integrateEffectId: string | null;
  initialMessages: AiMessageRow[];
};

type SaveState = "idle" | "saving" | "saved" | "error";
type NoticeKind = "info" | "success" | "error";
type Notice = { msg: string; kind: NoticeKind; id: number } | null;
const NOTICE_MS = 4500;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function EditorClient({
  siteId,
  balance: initialBalance,
  hasUnpublished: initialHasUnpub,
  editableFields,
  content,
  ownedEffects,
  integrateEffectId,
  initialMessages,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Normalize once at mount — content structure (pages) never changes during an editing session.
  const [initialContent] = useState<SiteContentV2>(() => normalizeContent(structuredClone(content)));
  const contentRef = useRef<SiteContentV2>(initialContent);
  const changesRef = useRef<Record<string, unknown>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeSeq = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPhoto = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastRequest = useRef<{
    text: string;
    target: PinSelector | null;
    effect: OwnedEffect | null;
  } | null>(null);

  const pages = initialContent.pages;
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

  // Mode « intégration d'un effet » : la sélection vise alors la SECTION.
  const [integrating, setIntegrating] = useState<OwnedEffect | null>(
    () => ownedEffects.find((e) => e.id === integrateEffectId) ?? null,
  );
  const integratingRef = useRef<OwnedEffect | null>(integrating);

  const [tool, setTool] = useState<"edit" | "note">(integrateEffectId ? "note" : "edit");

  // --- Fil de chat (façon Lovable) ---------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>(() => rowsToThread(initialMessages));
  const [composer, setComposer] = useState<Composer>(() => {
    const fx = ownedEffects.find((e) => e.id === integrateEffectId) ?? null;
    return {
      text: fx ? "Intègre ce composant à la place de la section désignée." : "",
      target: null,
      effect: fx,
    };
  });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // bottom sheet mobile
  const [isDesktop, setIsDesktop] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  // Proposition ACTIVE (la seule actionnable) — miroir du dernier message proposal "active".
  const [aiProposal, setAiProposal] = useState<
    | { id: string; kind: "css"; css: string; explanation: string }
    | { id: string; kind: "component"; component: ComponentDraft; explanation: string }
    | null
  >(null);

  const [photoPicker, setPhotoPicker] = useState<{ path: string } | null>(null);
  const [libPhotos, setLibPhotos] = useState<LibPhoto[] | null>(null);
  const reduce = useReducedMotion();

  // Desktop vs mobile : un SEUL ChatPanel monté (sinon le ref du composer entre en conflit).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Notifications : message typé (info / succès / erreur).
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

  // Dictée vocale : le texte reconnu s'ajoute à la fin du composer.
  const dictation = useDictation((chunk) =>
    setComposer((c) => ({ ...c, text: c.text ? `${c.text} ${chunk}` : chunk })),
  );

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

  // Échap ferme la galerie composants.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalleryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    changesRef.current = {};
    try {
      const res = await fetch("/api/site/draft", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, changes: snapshot, pageIndex: currentPageIndex }),
      });
      if (!res.ok) {
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
      contentRef.current = setAtPath(contentRef.current, currentPageIndex, path, value);
      scheduleSave();
    },
    [scheduleSave, currentPageIndex],
  );

  const post = useCallback((msg: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  const previewUrl = useCallback(
    (pageIndex: number, bust = false, component?: ComponentDraft | null) => {
      const slug = pages[pageIndex]?.slug ?? "/";
      const params = new URLSearchParams({ siteId, edit: "1" });
      if (slug && slug !== "/") params.set("path", slug);
      if (bust) params.set("t", String(Date.now()));
      if (component) params.set("previewComponent", JSON.stringify(component));
      return `/api/preview?${params.toString()}`;
    },
    [pages, siteId],
  );

  const postMode = useCallback(
    (t: "edit" | "note") => {
      post({
        type: "sg:mode",
        mode: t,
        scope: integratingRef.current ? "section" : "element",
      });
    },
    [post],
  );

  const switchTool = useCallback(
    (t: "edit" | "note") => {
      setTool(t);
      if (t === "edit") {
        setIntegrating(null); // quitter le mode intégration
        setComposer((c) => (c.effect ? { ...c, effect: null } : c));
      }
      postMode(t);
    },
    [postMode],
  );

  // Synchronise le ref + re-pousse le scope (élément vs section) à chaque
  // changement du mode intégration — postMessage est idempotent côté runtime.
  useEffect(() => {
    integratingRef.current = integrating;
    postMode(tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrating]);

  const changePage = useCallback(
    async (idx: number) => {
      if (idx === currentPageIndex || !pages[idx]) return;
      if (Object.keys(changesRef.current).length > 0) {
        await flushSave();
      }
      setCurrentPageIndex(idx);
      // La cible appartenait à l'ancienne page : on purge la chip.
      setComposer((c) => (c.target ? { ...c, target: null } : c));
      if (iframeRef.current) iframeRef.current.src = previewUrl(idx);
    },
    [currentPageIndex, pages, previewUrl, flushSave],
  );

  // Messages venant de l'iframe (runtime d'édition).
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data || {};
      if (d.type === "sg:ready") {
        postMode(tool);
        return;
      }
      if (d.type === "sg:editText") {
        if (d.leaf) {
          recordChange(d.path, String(d.value ?? ""));
        } else {
          const spec = specFor(d.path);
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
        setLibPhotos(null);
        setPhotoPicker({ path: d.path });
      } else if (d.type === "sg:note") {
        // Mode « Cibler » : le clic attache une chip cible au composer.
        const t = d.target;
        if (t && typeof t.cssSelector === "string") {
          setComposer((c) => ({
            ...c,
            target: {
              path: t.path,
              cssSelector: t.cssSelector,
              label: t.label ?? "",
              xPct: t.xPct,
              yPct: t.yPct,
            },
          }));
          setSheetOpen(true); // mobile : rouvre le chat avec la chip
          setTimeout(() => composerRef.current?.focus(), 50);
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [recordChange, specFor, postMode, tool, currentPageIndex]);

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

  function pickFromLibrary(url: string) {
    if (!photoPicker) return;
    post({ type: "sg:setPhoto", path: photoPicker.path, url });
    recordChange(photoPicker.path, url);
    notify("Photo mise à jour", "success");
    setPhotoPicker(null);
  }

  function pickUpload() {
    if (!photoPicker) return;
    pendingPhoto.current = photoPicker.path;
    setPhotoPicker(null);
    fileRef.current?.click();
  }

  /** Purge l'aperçu en cours : CSS live (style#sg-ai) ou composant éphémère (reload). */
  const clearPreview = useCallback(
    (proposal: typeof aiProposal) => {
      if (proposal?.kind === "component") {
        if (iframeRef.current) iframeRef.current.src = previewUrl(currentPageIndex, true);
      } else {
        post({ type: "sg:css", css: "" });
      }
    },
    [post, previewUrl, currentPageIndex],
  );

  // --- Actions du chat ----------------------------------------------------

  const sendRequest = useCallback(
    async (text: string, target: PinSelector | null, effect: OwnedEffect | null) => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/site/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            siteId,
            message: text,
            target,
            ...(effect ? { effectId: effect.id } : {}),
          }),
        });
        const json = await res.json();
        if (json.ok && json.action === "css") {
          post({ type: "sg:css", css: json.css });
          const id = crypto.randomUUID();
          const explanation = json.explanation ?? "Modification appliquée.";
          setAiProposal({ id, kind: "css", css: json.css, explanation });
          setMessages((m) =>
            appendMessage(m, {
              id,
              role: "assistant",
              kind: "proposal",
              action: "css",
              explanation,
              status: "active",
            }),
          );
        } else if (json.ok && json.action === "component" && json.componentDraft) {
          if (iframeRef.current) {
            iframeRef.current.src = previewUrl(currentPageIndex, true, json.componentDraft);
          }
          const id = crypto.randomUUID();
          const explanation = json.explanation ?? "Composant intégré.";
          setAiProposal({ id, kind: "component", component: json.componentDraft, explanation });
          setMessages((m) =>
            appendMessage(m, {
              id,
              role: "assistant",
              kind: "proposal",
              action: "component",
              explanation,
              status: "active",
            }),
          );
        } else if (json.action === "unsupported") {
          setMessages((m) =>
            appendMessage(m, {
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "text",
              text: `L'IA ne peut pas le faire : ${json.reason ?? "demande trop large"}.`,
              isError: true,
            }),
          );
        } else {
          setMessages((m) =>
            appendMessage(m, {
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "text",
              text: json.error ?? "Erreur de l'IA.",
              isError: true,
            }),
          );
        }
      } catch {
        setMessages((m) =>
          appendMessage(m, {
            id: crypto.randomUUID(),
            role: "assistant",
            kind: "text",
            text: "Erreur de l'IA.",
            isError: true,
          }),
        );
      }
      setAiLoading(false);
    },
    [siteId, post, previewUrl, currentPageIndex],
  );

  function askAi() {
    const text = composer.text.trim();
    if (!text || aiLoading) return;
    dictation.stop();
    setGalleryOpen(false);
    // Une nouvelle demande invalide la proposition en cours (aperçu compris).
    if (aiProposal) {
      clearPreview(aiProposal);
      setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
      setAiProposal(null);
    }
    lastRequest.current = { text, target: composer.target, effect: composer.effect };
    setMessages((m) =>
      appendMessage(m, {
        id: crypto.randomUUID(),
        role: "user",
        text,
        ...(composer.target?.label ? { targetLabel: composer.target.label } : {}),
        ...(composer.effect ? { effectName: composer.effect.name } : {}),
      }),
    );
    setComposer((c) => ({ ...c, text: "" }));
    void sendRequest(text, composer.target, composer.effect);
  }

  function retryLast() {
    const r = lastRequest.current;
    if (!r || aiLoading) return;
    void sendRequest(r.text, r.target, r.effect);
  }

  function refineProposal() {
    if (!aiProposal) return;
    clearPreview(aiProposal);
    setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
    setAiProposal(null);
    composerRef.current?.focus();
  }

  function cancelProposal() {
    if (!aiProposal) return;
    clearPreview(aiProposal);
    setMessages((m) => settleProposal(m, aiProposal.id, "expired"));
    setAiProposal(null);
    setComposer((c) => ({ ...c, target: null, effect: null }));
    setIntegrating(null);
  }

  async function aiCommit() {
    if (!aiProposal) return;
    dictation.stop();
    setAiLoading(true);
    try {
      const res = await fetch("/api/site/ai/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          aiProposal.kind === "component"
            ? { siteId, component: aiProposal.component }
            : { siteId, css: aiProposal.css },
        ),
      });
      const json = await res.json();
      if (res.status === 409) {
        notify(json.error ?? "Solde insuffisant.", "error");
      } else if (!res.ok) {
        notify(json.error ?? "Échec de la validation.", "error");
      } else {
        if (typeof json.balance === "number") setBalance(json.balance);
        if (json.published === false) setHasUnpub(true);
        const wasComponent = aiProposal.kind === "component";
        setMessages((m) => settleProposal(m, aiProposal.id, "accepted"));
        setAiProposal(null);
        setComposer((c) => ({ ...c, target: null, effect: null }));
        setIntegrating(null);
        if (tool === "note") switchTool("edit");
        notify(wasComponent ? "Composant intégré à votre site" : "Modification appliquée", "success");
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl(currentPageIndex, true);
        }
      }
    } catch {
      notify("Échec de la validation.", "error");
    }
    setAiLoading(false);
  }

  function toggleSelect() {
    const next = tool === "note" ? "edit" : "note";
    switchTool(next);
    if (next === "note") setSheetOpen(false); // mobile : laisser voir l'aperçu pour cibler
  }

  function pickEffect(fx: OwnedEffect) {
    setGalleryOpen(false);
    setComposer((c) => ({
      ...c,
      effect: fx,
      text: c.text.trim() ? c.text : "Intègre ce composant à la place de la section désignée.",
    }));
    setIntegrating(fx);
    if (tool !== "note") switchTool("note");
    setSheetOpen(false); // mobile : place à l'aperçu pour choisir la section
  }

  function removeEffect() {
    setComposer((c) => ({ ...c, effect: null }));
    setIntegrating(null);
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

  const chatPanel = (
    <ChatPanel
      messages={messages}
      composer={composer}
      selecting={tool === "note"}
      aiLoading={aiLoading}
      balance={balance}
      galleryOpen={galleryOpen}
      ownedEffects={ownedEffects}
      dictation={dictation}
      inputRef={composerRef}
      onText={(t) => setComposer((c) => ({ ...c, text: t }))}
      onSend={askAi}
      onToggleSelect={toggleSelect}
      onRemoveTarget={() => setComposer((c) => ({ ...c, target: null }))}
      onRemoveEffect={removeEffect}
      onToggleGallery={() => setGalleryOpen((v) => !v)}
      onPickEffect={pickEffect}
      onAccept={() => void aiCommit()}
      onRefine={refineProposal}
      onCancelProposal={cancelProposal}
      onRetry={retryLast}
    />
  );

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

      {/* Corps : chat à gauche (desktop) + aperçu à droite */}
      <div className="flex min-h-0 flex-1">
        {isDesktop && (
          <aside className="flex min-h-0 w-[400px] flex-none flex-col">{chatPanel}</aside>
        )}
        <main className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden px-2 pb-3 md:px-4">
          <PreviewFrame
            iframeRef={iframeRef}
            initialSrc={previewUrl(0)}
            device={device}
            tool={tool}
            integratingName={integrating?.name ?? null}
            showEditHint={!touched && !panel}
            onSwitchTool={switchTool}
          />
        </main>
      </div>

      {/* Mobile : bulle d'ouverture + bottom sheet */}
      {!isDesktop && (
        <>
          {!sheetOpen && (
            <button
              type="button"
              className="fixed bottom-4 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-night text-white shadow-cloud-lg"
              onClick={() => setSheetOpen(true)}
              aria-label="Ouvrir l'assistant"
            >
              <IconStar4 size={20} />
            </button>
          )}
          <div
            className={`fixed inset-x-0 bottom-0 z-40 flex h-[62dvh] flex-col rounded-t-[24px] border-t border-white/70 bg-white/95 shadow-cloud-lg backdrop-blur transition-transform duration-300 ${
              sheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-label="Assistant IA"
          >
            <button
              type="button"
              className="mx-auto mt-2 h-1.5 w-12 flex-none rounded-full bg-night/15"
              onClick={() => setSheetOpen(false)}
              aria-label="Fermer l'assistant"
            />
            <div className="min-h-0 flex-1">{chatPanel}</div>
          </div>
        </>
      )}

      <GlassFilter />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {/* Notifications — au-dessus de tout */}
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

      {/* Édition de texte « composé » */}
      {panel && (
        <TextPanel
          panel={panel}
          onChange={(value) => setPanel((p) => (p ? { ...p, value } : p))}
          onCancel={() => setPanel(null)}
          onSave={savePanel}
        />
      )}

      {/* Choix d'une photo */}
      {photoPicker && (
        <PhotoPicker
          photos={libPhotos}
          onUpload={pickUpload}
          onPick={pickFromLibrary}
          onClose={() => setPhotoPicker(null)}
        />
      )}

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
            <h3 className="font-archivo text-lg font-semibold text-night">
              Publier vos modifications ?
            </h3>
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
