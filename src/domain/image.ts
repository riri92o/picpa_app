import type {
  PhotoAsset,
  PhotoPlacement,
  GridCount,
  CollageSpacing,
} from "./types";
import { getCropGeometry } from "./crop";

function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.86,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("画像を変換できませんでした")),
      type,
      quality,
    ),
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
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasBlob(canvas, "image/jpeg", quality);
}
export async function preparePhoto(file: File): Promise<PhotoAsset> {
  if (!file.type.startsWith("image/"))
    throw new Error("画像ファイルを選んでください");
  const image = await createImageBitmap(file);
  try {
    return {
      id: crypto.randomUUID(),
      full: await resize(image, 1800, 0.88),
      thumb: await resize(image, 360, 0.78),
      width: image.width,
      height: image.height,
      createdAt: new Date().toISOString(),
    };
  } finally {
    image.close();
  }
}
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
export function gridDimensions(count: GridCount): [number, number] {
  return count === 9 ? [3, 3] : count === 4 ? [2, 2] : [2, 3];
}
export async function exportCollage(
  count: GridCount,
  photos: PhotoPlacement[],
  getBlob: (id: string) => Promise<Blob | undefined>,
  color: string,
  logo: boolean,
  spacing: CollageSpacing = "separated",
): Promise<Blob> {
  const [cols, rows] = gridDimensions(count);
  const canvas = document.createElement("canvas");
  const cellWidth = count === 9 ? 340 : 510;
  const cellHeight = count === 9 ? 340 : count === 4 ? 455 : 408;
  const gap = spacing === "joined" ? 0 : 7;
  const collageWidth = cols * cellWidth + (cols - 1) * gap;
  const collageHeight = rows * cellHeight + (rows - 1) * gap;
  const left = 86,
    top = 42,
    right = 42,
    bottom = 42;
  canvas.width = left + collageWidth + right;
  canvas.height = top + collageHeight + bottom;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < photos.length; i++) {
    const blob = await getBlob(photos[i].id);
    if (!blob) continue;
    const image = await createImageBitmap(blob);
    try {
      drawPlacement(
        ctx,
        image,
        image.width,
        image.height,
        photos[i],
        left + (i % cols) * (cellWidth + gap),
        top + Math.floor(i / cols) * (cellHeight + gap),
        cellWidth,
        cellHeight,
      );
    } finally {
      image.close();
    }
  }
  if (logo) {
    ctx.save();
    ctx.translate(34, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = color;
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PicPa", 0, 0);
    ctx.restore();
  }
  return canvasBlob(canvas, "image/jpeg", 0.92);
}
