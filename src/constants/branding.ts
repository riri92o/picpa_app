/** Use the approved artwork directly; the UI and canvas share the same crop. */
export const BRAND_LOGO = {
  url: "./branding/picpa-logo-source.png",
  sourceWidth: 1536,
  sourceHeight: 1024,
  crop: { x: 265, y: 247, width: 1006, height: 508 },
} as const;

export const OPENING_MOTION = {
  minimumDuration: 1900,
  reducedDuration: 120,
  artworkTimeout: 4500,
  fadeDuration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

// Independent of the daily draw, so the opening does not reveal today's color.
export const OPENING_BUBBLES = [
  { x: 15, y: 15, size: 78, color: "#6fa9ed", dx: 8, dy: -13, period: 8.7 },
  { x: 78, y: 18, size: 100, color: "#dba0ce", dx: -9, dy: 16, period: 11.1 },
  { x: 47, y: 24, size: 23, color: "#b6a0de", dx: 5, dy: -9, period: 7.3 },
  { x: 25, y: 31, size: 29, color: "#edd592", dx: -6, dy: 10, period: 9.8 },
  { x: 91, y: 35, size: 42, color: "#8fd9be", dx: -8, dy: -12, period: 10.6 },
  { x: 7, y: 43, size: 47, color: "#b59ce1", dx: 7, dy: -10, period: 12.7 },
  { x: 88, y: 54, size: 24, color: "#eca690", dx: -4, dy: 8, period: 8.2 },
  { x: 18, y: 63, size: 83, color: "#8dd5bd", dx: 10, dy: 14, period: 11.8 },
  { x: 73, y: 68, size: 89, color: "#85a5ea", dx: -8, dy: -16, period: 9.5 },
  { x: 46, y: 72, size: 28, color: "#efbc85", dx: 5, dy: -9, period: 7.9 },
  { x: 8, y: 82, size: 27, color: "#e8a0b8", dx: 6, dy: -8, period: 10.1 },
  { x: 86, y: 86, size: 37, color: "#a4ccea", dx: -5, dy: 9, period: 12.3 },
] as const;
