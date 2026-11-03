import {
  ARTWORK_STYLES,
  ARTWORK_WIDTH,
  DEFAULT_ARTWORK_STYLE,
  BUBBLE_FRAME,
} from "../constants/artwork";
import { COLLAGE_GAP, collageLayout } from "./collageLayout";
import type {
  ArtworkStyle,
  CollageSpacing,
  DayRecord,
  GridCount,
} from "./types";

export function resolveArtworkStyle(value?: string): ArtworkStyle {
  return (
    ARTWORK_STYLES.find((style) => style.id === value)?.id ??
    DEFAULT_ARTWORK_STYLE
  );
}
export function withArtworkStyle(
  day: DayRecord,
  style: ArtworkStyle,
): DayRecord {
  return { ...day, artworkStyle: resolveArtworkStyle(style) };
}
export interface ArtworkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fixed, row-ordered circles. Small differences in size and height create a
 * gathered cluster without rotating, stretching or randomizing the photographs. */
function bubbleSlots(count: GridCount, spacing: CollageSpacing) {
  const circles =
    count === 9
      ? [
          [1.04, 1.08, 0.98],
          [2.85, 1.22, 0.9],
          [4.76, 1.04, 1.04],
          [0.96, 2.91, 1.04],
          [2.87, 3.04, 0.96],
          [4.73, 2.9, 0.9],
          [1.04, 4.83, 0.92],
          [2.92, 4.9, 1.03],
          [4.8, 4.76, 0.98],
        ]
      : [
          [1.09, 1.05, 1.06],
          [2.98, 1.3, 0.91],
          [1, 2.75, 0.9],
          [2.93, 2.98, 1.04],
          [1.11, 4.5, 1.05],
          [3.02, 4.7, 0.91],
        ].slice(0, count);
  const spread = spacing === "joined" ? 1 : count === 9 ? 1.2 : 1.24;
  const positions = circles.map(([x, y, r]) => ({
    x: x * spread,
    y: y * spread,
    r,
  }));
  const left = Math.min(...positions.map(({ x, r }) => x - r));
  const right = Math.max(...positions.map(({ x, r }) => x + r));
  const top = Math.min(...positions.map(({ y, r }) => y - r));
  const scale = (ARTWORK_WIDTH - BUBBLE_FRAME.padding * 2) / (right - left);
  return positions.map(({ x, y, r }): ArtworkRect => ({
    x: BUBBLE_FRAME.padding + (x - r - left) * scale,
    y: BUBBLE_FRAME.padding + (y - r - top) * scale,
    width: r * 2 * scale,
    height: r * 2 * scale,
  }));
}

export function artworkLayout(
  count: GridCount,
  spacing: CollageSpacing = "separated",
  style: ArtworkStyle = DEFAULT_ARTWORK_STYLE,
  logoEnabled = true,
) {
  const source = collageLayout(count, spacing);
  const { columns, rows } = source;
  const palette = style === "palette",
    bubble = style === "bubble-window";
  const plain = style === "black-frame" || style === "white-frame";
  const pad = plain ? 24 : palette ? 54 : bubble ? BUBBLE_FRAME.padding : 42;
  const gap = spacing === "joined" ? 0 : palette ? 44 : COLLAGE_GAP;
  const cellWidth = (ARTWORK_WIDTH - pad * 2 - gap * (columns - 1)) / columns;
  const photoHeight = bubble
    ? cellWidth
    : (cellWidth * source.cellHeight) / source.cellWidth;
  // Fractional horizontal boundaries blend with the palette background even at
  // gap=0. Snap joined tiles to output pixels; drawPlacement still scales uniformly.
  const cellHeight =
    palette && spacing === "joined" ? Math.round(photoHeight) : photoHeight;
  // Each photo keeps its own three-color palette in both spacing modes.
  // Joined mode connects the photo-and-swatch tiles without background gutters.
  const stripHeight = palette ? Math.round(cellWidth * 0.16) : 0;
  const strideY = cellHeight + stripHeight + gap;
  const slots = bubble
    ? bubbleSlots(count, spacing)
    : Array.from({ length: count }, (_, i): ArtworkRect => ({
        x: pad + (i % columns) * (cellWidth + gap),
        y: pad + Math.floor(i / columns) * strideY,
        width: cellWidth,
        height: cellHeight,
      }));
  const gridHeight = bubble
    ? Math.max(...slots.map((slot) => slot.y + slot.height)) - pad
    : rows * (cellHeight + stripHeight) + (rows - 1) * gap;
  const footerHeight = plain
    ? logoEnabled
      ? 80
      : pad
    : bubble
      ? logoEnabled
        ? 74
        : 36
      : 156;
  const height = Math.ceil(pad + gridHeight + footerHeight);
  const footerY = pad + gridHeight;
  const footer = {
    x: 0,
    y: footerY,
    width: ARTWORK_WIDTH,
    height: footerHeight,
  };
  const logoWidth = plain || bubble ? 100 : 126;
  const logo = {
    x: bubble
      ? slots.at(-1)!.x + slots.at(-1)!.width / 2
      : plain
        ? ARTWORK_WIDTH / 2
        : ARTWORK_WIDTH - 100,
    y: footerY + (bubble ? footerHeight - 16 : footerHeight) / 2,
    width: logoWidth,
    height: (logoWidth * 330) / 664,
  };
  return {
    width: ARTWORK_WIDTH,
    height,
    columns,
    rows,
    pad,
    gap,
    cellWidth,
    cellHeight,
    stripHeight,
    gridHeight,
    footer,
    logo,
    slots,
  };
}
