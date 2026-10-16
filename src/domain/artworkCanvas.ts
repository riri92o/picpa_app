import { artworkLayout, type ArtworkRect } from "./artworkLayout";
import { drawCollageLogo } from "./branding";
import { drawPlacement } from "./photoCanvas";
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

/** Different flowing contours for every window; the photographs themselves stay undistorted. */
export function bubbleWindowPath(rect: ArtworkRect, index: number) {
  const path = new Path2D();
  const x = (n: number) => rect.x + rect.width * (index % 2 ? 1 - n : n);
  const y = (n: number) => rect.y + rect.height * n;
  const shapes = [
    [
      [0.48, 0.03],
      [0.72, 0.005, 0.95, 0.07, 0.96, 0.31],
      [0.98, 0.48, 0.86, 0.48, 0.93, 0.66],
      [0.99, 0.85, 0.79, 0.99, 0.53, 0.96],
      [0.33, 0.94, 0.1, 0.995, 0.055, 0.77],
      [0.015, 0.57, 0.1, 0.51, 0.045, 0.34],
      [0.005, 0.16, 0.23, 0.01, 0.48, 0.03],
    ],
    [
      [0.56, 0.025],
      [0.86, 0.005, 0.97, 0.18, 0.91, 0.4],
      [0.85, 0.58, 0.99, 0.61, 0.96, 0.78],
      [0.9, 0.98, 0.64, 0.95, 0.42, 0.98],
      [0.16, 0.995, 0.005, 0.82, 0.04, 0.6],
      [0.08, 0.41, 0.015, 0.37, 0.09, 0.22],
      [0.17, 0.06, 0.36, 0.03, 0.56, 0.025],
    ],
    [
      [0.52, 0.06],
      [0.82, 0.005, 0.99, 0.12, 0.96, 0.39],
      [0.92, 0.64, 0.99, 0.83, 0.76, 0.92],
      [0.56, 0.995, 0.48, 0.88, 0.31, 0.94],
      [0.11, 0.99, 0.02, 0.78, 0.03, 0.55],
      [0.04, 0.38, 0.18, 0.38, 0.12, 0.22],
      [0.09, 0.06, 0.31, 0.08, 0.52, 0.06],
    ],
    [
      [0.45, 0.025],
      [0.68, 0.03, 0.98, 0.02, 0.97, 0.31],
      [0.96, 0.51, 0.84, 0.56, 0.92, 0.73],
      [0.98, 0.96, 0.7, 0.995, 0.49, 0.95],
      [0.3, 0.9, 0.2, 0.99, 0.08, 0.83],
      [0.005, 0.62, 0.08, 0.52, 0.04, 0.35],
      [0.005, 0.14, 0.22, 0.005, 0.45, 0.025],
    ],
  ];
  const [start, ...curves] = shapes[index % shapes.length];
  path.moveTo(x(start[0]), y(start[1]));
  for (const p of curves)
    path.bezierCurveTo(x(p[0]), y(p[1]), x(p[2]), y(p[3]), x(p[4]), y(p[5]));
  path.closePath();
  return path;
}

