import type { PhotoPlacement } from "./types";
import { getCropGeometry } from "./crop";
import { filterPhotoPixels, resolvePhotoFilter } from "./photoFilter";

/** The same crop is used for editing, photo-only scoring, and every export style. */
export function drawPlacement(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  p: PhotoPlacement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const filter = resolvePhotoFilter(p.filter);
  if (filter === "none") {
    drawCrop(ctx, image, sourceWidth, sourceHeight, p, x, y, width, height);
    return;
  }
  // Filter just this cropped photo. Never read/rewrite the destination, whose
  // clip may be circular and whose background, frame and logo must stay intact.
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  try {
    const brush = canvas.getContext("2d", { willReadFrequently: true });
    if (!brush) throw new Error("写真のフィルターを準備できませんでした");
    brush.scale(canvas.width / width, canvas.height / height);
    drawCrop(brush, image, sourceWidth, sourceHeight, p, 0, 0, width, height);
    const pixels = brush.getImageData(0, 0, canvas.width, canvas.height);
    filterPhotoPixels(pixels.data, filter);
    brush.putImageData(pixels, 0, 0);
    ctx.drawImage(canvas, x, y, width, height);
  } finally {
    canvas.width = canvas.height = 0;
  }
}

function drawCrop(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  p: PhotoPlacement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  const crop = getCropGeometry(width, height, sourceWidth, sourceHeight, p);
  ctx.translate(x + width / 2 + crop.panX, y + height / 2 + crop.panY);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.drawImage(
    image,
    -crop.imageWidth / 2,
    -crop.imageHeight / 2,
    crop.imageWidth,
    crop.imageHeight,
  );
  ctx.restore();
}
