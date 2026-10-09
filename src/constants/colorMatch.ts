export const COLOR_MATCH = {
  version: 2,
  sampleWidth: 96,
  // Chroma-aware hue distance allows muted shades without treating gray as a color.
  hueTolerance: 0.14,
  chromaTolerance: 0.18,
  lightnessTolerance: 0.28,
  lightnessWeight: 0.1,
  oppositeHuePower: 3,
  neutralChroma: 0.02,
  neutralTolerance: 0.045,
  neutralLightnessTolerance: 0.18,
  coverageThreshold: 0.6,
  hueBins: 24,
  saliencyContrast: 0.14,
  minimumFamilyFraction: 0.015,
  subjectWeight: 0.65,
};
