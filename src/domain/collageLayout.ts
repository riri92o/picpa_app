import type { CollageSpacing, GridCount } from "./types";

export const COLLAGE_EDGE = 16;
// Still visible when the full collage is fitted to a small mobile screen.
export const COLLAGE_GAP = 28;

export function gridDimensions(count: GridCount): [number, number] {
  return count === 9 ? [3, 3] : count === 4 ? [2, 2] : [2, 3];
}

/** Shared photo proportions and separator widths for the editor and export. */
export function collageLayout(
  count: GridCount,
  spacing: CollageSpacing = "separated",
) {
  const [columns, rows] = gridDimensions(count);
  const cellWidth = count === 9 ? 340 : 510;
  const cellHeight = count === 9 ? 340 : count === 4 ? 455 : 408;
  const gap = spacing === "joined" ? 0 : COLLAGE_GAP;
  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    gap,
    width: columns * cellWidth + (columns - 1) * gap,
    height: rows * cellHeight + (rows - 1) * gap,
  };
}
