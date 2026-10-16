import type { PhotoPlacement } from "./types";
import { getCropGeometry } from "./crop";

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
