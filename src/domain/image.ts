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

function blendHex(hex: string, target: number, amount: number) {
  const match = /^#([\da-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = Number.parseInt(match[1], 16);
  const channels = [16, 8, 0].map((shift) =>
    Math.round(((value >> shift) & 255) * (1 - amount) + target * amount),
  );
  return `rgb(${channels.join(",")})`;
}

function visibleFrameColor(color: string) {
  const match = /^#([\da-f]{6})$/i.exec(color);
  if (!match) return color;
  const value = Number.parseInt(match[1], 16);
  const channels = [16, 8, 0].map((shift) => (value >> shift) & 255);
  const average = channels.reduce((sum, channel) => sum + channel, 0) / 3;
  const spread = Math.max(...channels) - Math.min(...channels);
  if (average > 235 && spread < 20) return "#8994ad";
  if (average < 30 && spread < 20) return "#59657d";
  return color;
}

/** Layered metallic edge, drawn outside the photos and their crop area. */
function drawColorFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  const radius = 18;
  const edge = 16;
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, blendHex(color, 0, 0.58));
  gradient.addColorStop(0.09, blendHex(color, 255, 0.86));
  gradient.addColorStop(0.21, color);
  gradient.addColorStop(0.32, blendHex(color, 255, 0.92));
  gradient.addColorStop(0.47, blendHex(color, 0, 0.56));
  gradient.addColorStop(0.61, blendHex(color, 255, 0.7));
  gradient.addColorStop(0.76, color);
  gradient.addColorStop(0.88, blendHex(color, 255, 0.96));
  gradient.addColorStop(1, blendHex(color, 0, 0.54));
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.shadowColor = blendHex(color, 255, 0.1);
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = blendHex(color, 255, 0.74);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "#ffffffdc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, width - 6, height - 6, radius - 3);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(
    x + edge,
    y + edge,
    width - edge * 2,
    height - edge * 2,
    radius - edge,
  );
  ctx.fill();
  ctx.strokeStyle = blendHex(color, 0, 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawFrameGlints(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  const glints: [number, number, number][] = [
    [0.15, 0, 8],
    [0.88, 0, 5],
    [1, 0.32, 7],
    [0, 0.71, 5],
    [0.7, 1, 8],
  ];
  ctx.save();
  for (const [px, py, size] of glints) {
    const centerX = x + width * px;
    const centerY = y + height * py;
    const halo = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      size * 4,
    );
    halo.addColorStop(0, "#ffffff");
    halo.addColorStop(0.16, blendHex(color, 255, 0.7));
    halo.addColorStop(1, "#ffffff00");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(centerX - size * 1.7, centerY);
    ctx.lineTo(centerX + size * 1.7, centerY);
    ctx.moveTo(centerX, centerY - size * 1.7);
    ctx.lineTo(centerX, centerY + size * 1.7);
    ctx.stroke();
  }
  ctx.restore();
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
  // Keep only a small neutral margin around the artwork; the app's night-sky
  // background is intentionally excluded from exported images.
  const left = logo ? 76 : 24,
    top = 24,
    right = 24,
    bottom = 24;
  canvas.width = left + collageWidth + right;
  canvas.height = top + collageHeight + bottom;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const frameColor = visibleFrameColor(color);
  drawColorFrame(
    ctx,
    left - 16,
    top - 16,
    collageWidth + 32,
    collageHeight + 32,
    frameColor,
  );
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
  drawFrameGlints(
    ctx,
    left - 16,
    top - 16,
    collageWidth + 32,
    collageHeight + 32,
    frameColor,
  );
  if (logo) {
    ctx.save();
    ctx.translate(30, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = frameColor;
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PicPa", 0, 0);
    ctx.restore();
  }
  return canvasBlob(canvas, "image/jpeg", 0.92);
}
