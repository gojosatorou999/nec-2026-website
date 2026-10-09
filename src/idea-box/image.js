/* Client-side image shrinking for uploads.

   A logo or product photo straight from a phone is routinely 1–2 MB, and it is
   sent as base64 (+33%) inside the JSON body — on mobile data that upload, not
   the server, is what makes submitting feel slow. Logos and product shots are
   displayed at a few hundred pixels, so they are resized before upload. The
   server still validates type, signature and size independently. */

const READ_AS = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File could not be read.'));
    reader.readAsDataURL(blob);
  });

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This image could not be opened.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Returns a { name, data } data-URL object, shrunk when that makes it smaller.
 * Falls back to the untouched file if anything goes wrong.
 */
export async function prepareImage(file, { maxDim = 800 } = {}) {
  const original = { name: file.name, data: null };
  try {
    // Small files aren't worth re-encoding (and PNG line-art stays pixel-exact).
    if (file.size <= 120 * 1024) return { ...original, data: await READ_AS(file) };

    const bitmap = await decode(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // JPEG stays JPEG (no alpha to lose). Everything else tries WebP, which
    // keeps transparency; browsers that can't encode WebP (Safari) hand back
    // PNG instead, which is also fine at this size.
    const blob =
      file.type === 'image/jpeg'
        ? await toBlob(canvas, 'image/jpeg', 0.86)
        : (await toBlob(canvas, 'image/webp', 0.88)) || (await toBlob(canvas, 'image/png'));

    if (!blob || blob.size >= file.size) return { ...original, data: await READ_AS(file) };
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
    return { name: file.name.replace(/\.[^.]+$/, '') + '.' + ext, data: await READ_AS(blob) };
  } catch {
    // Couldn't shrink it — send the original, if the server will accept its size.
    if (file.size > 2 * 1024 * 1024) throw new Error('This image is too large. Choose one under 2 MB.');
    return { ...original, data: await READ_AS(file) };
  }
}

export const readFile = async (file) => ({ name: file.name, data: await READ_AS(file) });
