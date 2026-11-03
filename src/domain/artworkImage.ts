import { waitForImageTask } from "./imageTask";

export interface ArtworkImage {
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement;
  release: () => void;
  usedElement: boolean;
}

/** Keep the normal bitmap pixels; use the browser's image element decoder if
 * bitmap decoding is unavailable, rejects, or stalls (including native AbortError). */
export async function loadArtworkImage(
  blob: Blob,
  maxSide: number,
  signal?: AbortSignal,
  preferElement = false,
): Promise<ArtworkImage> {
  if (!preferElement && typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await waitForImageTask(
        createImageBitmap(blob),
        signal,
        3500,
        (late) => late.close(),
      );
      if (Math.max(bitmap.width, bitmap.height) > maxSide) {
        const ratio = maxSide / Math.max(bitmap.width, bitmap.height);
        try {
          const scaled = await waitForImageTask(
            createImageBitmap(bitmap, {
              resizeWidth: Math.round(bitmap.width * ratio),
              resizeHeight: Math.round(bitmap.height * ratio),
              resizeQuality: "high",
            }),
            signal,
            3500,
            (late) => late.close(),
          );
          bitmap.close();
          bitmap = scaled;
        } catch (error) {
          if (signal?.aborted) throw error;
          // Older WebViews may omit bitmap resize options; the source still renders.
        }
      }
      const source = bitmap;
      return { source, release: () => source.close(), usedElement: false };
    } catch (error) {
      bitmap?.close();
      if (signal?.aborted) throw error;
    }
  }
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
  const image = new Image();
  const url = URL.createObjectURL(blob);
  const release = () => {
    image.onload = image.onerror = null;
    image.removeAttribute("src");
    URL.revokeObjectURL(url);
  };
  let resized: HTMLCanvasElement | undefined;
  try {
    image.decoding = "async";
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("写真を読み込めませんでした"));
      image.src = url;
    });
    await waitForImageTask(loaded, signal);
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("写真を読み込めませんでした");
    image.width = image.naturalWidth;
    image.height = image.naturalHeight;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    if (ratio === 1) return { source: image, release, usedElement: true };
    resized = document.createElement("canvas");
    resized.width = Math.round(image.width * ratio);
    resized.height = Math.round(image.height * ratio);
    const brush = resized.getContext("2d");
    if (!brush) throw new Error("画像を準備できませんでした");
    brush.imageSmoothingQuality = "high";
    brush.drawImage(image, 0, 0, resized.width, resized.height);
    release();
    const source = resized;
    return {
      source,
      release: () => {
        source.width = source.height = 0;
      },
      usedElement: true,
    };
  } catch (error) {
    release();
    if (resized) resized.width = resized.height = 0;
    throw error;
  }
}
