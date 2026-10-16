type Bucket = { count: number; r: number; g: number; b: number };
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((v, i) => v - b[i]));
const hex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** Dominant, distinct colors from the cropped photo only. No frame or target color input. */
export function photoPalette(
  pixels: Uint8ClampedArray,
): [string, string, string] {
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  if (!sorted.length) return ["#808080", "#808080", "#808080"];
  const candidates = sorted.map((v) => ({
    rgb: [v.r / v.count, v.g / v.count, v.b / v.count],
    count: v.count,
  }));
  const selected: number[][] = [];
  for (const candidate of candidates) {
    if (selected.every((color) => distance(color, candidate.rgb) >= 58))
      selected.push(candidate.rgb);
    if (selected.length === 3) break;
  }
  // Uniform photographs stay uniform; don't invent extra colors to fill the strip.
  while (selected.length < 3) selected.push(selected[selected.length - 1]);
  selected.sort(
    (a, b) =>
      a.reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0) -
      b.reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0),
  );
  return selected.map(hex) as [string, string, string];
}
