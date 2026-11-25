/** Smooth periodic shapes shared by the film and its attached droplets. */
export const MEMBRANE_PHASES = [
  0,
  Math.PI / 2,
  Math.PI,
  Math.PI * 1.5,
  Math.PI * 2,
];
export const MEMBRANE_PERIOD = 14;
export const MEMBRANE_DROPLETS = [
  { angle: -2.52, radius: 0.057, color: "#e5a4d5" },
  { angle: -1.02, radius: 0.051, color: "#ebc1a0" },
  { angle: -0.09, radius: 0.053, color: "#b3a0e0" },
  { angle: 2.55, radius: 0.059, color: "#94d9c8" },
  { angle: 1.08, radius: 0.054, color: "#9fd6e4" },
  // Retain all ten sources for the existing spring-linked mixing solver.
  { angle: -2.0, radius: 0.009, color: undefined },
  { angle: -0.6, radius: 0.008, color: undefined },
  { angle: 0.45, radius: 0.009, color: undefined },
  { angle: 1.8, radius: 0.008, color: undefined },
  { angle: 3.0, radius: 0.009, color: undefined },
];

/** Coordinates are normalized to a 100 x 100 surface centered at the origin. */
export function membranePoint(angle: number, phase = 0) {
  const r =
    45.4 +
    2.2 * Math.sin(3 * angle + phase) +
    1.1 * Math.sin(2 * angle - phase) +
    0.7 * Math.cos(5 * angle + phase);
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

export function membranePath(phase = 0) {
  const points = Array.from({ length: 24 }, (_, i) =>
    membranePoint((i * Math.PI * 2) / 24, phase),
  );
  const number = (n: number) => Number(n.toFixed(3));
  let d = `M ${number(points[0].x)} ${number(points[0].y)}`;
  for (let i = 0; i < points.length; i++) {
    const a = points[(i + points.length - 1) % points.length];
    const b = points[i];
    const c = points[(i + 1) % points.length];
    const e = points[(i + 2) % points.length];
    d += ` C ${number(b.x + (c.x - a.x) / 6)} ${number(b.y + (c.y - a.y) / 6)} ${number(c.x - (e.x - b.x) / 6)} ${number(c.y - (e.y - b.y) / 6)} ${number(c.x)} ${number(c.y)}`;
  }
  return `${d} Z`;
}
