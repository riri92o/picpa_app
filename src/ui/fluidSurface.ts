import { FLUID_SURFACE, LIQUID_MOTION } from "../constants/liquidMotion";

function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

/** Both surfaces use the same clock and complementary weights. The final SVG
 * appears while the fluid film recedes, without a double-opacity flash. */
export function fluidHandoff(elapsed: number) {
  const entrance = smooth(elapsed / FLUID_SURFACE.entrance);
  const settling =
    (elapsed - LIQUID_MOTION.gather - LIQUID_MOTION.swirl) /
    LIQUID_MOTION.settle;
  const reveal = smooth(
    (settling - FLUID_SURFACE.settleRevealStart) /
      FLUID_SURFACE.settleRevealSpan,
  );
  const fluid = entrance * (1 - reveal);
  return { fluid, main: 1 - fluid };
}

/** One shared contour, with a transparent body and a more visible thin rim.
 * Overlapping pools do not stack their opacity into a solid mass. */
export function fluidFilmOpacity(density: number) {
  const contour = smooth(
    (density - FLUID_SURFACE.contourThreshold) / FLUID_SURFACE.contourFeather,
  );
  const rim =
    1 - smooth((density - FLUID_SURFACE.rimStart) / FLUID_SURFACE.rimDepth);
  return (
    contour *
    (FLUID_SURFACE.interiorOpacity +
      (FLUID_SURFACE.rimOpacity - FLUID_SURFACE.interiorOpacity) * rim)
  );
}
