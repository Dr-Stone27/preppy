/**
 * Shrinks a screenshot before it's sent to the recipe reader: phone screenshots are 1–4 MB,
 * and the caption is readable at 1600px on the long side as a JPEG.
 */
export type Shot = { mime: "image/jpeg"; data: string; preview: string };

const LONG_SIDE = 1600;

export async function shrink(file: File): Promise<Shot> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const preview = canvas.toDataURL("image/jpeg", 0.8);
  return { mime: "image/jpeg", data: preview.slice(preview.indexOf(",") + 1), preview };
}
