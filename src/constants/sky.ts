/** Presentation tokens only. Daily colors and stored settings keep their original IDs. */
export const SKY = {
  light: { page: "#171e3e", surface: "#252d4c", bottom: "#382348" },
  dark: { page: "#0d132f", surface: "#1a2341", bottom: "#281337" },
};
export const SKY_STARS = Array.from({ length: 24 }, (_, i) => ({
  x: 4 + ((i * 37) % 93),
  y: 3 + ((i * 23) % 94),
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4,
  duration: 7.3 + (i % 6) * 1.1,
}));
