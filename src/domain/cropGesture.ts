import { getCropGeometry } from "./crop";
import type { PhotoPlacement } from "./types";

export const MIN_CROP_ZOOM = 1;
export const MAX_CROP_ZOOM = 2.4;

export interface CropPoint {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface CropGesture {
  placement: PhotoPlacement;
  center: CropPoint;
  distance: number;
}

function measure(points: readonly CropPoint[]) {
  const [first, second] = points;
  return {
    center: second
      ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      : first,
    distance: second ? Math.hypot(second.x - first.x, second.y - first.y) : 0,
  };
}

/** Points use screen axes, relative to the center of the crop frame. */
export function beginCropGesture(
  placement: PhotoPlacement,
  points: readonly CropPoint[],
): CropGesture | null {
  if (!points.length) return null;
  return { placement: { ...placement }, ...measure(points) };
}

export function moveCropGesture(
  start: CropGesture,
  points: readonly CropPoint[],
  frame: Size,
  source: Size,
): Pick<PhotoPlacement, "zoom" | "x" | "y"> {
  if (!points.length) return start.placement;
  const current = measure(points);
  const zoom = Math.max(
    MIN_CROP_ZOOM,
    Math.min(
      MAX_CROP_ZOOM,
      start.placement.zoom *
        (start.distance > 0 ? current.distance / start.distance : 1),
    ),
  );
  const before = getCropGeometry(
    frame.width,
    frame.height,
    source.width,
    source.height,
    start.placement,
  );
  const after = getCropGeometry(
    frame.width,
    frame.height,
    source.width,
    source.height,
    { ...start.placement, zoom },
  );
  const ratio = after.scale / before.scale;
  // Keep the same image point beneath the fingers while their midpoint moves.
  const panX = current.center.x - (start.center.x - before.panX) * ratio;
  const panY = current.center.y - (start.center.y - before.panY) * ratio;
  return {
    zoom,
    x: after.maxPanX ? Math.max(-1, Math.min(1, panX / after.maxPanX)) : 0,
    y: after.maxPanY ? Math.max(-1, Math.min(1, panY / after.maxPanY)) : 0,
  };
}
