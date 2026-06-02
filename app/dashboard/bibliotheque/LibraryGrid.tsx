"use client";

import { useRef, useState } from "react";
import { compressImages } from "@/lib/compress-image";
import type { SitePhoto } from "@/lib/site-photos";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { IconPlus, IconPhoto, IconClose, IconAlert } from "@/components/ui/icons";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function LibraryGrid({
  siteId,
  initialPhotos,
  usedUrls,
}: {
  siteId: string;
  initialPhotos: SitePhoto[];
  usedUrls: string[];
}) {
  const [photos, setPhotos] = useState<SitePhoto[]>(initialPhotos);
  const [used] = useState(() => new Set(usedUrls));
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<SitePhoto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImages(files);
      for (const file of compressed) {
        const fd = new FormData();
        fd.set("siteId", siteId);
        fd.set("file", file);
        const res = await fetch("/api/site/photo", { method: "POST", body: fd });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.url) {
          setError(json?.error ?? "Échec de l'envoi d'une photo.");
          continue;
        }
        const path: string = json.path ?? json.url.split("/site-photos/")[1] ?? "";
        const next: SitePhoto = {
          path,
          url: json.url,
          name: path.split("/").pop() ?? "photo",
          bytes: null,
          createdAt: null,
        };
        setPhotos((p) => [next, ...p]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function remove(photo: SitePhoto, force = false) {
    setError(null);
    setDeleting(photo.path);
    try {
      const res = await fetch("/api/site/photo/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, path: photo.path, force }),
      });
      if (res.status === 409) {
        setConfirm(photo); // utilisée → demande confirmation
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Échec de la suppression.");
        return;
      }
      setPhotos((p) => p.filter((x) => x.path !== photo.path));
      used.delete(photo.url);
      setConfirm(null);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Zone d'ajout / dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-brand bg-blue" : "border-sky-300 bg-surface-2"
        }`}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blue text-brand">
          {uploading ? <Spinner size={22} /> : <IconPhoto size={22} />}
        </div>
        <div>
          <p className="font-archivo text-base font-semibold text-night">
            {uploading ? "Envoi en cours…" : "Glissez vos photos ici"}
          </p>
          <p className="mt-1 text-sm text-slate">JPG, PNG ou WebP — jusqu'à 8 Mo chacune.</p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <IconPlus size={16} />
          Ajouter des photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-[#fde8e8] px-4 py-2.5 text-sm text-danger">
          <IconAlert size={16} />
          {error}
        </p>
      )}

      {/* Grille des photos */}
      {photos.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist">
          Aucune photo pour l'instant. Ajoutez-en pour les utiliser sur votre site.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => {
            const isUsed = used.has(photo.url);
            const isDeleting = deleting === photo.path;
            return (
              <div
                key={photo.path}
                className="group relative overflow-hidden rounded-2xl border border-sky-300 bg-surface-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                {isUsed && (
                  <span className="absolute left-2 top-2">
                    <Badge tone="brand">Utilisée</Badge>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void remove(photo)}
                  disabled={isDeleting}
                  aria-label="Supprimer la photo"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-danger shadow-cloud-sm transition-opacity hover:bg-white disabled:opacity-50 group-hover:opacity-100 sm:opacity-0"
                >
                  {isDeleting ? <Spinner size={14} /> : <IconClose size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'avertissement : photo utilisée sur le site */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-4">
          <div className="w-full max-w-[420px] rounded-[22px] border border-sky-300 bg-white p-6 text-center shadow-cloud">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#fdf0d5] text-warn">
              <IconAlert size={24} />
            </div>
            <h3 className="font-archivo text-lg font-semibold text-night">
              Cette photo est utilisée
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Elle apparaît sur votre site. En la supprimant, l'emplacement restera vide
              jusqu'à ce que vous le remplaciez dans l'éditeur.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                loading={deleting === confirm.path}
                onClick={() => void remove(confirm, true)}
              >
                Supprimer quand même
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
