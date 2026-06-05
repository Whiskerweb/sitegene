"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

export type Panel = {
  path: string;
  label: string;
  type: string;
  maxLen: number | null;
  value: string;
};

type Props = {
  panel: Panel;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

/** Modale d'édition de texte « composé » (champ non-feuille du runtime). */
export default function TextPanel({ panel, onChange, onCancel, onSave }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
      onClick={onCancel}
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
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <Textarea
              autoFocus
              rows={4}
              value={panel.value}
              maxLength={panel.maxLen ?? undefined}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" onClick={onSave}>
            Appliquer
          </Button>
        </div>
      </div>
    </div>
  );
}
