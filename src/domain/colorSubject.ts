import { COLOR_MATCH } from "../constants/colorMatch";
export type Lab = [number, number, number];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const distance = (a: Lab, b: Lab) =>
  Math.hypot((a[0] - b[0]) * 0.65, a[1] - b[1], a[2] - b[2]);

/** Target-independent visual saliency, not semantic object segmentation.
 * Inspired by frequency-tuned color/mean contrast (Achanta et al., CVPR 2009),
 * with border contrast and a small center prior. Never search for the target color.
 */
export function subjectWeights(
  labs: (Lab | undefined)[],
  width: number,
  height: number,
) {
  const mean: Lab = [0, 0, 0],
    border: Lab = [0, 0, 0];
  let count = 0,
    borderCount = 0;
  const edge = Math.max(1, Math.round(Math.min(width, height) * 0.07));
  labs.forEach((lab, i) => {
    if (!lab) return;
    count++;
    const x = i % width,
      y = Math.floor(i / width);
    const isBorder =
      x < edge || x >= width - edge || y < edge || y >= height - edge;
    for (let c = 0; c < 3; c++) {
      mean[c] += lab[c];
      if (isBorder) border[c] += lab[c];
    }
    if (isBorder) borderCount++;
  });
  if (!count) throw new Error("No image pixels");
  for (let c = 0; c < 3; c++) {
    mean[c] /= count;
    border[c] = borderCount ? border[c] / borderCount : mean[c];
  }
  return labs.map((lab, i) => {
    if (!lab) return 0;
    // Blur before saliency so individual texture/noise pixels cannot claim attention.
    const smooth: Lab = [0, 0, 0];
    let neighbours = 0;
    const x = i % width,
      y = Math.floor(i / width);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height)
          continue;
        const p = labs[(y + dy) * width + x + dx];
        if (!p) continue;
        neighbours++;
        for (let c = 0; c < 3; c++) smooth[c] += p[c];
      }
    for (let c = 0; c < 3; c++) smooth[c] /= neighbours;
    const contrast = clamp(
      distance(smooth, border) / COLOR_MATCH.saliencyContrast,
    );
    const globalContrast = clamp(
      distance(smooth, mean) / COLOR_MATCH.saliencyContrast,
    );
    const center = Math.exp(
      -2 * (((x + 0.5) / width - 0.5) ** 2 + ((y + 0.5) / height - 0.5) ** 2),
    );
    return (
      0.03 + 1.8 * contrast ** 2 + 0.15 * globalContrast ** 2 + 0.02 * center
    );
  });
}

/** Circular hue families combine light/shadow shades; neutrals keep lightness bins. */
export function colorFamily(lab: Lab): number {
  if (Math.hypot(lab[1], lab[2]) < COLOR_MATCH.neutralChroma)
    return COLOR_MATCH.hueBins + Math.min(3, Math.floor(lab[0] * 4));
  const angle = (Math.atan2(lab[2], lab[1]) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor((angle / (Math.PI * 2)) * COLOR_MATCH.hueBins);
}
export function sameFamily(a: number, b: number): boolean {
  const bins = COLOR_MATCH.hueBins;
  if (a < 0 || b < 0) return false;
  if (a >= bins || b >= bins) return a === b;
  const d = Math.abs(a - b);
  return Math.min(d, bins - d) <= 1;
}
