import { useEffect, useState } from "react";
import type { DayRecord } from "../domain/types";
import type { ImageUrls } from "../state/AppContext";
import { drawPlacement } from "../domain/photoCanvas";
import { photoPalette } from "../domain/photoPalette";
import { waitForImageTask } from "../domain/imageTask";

type Colors = [string, string, string];
const cache = new Map<string, Colors>();

/** Read small, already available thumbnails. Never decode originals or delay export. */
async function samplePalette(
  day: DayRecord,
  images: Record<string, ImageUrls>,
  signal: AbortSignal,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = Math.round(
    64 * (day.count === 9 ? 1 : day.count === 4 ? 455 / 510 : 408 / 510),
  );
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Palette unavailable");
  const buffers: Uint8ClampedArray[] = [];
  try {
    for (const placement of day.photos) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const src = images[placement.id]?.thumb;
      if (!src) throw new Error("Thumbnail unavailable");
      const image = new Image();
      image.decoding = "async";
      try {
        await waitForImageTask(
          new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Thumbnail unavailable"));
            image.src = src;
          }),
          signal,
          4000,
        );
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlacement(
          ctx,
          image,
          image.naturalWidth,
          image.naturalHeight,
          placement,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        buffers.push(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      } finally {
        image.onload = image.onerror = null;
        image.removeAttribute("src");
      }
    }
    const pixels = new Uint8ClampedArray(
      buffers.reduce((sum, b) => sum + b.length, 0),
    );
    let offset = 0;
    for (const b of buffers) {
      pixels.set(b, offset);
      offset += b.length;
    }
    return photoPalette(pixels);
  } finally {
    canvas.width = canvas.height = 0;
  }
}

export function useArtworkPalette(
  day: DayRecord,
  images: Record<string, ImageUrls>,
) {
  const key = JSON.stringify([
    day.count,
    day.photos.map((p) => [p, images[p.id]?.thumb]),
  ]);
  const [state, setState] = useState<{ key: string; colors: Colors | null }>({
    key: "",
    colors: null,
  });
  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      cache.delete(key);
      cache.set(key, cached);
      setState({ key, colors: cached });
      return;
    }
    const controller = new AbortController();
    void samplePalette(day, images, controller.signal)
      .then((colors) => {
        if (controller.signal.aborted) return;
        if (cache.size >= 16) cache.delete(cache.keys().next().value!);
        cache.set(key, colors);
        setState({ key, colors });
      })
      .catch(() => {
        // Decorative only: unreadable/missing thumbnails retain the daily-color wash.
        if (!controller.signal.aborted) setState({ key, colors: null });
      });
    return () => controller.abort();
    // Keys include every source URL and photo edit; style/memo changes reuse the colors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.colors : null;
}
