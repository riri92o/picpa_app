import { artworkLayout, type ArtworkRect } from "./artworkLayout";
import { drawCollageLogo } from "./branding";
import { drawPlacement } from "./photoCanvas";
import { waterFilm } from "./waterMaterial";
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
function bubbleFrameGeometry(layout: Layout) {
  const inset = BUBBLE_FRAME.outerInset;
  const radius =
    Math.min(layout.cellWidth, layout.cellHeight) * BUBBLE_FRAME.cornerRatio +
    layout.pad -
    inset;
  return {
    x: inset,
    y: inset,
    width: layout.width - inset * 2,
    height: layout.height - inset * 2,
    radius,
  };
}
function bubbleOutline(layout: Layout) {
  const { x, y, width, height, radius } = bubbleFrameGeometry(layout);
  const path = new Path2D();
  path.roundRect(x, y, width, height, radius);
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

/** A translucent colored film with feathered edge reflections; no raised surface shading. */
function drawLiquidWater(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  outline: Path2D,
  color: string,
) {
  const film = new Path2D(outline);
  layout.slots.forEach((rect) => film.addPath(bubbleWindowPath(rect)));
  const palette = waterFilm(color);
  ctx.save();
  // Keep the export transparent around the rim and let the photographs fill its openings.
  ctx.clip(film, "evenodd");
  const body = ctx.createLinearGradient(
    0,
    0,
    layout.width * 0.22,
    layout.height,
  );
  body.addColorStop(0, palette.light);
  body.addColorStop(0.32, palette.body);
  body.addColorStop(0.68, palette.shade);
  body.addColorStop(1, palette.light);
  ctx.globalAlpha = WATER_MATERIAL.baseOpacity;
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, layout.width, layout.height);

  const reflection = ctx.createLinearGradient(
    0,
    0,
    layout.width,
    layout.height,
  );
  reflection.addColorStop(0, palette.reflection);
  reflection.addColorStop(0.36, mixHex(color, "#ffffff", 0.6));
  reflection.addColorStop(0.64, mixHex(color, "#ffffff", 0.48));
  reflection.addColorStop(1, palette.reflection);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = reflection;
  ctx.globalAlpha = WATER_MATERIAL.softEdgeOpacity;
  ctx.lineWidth = WATER_MATERIAL.edgeWidth;
  ctx.shadowColor = palette.reflection;
  ctx.shadowBlur = WATER_MATERIAL.softEdgeBlur;
  ctx.stroke(film);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = WATER_MATERIAL.edgeOpacity;
  ctx.lineWidth = WATER_MATERIAL.edgeWidth;
  ctx.stroke(film);
  ctx.restore();
}

function drawBubbleFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  photos: ArtworkPhoto[],
  color: string,
) {
  drawLiquidWater(ctx, layout, bubbleOutline(layout), color);
  layout.slots.forEach((rect, index) => {
    ctx.save();
    ctx.clip(bubbleWindowPath(rect));
    drawPhoto(ctx, photos[index], rect);
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
