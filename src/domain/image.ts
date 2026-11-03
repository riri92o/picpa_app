import type {
  PhotoAsset,
  PhotoPlacement,
  GridCount,
  CollageSpacing,
  ArtworkStyle,
  PhotoQuality,
} from "./types";
import {
  PHOTO_QUALITY_OPTIONS,
  resolvePhotoQuality,
} from "../constants/photoQuality";
import { ARTWORK_STYLES } from "../constants/artwork";
import { artworkLayout, resolveArtworkStyle } from "./artworkLayout";
import { drawArtwork, type ArtworkPhoto } from "./artworkCanvas";
import { drawPlacement } from "./photoCanvas";
import { photoPalette } from "./photoPalette";
import { loadArtworkImage } from "./artworkImage";
import { waitForImageTask } from "./imageTask";
export { drawPlacement } from "./photoCanvas";
export { gridDimensions } from "./collageLayout";

function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.86,
  signal?: AbortSignal,
): Promise<Blob> {
  return waitForImageTask(
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("画像を変換できませんでした")),
        type,
        quality,
      ),
    ),
    signal,
  );
}
async function resize(
  image: ImageBitmap,
  maxSide: number,
  quality: number,
): Promise<Blob> {
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を準備できませんでした");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasBlob(canvas, "image/jpeg", quality);
  } finally {
    canvas.width = canvas.height = 0;
  }
}
export async function preparePhoto(
  file: File,
  photoQuality: PhotoQuality = "standard",
): Promise<PhotoAsset> {
  if (!file.type.startsWith("image/"))
    throw new Error("画像ファイルを選んでください");
  const image = await createImageBitmap(file);
  const quality = PHOTO_QUALITY_OPTIONS.find(
    (option) => option.id === resolvePhotoQuality(photoQuality),
  )!;
  try {
    return {
      id: crypto.randomUUID(),
      // Preserve crop resolution; reduce storage through JPEG quality instead.
      // Applies only at import, never recompressing existing stored photographs.
      full: await resize(image, 1800, quality.fullQuality),
      thumb: await resize(image, 360, quality.thumbQuality),
      width: image.width,
      height: image.height,
      createdAt: new Date().toISOString(),
    };
  } finally {
    image.close();
  }
}
export interface ArtworkExportOptions {
  style?: ArtworkStyle;
  date?: string;
  colorLabel?: string;
  signal?: AbortSignal;
}
const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
};

async function readArtworkBlob(
  id: string,
  getBlob: (id: string) => Promise<Blob | undefined>,
  signal?: AbortSignal,
) {
  try {
    return await waitForImageTask(getBlob(id), signal);
  } catch (error) {
    // Retry an aborted read once. It is independent of our own view cleanup.
    if (!signal?.aborted && (error as Error).name === "AbortError")
      return waitForImageTask(getBlob(id), signal);
    throw error;
  }
}

async function loadArtworkPhotos(
  count: GridCount,
  placements: PhotoPlacement[],
  getBlob: (id: string) => Promise<Blob | undefined>,
  signal?: AbortSignal,
) {
  if (placements.length !== count) throw new Error("写真が揃っていません");
  const photos: ArtworkPhoto[] = [];
  const releases: (() => void)[] = [];
  let preferElement = false;
  const sample = document.createElement("canvas");
  sample.width = 64;
  sample.height = Math.round(
    64 * (count === 9 ? 1 : count === 4 ? 455 / 510 : 408 / 510),
  );
  const ctx = sample.getContext("2d", { willReadFrequently: true })!;
  try {
    for (const placement of placements) {
      checkAbort(signal);
      const blob = await readArtworkBlob(placement.id, getBlob, signal);
      if (!blob) throw new Error("写真を読み込めませんでした");
      // Keep only the resolution needed for a 1200px collage and the chosen crop.
      const maxSide = Math.min(
        1800,
        Math.ceil(900 * Math.max(1, placement.zoom)),
      );
      const decoded = await loadArtworkImage(
        blob,
        maxSide,
        signal,
        preferElement,
      );
      preferElement ||= decoded.usedElement;
      releases.push(decoded.release);
      const image = decoded.source;
      ctx.clearRect(0, 0, sample.width, sample.height);
      drawPlacement(
        ctx,
        image,
        image.width,
        image.height,
        placement,
        0,
        0,
        sample.width,
        sample.height,
      );
      photos.push({
        image,
        placement,
        swatches: photoPalette(
          ctx.getImageData(0, 0, sample.width, sample.height).data,
        ),
      });
    }
    checkAbort(signal);
    return { photos, release: () => releases.forEach((release) => release()) };
  } catch (error) {
    releases.forEach((release) => release());
    throw error;
  } finally {
    sample.width = 0;
    sample.height = 0;
  }
}

async function renderArtworkStyles(
  count: GridCount,
  placements: PhotoPlacement[],
  getBlob: (id: string) => Promise<Blob | undefined>,
  color: string,
  logo: boolean,
  spacing: CollageSpacing,
  styles: ArtworkStyle[],
  options: ArtworkExportOptions,
) {
  const loaded = await loadArtworkPhotos(
    count,
    placements,
    getBlob,
    options.signal,
  );
  const { photos } = loaded;
  const canvas = document.createElement("canvas");
  const result: Partial<Record<ArtworkStyle, Blob>> = {};
  try {
    for (const style of styles) {
      checkAbort(options.signal);
      const layout = artworkLayout(count, spacing, style, logo);
      canvas.width = layout.width;
      canvas.height = layout.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("画像を準備できませんでした");
      await waitForImageTask(
        drawArtwork(
          context,
          count,
          spacing,
          style,
          photos,
          color,
          options.colorLabel ?? "",
          options.date ?? "",
          logo,
        ),
        options.signal,
      );
      checkAbort(options.signal);
      result[style] = await canvasBlob(
        canvas,
        style === "bubble-window" ? "image/png" : "image/jpeg",
        0.94,
        options.signal,
      );
      // Yield between complete designs, keeping mobile selection and close controls responsive.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    return result;
  } finally {
    loaded.release();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Decode each photo once, then cache the exact final images for instant switching. */
export async function exportCollageVariants(
  count: GridCount,
  photos: PhotoPlacement[],
  getBlob: (id: string) => Promise<Blob | undefined>,
  color: string,
  logo: boolean,
  spacing: CollageSpacing = "separated",
  options: ArtworkExportOptions = {},
) {
  return renderArtworkStyles(
    count,
    photos,
    getBlob,
    color,
    logo,
    spacing,
    ARTWORK_STYLES.map(({ id }) => id),
    options,
  ) as Promise<Record<ArtworkStyle, Blob>>;
}

export async function exportCollage(
  count: GridCount,
  photos: PhotoPlacement[],
  getBlob: (id: string) => Promise<Blob | undefined>,
  color: string,
  logo: boolean,
  spacing: CollageSpacing = "separated",
  options: ArtworkExportOptions = {},
): Promise<Blob> {
  const style = resolveArtworkStyle(options.style);
  const variants = await renderArtworkStyles(
    count,
    photos,
    getBlob,
    color,
    logo,
    spacing,
    [style],
    options,
  );
  return variants[style]!;
}