/** The outside follows the differently sized perimeter windows, with soft liquid necks. */
function bubbleOutline(layout: Layout) {
  const { slots, columns, rows } = layout;
  const path = new Path2D();
  const left = 14,
    right = layout.width - 14,
    top = 14,
    bottom = layout.height - 16;
  const topSlots = slots.slice(0, columns);
  const bottomSlots = slots.slice(-columns).reverse();
  const rightSlots = Array.from(
    { length: rows },
    (_, row) => slots[row * columns + columns - 1],
  );
  const leftSlots = Array.from(
    { length: rows },
    (_, row) => slots[(rows - row - 1) * columns],
  );
  const cx = (r: ArtworkRect) => r.x + r.width / 2;
  const cy = (r: ArtworkRect) => r.y + r.height / 2;
  path.moveTo(cx(topSlots[0]), top);
  topSlots.slice(0, -1).forEach((r, i) => {
    const next = topSlots[i + 1];
    const mid = (r.x + r.width + next.x) / 2,
      neck = Math.min(r.height, next.height) * 0.11;
    path.bezierCurveTo(
      cx(r) + r.width * 0.28,
      top,
      mid - r.width * 0.12,
      top + neck,
      mid,
      top + neck,
    );
    path.bezierCurveTo(
      mid + next.width * 0.12,
      top + neck,
      cx(next) - next.width * 0.28,
      top,
      cx(next),
      top,
    );
  });
  path.bezierCurveTo(
    right,
    top,
    right,
    cy(rightSlots[0]) - rightSlots[0].height * 0.28,
    right,
    cy(rightSlots[0]),
  );
  rightSlots.slice(0, -1).forEach((r, i) => {
    const next = rightSlots[i + 1];
    const mid = (r.y + r.height + next.y) / 2,
      neck = Math.min(r.width, next.width) * 0.12;
    path.bezierCurveTo(
      right,
      cy(r) + r.height * 0.28,
      right - neck,
      mid - r.height * 0.12,
      right - neck,
      mid,
    );
    path.bezierCurveTo(
      right - neck,
      mid + next.height * 0.12,
      right,
      cy(next) - next.height * 0.28,
      right,
      cy(next),
    );
  });
  path.bezierCurveTo(
    right,
    bottom,
    cx(bottomSlots[0]) + bottomSlots[0].width * 0.28,
    bottom,
    cx(bottomSlots[0]),
    bottom,
  );
  bottomSlots.slice(0, -1).forEach((r, i) => {
    const next = bottomSlots[i + 1];
    const mid = (next.x + next.width + r.x) / 2,
      neck = Math.min(r.height, next.height) * 0.11;
    path.bezierCurveTo(
      cx(r) - r.width * 0.28,
      bottom,
      mid + r.width * 0.12,
      bottom - neck,
      mid,
      bottom - neck,
    );
    path.bezierCurveTo(
      mid - next.width * 0.12,
      bottom - neck,
      cx(next) + next.width * 0.28,
      bottom,
      cx(next),
      bottom,
    );
  });
  path.bezierCurveTo(
    left,
    bottom,
    left,
    cy(leftSlots[0]) + leftSlots[0].height * 0.28,
    left,
    cy(leftSlots[0]),
  );
  leftSlots.slice(0, -1).forEach((r, i) => {
    const next = leftSlots[i + 1];
    const mid = (next.y + next.height + r.y) / 2,
      neck = Math.min(r.width, next.width) * 0.12;
    path.bezierCurveTo(
      left,
      cy(r) - r.height * 0.28,
      left + neck,
      mid + r.height * 0.12,
      left + neck,
      mid,
    );
    path.bezierCurveTo(
      left + neck,
      mid - next.height * 0.12,
      left,
      cy(next) + next.height * 0.28,
      left,
      cy(next),
    );
  });
  path.bezierCurveTo(
    left,
    top,
    cx(topSlots[0]) - topSlots[0].width * 0.28,
    top,
    cx(topSlots[0]),
    top,
  );
  path.closePath();
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
  layout.slots.forEach((rect, i) => m.fill(bubbleWindowPath(rect, i)));
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
  // Smooth the distance gradients before lighting; discrete chamfer steps must
  // not turn into visible ribs in a glossy material.
  const horizontal = new Float32Array(w * h);
  const smooth = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x;
      horizontal[i] =
        (field[i - 2] +
          4 * field[i - 1] +
          6 * field[i] +
          4 * field[i + 1] +
          field[i + 2]) /
        16;
    }
  for (let y = 2; y < h - 2; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      smooth[i] =
        (horizontal[i - 2 * w] +
          4 * horizontal[i - w] +
          6 * horizontal[i] +
          4 * horizontal[i + w] +
          horizontal[i + 2 * w]) /
        16;
    }
  const base = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
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
        Math.max(0, (-nx * 0.255 - ny * 0.35 + 0.901) / length) ** 32;
      const sheen =
        Math.max(0, (-nx * 0.255 - ny * 0.35 + 0.901) / length) ** 6;
      const shade = 0.75 + diffuse * 0.25;
      for (let c = 0; c < 3; c++)
        pixels.data[p + c] = Math.min(
          255,
          (base[c] * 0.75 + 255 * 0.25) * shade + 255 * specular * 0.5,
        );
      const rim = Math.exp(-field[i] / 3.6);
      pixels.data[p + 3] = Math.round(
        pixels.data[p + 3] *
          Math.min(0.82, 0.14 + rim * 0.32 + specular * 0.4 + sheen * 0.04),
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
  const edge = ctx.createLinearGradient(0, 0, layout.width, layout.height);
  edge.addColorStop(0, "#ffffffad");
  edge.addColorStop(0.4, `${color}55`);
  edge.addColorStop(0.72, "#ffffff32");
  edge.addColorStop(1, `${color}99`);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke(contour);
  ctx.restore();
  layout.slots.forEach((rect, index) => {
    const path = bubbleWindowPath(rect, index);
    ctx.save();
    ctx.clip(path);
    drawPhoto(ctx, photos[index], rect);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = `${mixHex(color, NIGHT, 0.25)}40`;
    ctx.lineWidth = 6;
    ctx.stroke(path);
    const reflection = ctx.createLinearGradient(
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
    );
    reflection.addColorStop(0, "#ffffffc4");
    reflection.addColorStop(0.24, `${mixHex(color, "#ffffff", 0.65)}a0`);
    reflection.addColorStop(0.5, "#ffffff10");
    reflection.addColorStop(0.78, "#ffffff80");
    reflection.addColorStop(1, `${color}66`);
    ctx.strokeStyle = reflection;
    ctx.lineWidth = 3.2;
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
    if (style === "specimen") {
      drawBead(
        ctx,
        layout.pad + layout.cellWidth + layout.gap / 2,
        layout.pad + layout.cellHeight + layout.gap / 2,
        44,
        vividAccent(color),
      );
    }
  }
  await drawFooter(ctx, layout, style, color, colorLabel, date, logo, photos);
}
