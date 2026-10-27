/** Keep the initial HTML and manifest chrome colors in sync with this value. */
export const NIGHT_SKY_COLOR = "#0a1126";
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
function selectedFill(accent: string, ink: string) {
  for (let step = 0; step <= 12; step++) {
    const value = mixHex(accent, "#ffffff", 0.14 + step * 0.035);
    if (contrastRatio(value, ink) >= 5.2) return value;
  }
  return mixHex(accent, "#ffffff", 0.6);
}
// Presentation only: the stored daily palette color never changes.
export function accentTokens(accent: string, revealed = false) {
  const dark = "#142039",
    white = "#ffffff";
  const neutral = !revealed;
  const vivid = neutral ? accent : vividAccent(accent);
  const surface = neutral ? "#17213a" : mixHex("#152039", vivid, 0.045);
  const bottom = neutral ? "#1d1b32" : mixHex("#131b32", vivid, 0.14);
  const fill = selectedFill(vivid, dark);
  return {
    "--text": "#f8f4fb",
    "--muted": "#b7c0d3",
    "--accent": accent,
    "--accent-soft": fill,
    "--control-highlight": mixHex(fill, white, 0.17),
    "--control-ink": dark,
    "--film-pink": neutral ? "#e0e5ed" : mixHex(vivid, "#fff0eb", 0.48),
    "--film-blue": neutral ? "#bfc8d7" : mixHex(vivid, "#e5f1ff", 0.38),
    "--film-gold": neutral ? "#eff1f5" : mixHex(vivid, "#ffe6c1", 0.48),
    "--scene-vivid": neutral ? "#bdc1c5" : vivid,
    "--scene-shadow": neutral ? "#646e85" : mixHex(vivid, "#0b1025", 0.48),
    "--scene-glow": neutral ? "#c7cfdb" : mixHex(vivid, white, 0.23),
    "--sky-page": NIGHT_SKY_COLOR,
    "--sky-surface": surface,
    "--sky-bottom": bottom,
    "--accent-readable-dark": readableAccent(accent, surface, white),
  };
}

/** Add depth to midtones without turning pastel colors into saturated midtones. */
export function vividAccent(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const delta = max - min;
  if (delta < 0.08) return hex;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (((hue * 60) % 360) + 360) % 360;
  const t = Math.max(0, Math.min(1, (light - 0.62) / 0.18));
  const pastel = t * t * (3 - 2 * t);
  const sourceSaturation = delta / (1 - Math.abs(2 * light - 1));
  const targetLight = light - 0.035 * (1 - pastel);
  const saturation = Math.min(
    0.82,
    sourceSaturation * (1 + 0.32 * (1 - pastel)),
  );
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

/** Tinted reflections and a hue-preserving shadow share one material palette. */
export function bubbleTones(color: string, neutral = false) {
  const body = neutral ? color : vividAccent(color);
  const channels = rgb(body);
  const light = (Math.max(...channels) + Math.min(...channels)) / 510;
  const pale = Math.max(0, Math.min(1, (light - 0.62) / 0.18));
  return {
    body,
    light: neutral ? "#d9dfe8" : mixHex(body, "#ffffff", 0.14),
    shadow: neutral ? "#657087" : mixHex(body, "#0b1025", 0.45 - pale * 0.23),
    pearl: neutral ? "#e0e4ed" : mixHex(body, "#fff0eb", 0.54),
    aqua: neutral ? "#b7c0d0" : mixHex(body, "#e5f1ff", 0.4),
    gold: neutral ? "#f2f3f7" : mixHex(body, "#ffe6c1", 0.5),
  };
}
