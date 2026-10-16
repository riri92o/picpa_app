import { artworkLayout, type ArtworkRect } from "./artworkLayout";
import { drawCollageLogo } from "./branding";
import { drawPlacement } from "./photoCanvas";
import { waterOpacity, waterTint } from "./waterMaterial";
import { BUBBLE_FRAME, WATER_MATERIAL } from "../constants/artwork";
import type {
  ArtworkStyle,
  CollageSpacing,
  GridCount,
  PhotoPlacement,
} from "./types";
import { contrastRatio, mixHex, vividAccent } from "../ui/theme";

export interface ArtworkPhoto {
  image: ImageBitmap;
  placement: PhotoPlacement;
  swatches: [string, string, string];
}
type Layout = ReturnType<typeof artworkLayout>;
const NIGHT = "#061322";
const TAU = Math.PI * 2;

/** Matching rounded squares keep the photo sizes equal and the rim soft. */
export function bubbleWindowPath(rect: ArtworkRect) {
  const path = new Path2D();
  path.roundRect(
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    Math.min(rect.width, rect.height) * BUBBLE_FRAME.cornerRatio,
  );
  return path;
}

/** A continuous rounded outer edge, with no scallops between windows. */
function bubbleOutline(layout: Layout) {
  const path = new Path2D();
  const inset = BUBBLE_FRAME.outerInset;
  const radius =
    Math.min(layout.cellWidth, layout.cellHeight) * BUBBLE_FRAME.cornerRatio +
    layout.pad -
    inset;
  path.roundRect(
    inset,
    inset,
    layout.width - inset * 2,
    layout.height - inset * 2,
    radius,
  );
  return path;
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: ArtworkPhoto,
  rect: ArtworkRect,
) {
  drawPlacement(
    ctx,
    photo.image,
    photo.image.width,
    photo.image.height,
    photo.placement,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
}

function drawBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.save();
  const g = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.42,
    radius * 0.05,
    x,
    y,
    radius,
  );
  g.addColorStop(0, mixHex(color, "#ffffff", 0.48));
  g.addColorStop(0.35, color);
  g.addColorStop(0.77, mixHex(color, NIGHT, 0.52));
  g.addColorStop(0.94, mixHex(color, "#ffe3bc", 0.62));
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.shadowColor = "#00000042";
  ctx.shadowBlur = radius * 0.15;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = mixHex(color, "#ffffff", 0.55);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = "#ffffffed";
  ctx.lineWidth = radius * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.76, Math.PI * 1.12, Math.PI * 1.41);
  ctx.stroke();
  ctx.strokeStyle = "#ffffff65";
  ctx.lineWidth = radius * 0.045;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.84, Math.PI * 0.12, Math.PI * 0.39);
  ctx.stroke();
  ctx.restore();
}

/** Shade a single raised liquid surface, including the broad connected necks.
 * A half-resolution distance field keeps this local canvas pass small on phones. */
