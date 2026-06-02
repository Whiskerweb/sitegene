/**
 * Compression d'image côté client (canvas) avant upload. Les fonctions
 * serverless Vercel plafonnent le body à ~4,5 Mo : sans compression, quelques
 * photos de smartphone (souvent 3–8 Mo chacune) font échouer la requête en 413
 * (« Request Entity Too Large »). On redimensionne à `maxDim` px et on réencode
 * en JPEG `quality`. Si quoi que ce soit échoue, on renvoie le fichier d'origine.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file; // pas de gain → garder l'original

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Compresse une liste de photos en parallèle. */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)));
}
