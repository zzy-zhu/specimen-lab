/* Downscale a dataURL image to a small square-ish JPEG so specimen
   headshots stay tiny in the Realtime Database (~10-20KB). */
export function downscaleImage(dataURL, max = 240, quality = 0.72) {
  return new Promise((resolve) => {
    if (!dataURL) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(c.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataURL);
      }
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
}