function drawLiquidWater(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  outline: Path2D,
  color: string,
) {
  const scale = 0.5;
  const mask = document.createElement("canvas");
  mask.width = Math.ceil(layout.width * scale);
  mask.height = Math.ceil(layout.height * scale);
  const m = mask.getContext("2d", { willReadFrequently: true })!;
  m.scale(scale, scale);
  m.fillStyle = "#ffffff";
  m.fill(outline);
  m.globalCompositeOperation = "destination-out";
  layout.slots.forEach((rect) => m.fill(bubbleWindowPath(rect)));
  m.resetTransform();
  const pixels = m.getImageData(0, 0, mask.width, mask.height);
  const { width: w, height: h } = mask;
  const field = new Float32Array(w * h);
  for (let i = 0; i < field.length; i++)
    field[i] = pixels.data[i * 4 + 3] >= 128 ? 10000 : 0;
  const diagonal = Math.SQRT2;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (field[i])
        field[i] = Math.min(
          field[i],
          field[i - 1] + 1,
          field[i - w] + 1,
          field[i - w - 1] + diagonal,
          field[i - w + 1] + diagonal,
        );
    }
  for (let y = h - 2; y > 0; y--)
    for (let x = w - 2; x > 0; x--) {
      const i = y * w + x;
      if (field[i])
        field[i] = Math.min(
          field[i],
          field[i + 1] + 1,
          field[i + w] + 1,
          field[i + w + 1] + diagonal,
          field[i + w - 1] + diagonal,
        );
    }
  // Smooth both quantized distance steps and central ridges before lighting.
  const horizontal = new Float32Array(w * h);
  const smooth = new Float32Array(w * h);
  const radius = WATER_MATERIAL.blurRadius;
  const weights = Array.from({ length: radius * 2 + 1 }, (_, i) =>
    Math.exp(-((i - radius) ** 2) / (2 * WATER_MATERIAL.blurSigma ** 2)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  for (let y = 0; y < h; y++)
    for (let x = radius; x < w - radius; x++) {
      const i = y * w + x;
      for (let tap = -radius; tap <= radius; tap++)
        horizontal[i] += (field[i + tap] * weights[tap + radius]) / total;
    }
  for (let y = radius; y < h - radius; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      for (let tap = -radius; tap <= radius; tap++)
        smooth[i] += (horizontal[i + tap * w] * weights[tap + radius]) / total;
    }
  const base = waterTint(color);
  const heightAt = (d: number) => 30 * (1 - Math.exp(-d / 17));
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x,
        p = i * 4;
      if (!field[i]) {
        pixels.data[p + 3] = 0;
        continue;
      }
      const nx = -(heightAt(smooth[i + 1]) - heightAt(smooth[i - 1])) / 2;
      const ny = -(heightAt(smooth[i + w]) - heightAt(smooth[i - w])) / 2;
      const length = Math.hypot(nx, ny, 1);
      const diffuse = Math.max(0, (-nx * 0.46 - ny * 0.63 + 0.625) / length);
      const specular =
        Math.max(0, (-nx * 0.255 - ny * 0.35 + 0.901) / length) ** 20;
      const sheen =
        Math.max(0, (-nx * 0.255 - ny * 0.35 + 0.901) / length) ** 6;
      const shade = 0.86 + diffuse * 0.14;
      for (let c = 0; c < 3; c++)
        pixels.data[p + c] = Math.min(
          255,
          base[c] * shade + 255 * specular * 0.18,
        );
      pixels.data[p + 3] = Math.round(
        pixels.data[p + 3] * waterOpacity(field[i], specular, sheen),
      );
    }
  m.putImageData(pixels, 0, 0);
  ctx.drawImage(mask, 0, 0, mask.width / scale, mask.height / scale);
  mask.width = 0;
  mask.height = 0;
}

function drawBubbleFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  photos: ArtworkPhoto[],
  color: string,
) {
  const contour = bubbleOutline(layout);
  drawLiquidWater(ctx, layout, contour, color);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const edge = ctx.createLinearGradient(0, 0, layout.width, layout.height);
  edge.addColorStop(0, `${mixHex(color, "#ffffff", 0.42)}b8`);
  edge.addColorStop(0.4, `${color}88`);
  edge.addColorStop(0.72, `${mixHex(color, "#ffffff", 0.22)}50`);
  edge.addColorStop(1, `${color}99`);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke(contour);
  ctx.restore();
  layout.slots.forEach((rect, index) => {
    const path = bubbleWindowPath(rect);
    ctx.save();
    ctx.clip(path);
    drawPhoto(ctx, photos[index], rect);
    ctx.restore();
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = `${mixHex(color, NIGHT, 0.12)}40`;
    ctx.lineWidth = 4;
    ctx.stroke(path);
    const reflection = ctx.createLinearGradient(
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
    );
    reflection.addColorStop(0, `${mixHex(color, "#ffffff", 0.5)}b0`);
    reflection.addColorStop(0.24, `${mixHex(color, "#ffffff", 0.3)}88`);
    reflection.addColorStop(0.5, "#ffffff10");
    reflection.addColorStop(0.78, `${mixHex(color, "#ffffff", 0.4)}78`);
    reflection.addColorStop(1, `${color}66`);
    ctx.strokeStyle = reflection;
    ctx.lineWidth = 2.4;
    ctx.stroke(path);
    ctx.restore();
  });
}

