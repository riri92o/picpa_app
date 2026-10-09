import type { PhotoPlacement } from "./types";

export interface CropGeometry {
  imageWidth: number;
  imageHeight: number;
  scale: number;
  maxPanX: number;
  maxPanY: number;
  panX: number;
  panY: number;
}

// The image always covers the frame. x/y select a position within the real
// overflow, so moving the crop never exposes the frame background.
export function getCropGeometry(
  frameWidth: number,
  frameHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  placement: PhotoPlacement,
): CropGeometry {
  const sideways = Math.abs(placement.rotation % 180) === 90;
  const rotatedWidth = sideways ? sourceHeight : sourceWidth;
  const rotatedHeight = sideways ? sourceWidth : sourceHeight;
  const scale =
    Math.max(frameWidth / rotatedWidth, frameHeight / rotatedHeight) *
    Math.max(1, placement.zoom);
  const maxPanX = Math.max(0, (rotatedWidth * scale - frameWidth) / 2);
  const maxPanY = Math.max(0, (rotatedHeight * scale - frameHeight) / 2);
  return {
    imageWidth: sourceWidth * scale,
    imageHeight: sourceHeight * scale,
    scale,
    maxPanX,
    maxPanY,
    panX: Math.max(-1, Math.min(1, placement.x)) * maxPanX,
    panY: Math.max(-1, Math.min(1, placement.y)) * maxPanY,
  };
}
