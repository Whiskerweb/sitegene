"use client";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export type LibPhoto = { path: string; url: string; name: string };

type Props = {
  photos: LibPhoto[] | null; // null = chargement en cours
  onUpload: () => void;
  onPick: (url: string) => void;
  onClose: () => void;
};

/** Choix d'une photo : téléverser ou piocher dans la bibliothèque du site. */
export default function PhotoPicker({ photos, onUpload, onPick, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[20px] bg-white p-6 shadow-cloud-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-archivo text-lg font-semibold text-night">Changer la photo</h3>
          <Button size="sm" onClick={onUpload}>
            Téléverser une photo
          </Button>
        </div>
        <p className="mb-3 text-sm text-slate">Ou choisissez dans votre bibliothèque :</p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {photos === null ? (
            <div className="grid place-items-center py-10 text-mist">
              <Spinner size={22} />
            </div>
          ) : photos.length === 0 ? (
            <p className="py-10 text-center text-sm text-mist">
              Votre bibliothèque est vide. Téléversez une première photo.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((ph) => (
                <button
                  key={ph.path}
                  type="button"
                  onClick={() => onPick(ph.url)}
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
