// Matching cubic commands let round bubbles morph into curled, tapered droplets.
type Point = [number, number];
function smoothLoop(points: Point[]): string {
  let path = `M${points[0].join(",")}`;
  for (let i = 0; i < points.length; i++) {
    const a = points[(i + points.length - 1) % points.length],
      b = points[i];
    const c = points[(i + 1) % points.length],
      d = points[(i + 2) % points.length];
    path += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6},${c[1] - (d[1] - b[1]) / 6} ${c.join(",")}`;
  }
  return path + "Z";
}
export function bubbleOutline(seed = 0, curl = 0): string {
  return smoothLoop(
    Array.from({ length: 16 }, (_, i): Point => {
      const angle = (i * Math.PI * 2) / 16;
      const radius =
        47 *
        (1 +
          0.035 * Math.sin(angle * 4 + seed) +
          0.026 * Math.sin(angle * 3 - seed) +
          0.012 * Math.cos(angle * 2 + seed));
      const tip = Math.pow(Math.max(0, Math.cos(angle)), 3);
      // The round head remains full; a tapered tip bends inward like a magatama.
      return [
        Math.cos(angle) * radius + curl * tip * 48,
        Math.sin(angle) * radius * (1 - curl * tip * 0.68) + curl * tip * 34,
      ];
    }),
  );
}
export const ROUND_BUBBLES = [
  bubbleOutline(),
  bubbleOutline(1.6),
  bubbleOutline(3.3),
  bubbleOutline(),
];
export const CURL_BUBBLES = [
  bubbleOutline(),
  bubbleOutline(0.5, 0.85),
  bubbleOutline(1, 1.15),
  bubbleOutline(),
];
