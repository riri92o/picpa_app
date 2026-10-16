import {
  ARTWORK_STYLES,
  ARTWORK_WIDTH,
  DEFAULT_ARTWORK_STYLE,
  BUBBLE_FRAME,
} from "../constants/artwork";
import { collageLayout } from "./collageLayout";
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

/** Photo order stays fixed; every bubble window is the same rounded square. */
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
  const gap =
    spacing === "joined"
      ? bubble
        ? 6
        : palette
          ? 18
          : 0
      : palette
        ? 44
        : plain
          ? 12
          : bubble
            ? 24
            : 20;
  const cellWidth = (ARTWORK_WIDTH - pad * 2 - gap * (columns - 1)) / columns;
  const cellHeight = bubble
    ? cellWidth
    : (cellWidth * source.cellHeight) / source.cellWidth;
  const stripHeight = palette ? Math.round(cellWidth * 0.16) : 0;
  const strideY = cellHeight + stripHeight + gap;
  const gridHeight = rows * (cellHeight + stripHeight) + (rows - 1) * gap;
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
  const slots = Array.from({ length: count }, (_, i): ArtworkRect => ({
    x: pad + (i % columns) * (cellWidth + gap),
    y: pad + Math.floor(i / columns) * strideY,
    width: cellWidth,
    height: cellHeight,
  }));
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
