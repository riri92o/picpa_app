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
export function mixHex(a: string, b: string, amount: number) {
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
    const value = mixHex(accent, target, step / 20);
    if (contrastRatio(value, surface) >= 5.2) return value;
  }
  return target;
}
// Presentation only: the stored daily palette color never changes.
export function accentTokens(
  accent: string,
  revealed = false,
  darkMode = false,
) {
  const dark = "#142039",
    white = "#ffffff";
  const neutral = !revealed;
  const chroma = (Math.max(...rgb(accent)) - Math.min(...rgb(accent))) / 255;
  const vivid = chroma < 0.12 ? accent : vividAccent(accent);
  const page = neutral
    ? darkMode
      ? "#0d132f"
      : "#171e3e"
    : mixHex(darkMode ? "#0b1230" : "#141d3e", vivid, 0.045);
  const surface = neutral
    ? darkMode
      ? "#1a2341"
      : "#252d4c"
    : mixHex(darkMode ? "#192342" : "#252d4c", vivid, 0.055);
  const bottom = neutral
    ? darkMode
      ? "#281337"
      : "#382348"
    : mixHex(darkMode ? "#25143d" : "#38234f", vivid, 0.095);
  return {
    "--accent": accent,
    "--accent-soft": mixHex(accent, white, 0.5),
    "--control-ink": dark,
    "--film-pink": neutral ? "#e0e5ed" : mixHex(vivid, white, 0.58),
    "--film-blue": neutral ? "#bfc8d7" : mixHex(vivid, "#cceaf9", 0.42),
    "--film-gold": neutral ? "#eff1f5" : mixHex(vivid, "#fff2cc", 0.48),
    "--scene-vivid": neutral ? "#bdc1c5" : vivid,
    "--scene-glow": neutral ? "#c7cfdb" : mixHex(vivid, white, 0.38),
    "--sky-page": page,
    "--sky-surface": surface,
    "--sky-bottom": bottom,
    "--accent-readable-light": readableAccent(accent, "#faf9fc", dark),
    "--accent-readable-dark": readableAccent(accent, surface, white),
  };
}

/** Strengthen pale palette hues for decorative light; the saved daily color is unchanged. */
export function vividAccent(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const delta = max - min;
  if (delta < 0.1) return hex;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (((hue * 60) % 360) + 360) % 360;
  const targetLight = Math.max(0.48, Math.min(0.6, light));
  const saturation = 0.75;
  const chroma = (1 - Math.abs(2 * targetLight - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const sectors = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const offset = targetLight - chroma / 2;
  return `#${sectors[Math.floor(hue / 60)]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
