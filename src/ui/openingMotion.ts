import type { OPENING_BUBBLES } from "../constants/branding";

export type OpeningBubbleDefinition = (typeof OPENING_BUBBLES)[number];

/** Different phases and continuous curves avoid a stop at each keyframe. */
export function openingBubbleOffset(
  bubble: OpeningBubbleDefinition,
  index: number,
  elapsed: number,
) {
  const angle =
    ((elapsed / 1000) * Math.PI * 2) / bubble.period + index * 2.39996;
  return {
    x: Math.sin(angle) * bubble.dx,
    y: Math.sin(angle + Math.PI * 0.65) * bubble.dy,
  };
}
