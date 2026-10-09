type RGB = [number, number, number];
const rgb = (hex: string): RGB =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const luminance = (hex: string) =>
  rgb(hex)
    .map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
export function contrastRatio(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
function mix(a: string, b: string, amount: number) {
  const target = rgb(b);
  return `#${rgb(a)
    .map((v, i) =>
      Math.round(v * (1 - amount) + target[i] * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
function readableAccent(accent: string, surface: string, target: string) {
  for (let step = 0; step <= 20; step++) {
    const value = mix(accent, target, step / 20);
    if (contrastRatio(value, surface) >= 5.2) return value;
  }
  return target;
}
// Presentation only: the stored daily palette color never changes.
export function accentTokens(accent: string) {
  const dark = "#172821",
    white = "#ffffff";
  return {
    "--accent": accent,
    "--control-ink":
      contrastRatio(accent, dark) >= contrastRatio(accent, white)
        ? dark
        : white,
    "--accent-readable-light": readableAccent(accent, "#faf9fc", dark),
    "--accent-readable-dark": readableAccent(accent, "#202625", white),
  };
}
