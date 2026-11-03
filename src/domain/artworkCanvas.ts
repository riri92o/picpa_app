import { artworkLayout, type ArtworkRect } from "./artworkLayout";
import { drawCollageLogo } from "./branding";
import { drawPlacement } from "./photoCanvas";
import { renderPhotoBubbleFilm } from "./photoBubbleFilm";
import type { ArtworkImage } from "./artworkImage";
import type {
  ArtworkStyle,
  CollageSpacing,
  GridCount,
  PhotoPlacement,
} from "./types";
import { contrastRatio, mixHex, vividAccent } from "../ui/theme";

export interface ArtworkPhoto {
  image: ArtworkImage["source"];
  placement: PhotoPlacement;
  swatches: [string, string, string];
}
type Layout = ReturnType<typeof artworkLayout>;
const NIGHT = "#061322";
const TAU = Math.PI * 2;

/** The photograph is clipped, never warped or refracted. */
export function bubbleWindowPath(rect: ArtworkRect, inset = 0) {
  const path = new Path2D();
  path.arc(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width / 2 - inset,
    0,
    TAU,
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

function drawBubbleFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  photos: ArtworkPhoto[],
  color: string,
) {
  const film = document.createElement("canvas");
  const size = Math.ceil(Math.max(...layout.slots.map((slot) => slot.width)));
  film.width = film.height = size;
  try {
    const brush = film.getContext("2d")!;
    const image = brush.createImageData(size, size);
    image.data.set(renderPhotoBubbleFilm(size, color));
    brush.putImageData(image, 0, 0);
    layout.slots.forEach((rect, index) => {
      ctx.save();
      // A fine translucent rim sits outside the photo, so it can catch light
      // against both a dark screen and a transparent exported background.
      ctx.clip(bubbleWindowPath(rect, rect.width * 0.006));
      drawPhoto(ctx, photos[index], rect);
      ctx.restore();
      ctx.drawImage(film, rect.x, rect.y, rect.width, rect.height);
    });
  } finally {
    film.width = film.height = 0;
  }
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
      if (style === "palette" && spacing !== "joined") {
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
      if (style === "palette" && layout.stripHeight > 0) {
        photo.swatches.forEach((swatch, i) => {
          ctx.fillStyle = swatch;
          const left = rect.x + (i * rect.width) / 3;
          const right = rect.x + ((i + 1) * rect.width) / 3;
          // Joined tiles also need opaque, pixel-aligned swatch boundaries:
          // fractional fills can otherwise reveal the backdrop between colors.
          ctx.fillRect(
            spacing === "joined" ? Math.round(left) : left,
            rect.y + rect.height,
            spacing === "joined"
              ? Math.round(right) - Math.round(left)
              : rect.width / 3 + 0.5,
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
