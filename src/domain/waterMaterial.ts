import { WATER_MATERIAL } from "../constants/artwork";

/** Retain the daily hue; highlights brighten a small part of the transparent film. */
export function waterTint(color: string) {
  return [1, 3, 5].map((i) => {
    const channel = parseInt(color.slice(i, i + 2), 16);
    return (
      channel * (1 - WATER_MATERIAL.whiteMix) + 255 * WATER_MATERIAL.whiteMix
    );
  });
}
export function waterOpacity(
  distance: number,
  reflection: number,
  sheen: number,
) {
  return Math.min(
    WATER_MATERIAL.maxOpacity,
    WATER_MATERIAL.baseOpacity +
      Math.exp(-distance / 3.6) * WATER_MATERIAL.rimOpacity +
      reflection * WATER_MATERIAL.reflectionOpacity +
      sheen * 0.02,
  );
}
