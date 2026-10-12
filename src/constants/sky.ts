/** Presentation tokens only. Daily colors and stored settings keep their original IDs. */
export const SKY = {
  light: { page: "#171e3e", surface: "#252d4c", bottom: "#382348" },
  dark: { page: "#0d132f", surface: "#1a2341", bottom: "#281337" },
};
export const SKY_STARS = Array.from({ length: 40 }, (_, i) => ({
  x: 4 + ((i * 37) % 93),
  y: 3 + ((i * 23) % 94),
  size: i % 11 === 0 ? 3 : i % 4 === 0 ? 2.2 : 1.3,
  duration: 7.3 + (i % 6) * 1.1,
}));

/** Extra decoration stays outside the fluid solver, preserving its motion. */
export const SKY_DECOR_BUBBLES = [
  { x: 12, y: 9, size: 7, opacity: 0.72, period: 9.3 },
  { x: 82, y: 12, size: 11, opacity: 0.66, period: 11.4 },
  { x: 6, y: 34, size: 19, opacity: 0.55, period: 13.2 },
  { x: 91, y: 39, size: 8, opacity: 0.73, period: 8.7 },
  { x: 2, y: 57, size: 32, opacity: 0.48, period: 12.1 },
  { x: 96, y: 62, size: 16, opacity: 0.66, period: 10.7 },
  { x: 10, y: 78, size: 12, opacity: 0.67, period: 9.9 },
  { x: 84, y: 86, size: 39, opacity: 0.43, period: 14.6 },
];

export const SKY_BOKEH = [
  { x: 4, y: 29, size: 34 },
  { x: 93, y: 24, size: 21 },
  { x: 2, y: 74, size: 48 },
  { x: 91, y: 78, size: 29 },
];
