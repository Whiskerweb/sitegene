// lib/client/compress-image.ts
// Compression d'image CÔTÉ NAVIGATEUR avant upload (tunnel /creer & éditeur) :
// les photos de téléphone font 4-12 Mo ; on les ramène à ~200-600 Ko sans perte
// visible (max 1920px, WebP q0.82, repli JPEG). Best-effort : en cas d'échec
// (format exotique, canvas indisponible), le fichier original est renvoyé.

const MAX_DIM = 1920;
const QUALITY = 0.82;
const SKIP_UNDER_BYTES = 600 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  if (file.size < SKIP_UNDER_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = (await toBlob(canvas, "image/webp", QUALITY)) ?? (await toBlob(canvas, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;
    return new File([blob], name, { type: blob.type });
  } catch {
    return file;
  }
}
