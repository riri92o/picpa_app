/** Use the approved artwork directly; the UI and canvas share the same crop. */
export const BRAND_LOGO = {
  url: "./branding/picpa-logo-source.png",
  sourceWidth: 1536,
  sourceHeight: 1024,
  crop: { x: 265, y: 247, width: 1006, height: 508 },
} as const;

/** The supplied white artwork rendered as an alpha mask, with no dark backing. */
export const EXPORT_BRAND_LOGO = {
  url: "./branding/picpa-white-logo.svg",
  width: 664,
  height: 330,
  headerRatio: 0.1,
  logoRatio: 0.165,
  logoMaxWidth: 170,
} as const;

export const OPENING_MOTION = {
  minimumDuration: 2600,
  reducedDuration: 120,
  artworkTimeout: 4500,
  fadeDuration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

// Independent of the daily draw, so the opening does not reveal today's color.
export const OPENING_BUBBLES = [
  { x: 15, y: 15, size: 78, color: "#6fa9ed", dx: 19, dy: 34, period: 11.6 },
  { x: 78, y: 18, size: 100, color: "#dba0ce", dx: -24, dy: 40, period: 13.4 },
  { x: 47, y: 24, size: 23, color: "#b6a0de", dx: 14, dy: 26, period: 9.8 },
  { x: 25, y: 31, size: 29, color: "#edd592", dx: -17, dy: 31, period: 12.4 },
  { x: 91, y: 35, size: 42, color: "#8fd9be", dx: -19, dy: 35, period: 10.8 },
  { x: 7, y: 43, size: 47, color: "#b59ce1", dx: 21, dy: 28, period: 14.2 },
  { x: 88, y: 54, size: 24, color: "#eca690", dx: -13, dy: 25, period: 10.2 },
  { x: 18, y: 63, size: 83, color: "#8dd5bd", dx: 24, dy: 39, period: 12.8 },
  { x: 73, y: 68, size: 89, color: "#85a5ea", dx: -21, dy: 41, period: 11.2 },
  { x: 46, y: 72, size: 28, color: "#efbc85", dx: 15, dy: 27, period: 9.6 },
  { x: 8, y: 82, size: 27, color: "#e8a0b8", dx: 16, dy: 30, period: 13.6 },
  { x: 86, y: 86, size: 37, color: "#a4ccea", dx: -18, dy: 29, period: 12.2 },
] as const;