function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  spacing: number,
  maxWidth: number,
  align: "left" | "center" = "left",
) {
  ctx.save();
  ctx.font = `${size}px Georgia, "Times New Roman", serif`;
  let width = [...text].reduce(
    (sum, letter) => sum + ctx.measureText(letter).width + spacing,
    -spacing,
  );
  if (width > maxWidth) {
    size *= maxWidth / width;
    spacing *= maxWidth / width;
    ctx.font = `${size}px Georgia, "Times New Roman", serif`;
    width = maxWidth;
  }
  let cursor = align === "center" ? x - width / 2 : x;
  for (const letter of text) {
    ctx.fillText(letter, cursor, y);
    cursor += ctx.measureText(letter).width + spacing;
  }
  ctx.restore();
}

async function drawFooter(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  style: ArtworkStyle,
  color: string,
  label: string,
  date: string,
  logo: boolean,
  photos: ArtworkPhoto[],
) {
  const { footer } = layout;
  const dateLabel = date.replaceAll("-", ".");
  const textWidth = logo ? 780 : 960;
  if (
    style === "bubble-window" ||
    style === "black-frame" ||
    style === "white-frame"
  ) {
    if (logo)
      await drawCollageLogo(
        ctx,
        layout.logo,
        0,
        0,
        style === "white-frame" ? NIGHT : undefined,
      );
    return;
  } else {
    const base = vividAccent(color);
    const gradient = ctx.createLinearGradient(
      0,
      footer.y,
      layout.width,
      layout.height,
    );
    gradient.addColorStop(0, base);
    gradient.addColorStop(0.65, mixHex(base, NIGHT, 0.06));
    gradient.addColorStop(1, mixHex(base, NIGHT, logo ? 0.62 : 0.08));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, footer.y, layout.width, footer.height);
    const ink = contrastRatio(NIGHT, base) >= 4.5 ? NIGHT : "#fff6e9";
    ctx.fillStyle = ink;
    if (style === "specimen") {
      drawBead(ctx, 104, footer.y + 78, 51, base);
      trackedText(ctx, label, 204, footer.y + 67, 31, 6, textWidth - 190);
      trackedText(ctx, dateLabel, 207, footer.y + 112, 23, 5, textWidth - 190);
    } else {
      for (let i = 0; i < 4; i++) {
        const photo = photos[Math.round((i * (photos.length - 1)) / 3)];
        drawBead(ctx, 82 + i * 100, footer.y + 77, 40, photo.swatches[1]);
      }
      trackedText(ctx, label, 500, footer.y + 67, 28, 4, logo ? 480 : 640);
      trackedText(ctx, dateLabel, 502, footer.y + 110, 22, 4, logo ? 480 : 640);
    }
  }
  if (logo) await drawCollageLogo(ctx, layout.logo, 0, 0);
}

/** Shared final pixels for confirmation, completion, archive, download and sharing. */
export async function drawArtwork(
  ctx: CanvasRenderingContext2D,
  count: GridCount,
  spacing: CollageSpacing,
  style: ArtworkStyle,
  photos: ArtworkPhoto[],
  color: string,
  colorLabel: string,
  date: string,
  logo: boolean,
) {
  const layout = artworkLayout(count, spacing, style, logo);
  ctx.clearRect(0, 0, layout.width, layout.height);
  if (style !== "bubble-window") {
    ctx.fillStyle =
      style === "white-frame"
        ? "#ffffff"
        : style === "black-frame"
          ? "#000000"
          : style === "palette"
            ? vividAccent(color)
            : NIGHT;
    ctx.fillRect(0, 0, layout.width, layout.height);
  }
  if (style === "bubble-window") drawBubbleFrame(ctx, layout, photos, color);
  else {
    layout.slots.forEach((rect, index) => {
      const photo = photos[index];
      ctx.save();
      if (style === "palette") {
        ctx.beginPath();
        ctx.roundRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height + layout.stripHeight,
          Math.min(26, rect.width * 0.05),
        );
        ctx.clip();
      }
      drawPhoto(ctx, photo, rect);
      if (style === "palette") {
        photo.swatches.forEach((swatch, i) => {
          ctx.fillStyle = swatch;
          ctx.fillRect(
            rect.x + (i * rect.width) / 3,
            rect.y + rect.height,
            rect.width / 3 + 0.5,
            layout.stripHeight,
          );
        });
        ctx.strokeStyle = "#ffffff40";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y + rect.height);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
  await drawFooter(ctx, layout, style, color, colorLabel, date, logo, photos);
}
