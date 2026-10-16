import type { ArtworkRect } from "./artworkLayout";

export interface WaterBoundary extends ArtworkRect {
  radius: number;
}

/** Exact Euclidean distance: curved reflections must not inherit a grid's diagonals. */
export function roundedRectDistance(x: number, y: number, rect: WaterBoundary) {
  const qx =
    Math.abs(x - rect.x - rect.width / 2) - rect.width / 2 + rect.radius;
  const qy =
    Math.abs(y - rect.y - rect.height / 2) - rect.height / 2 + rect.radius;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    rect.radius
  );
}

/** Smoothly join the raised water between all windows, without nearest-edge creases. */
export function waterSurfaceDistance(
  x: number,
  y: number,
  outside: WaterBoundary,
  windows: WaterBoundary[],
) {
  const outerDistance = -roundedRectDistance(x, y, outside);
  if (outerDistance <= 0) return 0;
  let inverse = 1 / (outerDistance * outerDistance);
  for (const window of windows) {
    const distance = roundedRectDistance(x, y, window);
    if (distance <= 0) return 0;
    inverse += 1 / (distance * distance);
  }
  return 1 / Math.sqrt(inverse);
}
