type Point = [number, number];
export interface BubbleCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

// Independent silhouettes, with gentle asymmetry and no sharp changes of direction.
const CONTROLS: Point[][] = [
  [
    [0.47, 0.02],
    [0.76, 0.015],
    [0.98, 0.18],
    [0.95, 0.4],
    [0.91, 0.55],
    [0.96, 0.76],
    [0.74, 0.98],
    [0.5, 0.96],
    [0.23, 0.98],
    [0.035, 0.79],
    [0.065, 0.55],
    [0.035, 0.3],
    [0.18, 0.045],
  ],
  [
    [0.55, 0.02],
    [0.83, 0.03],
    [0.98, 0.24],
    [0.89, 0.46],
    [0.92, 0.61],
    [0.98, 0.79],
    [0.69, 0.98],
    [0.42, 0.97],
    [0.14, 0.98],
    [0.02, 0.73],
    [0.07, 0.49],
    [0.035, 0.31],
    [0.21, 0.07],
  ],
  [
    [0.51, 0.035],
    [0.8, 0.015],
    [0.98, 0.17],
    [0.95, 0.42],
    [0.98, 0.65],
    [0.86, 0.88],
    [0.63, 0.98],
    [0.44, 0.91],
    [0.21, 0.98],
    [0.02, 0.77],
    [0.07, 0.52],
    [0.13, 0.33],
    [0.12, 0.1],
  ],
  [
    [0.44, 0.02],
    [0.72, 0.045],
    [0.97, 0.11],
    [0.96, 0.35],
    [0.88, 0.55],
    [0.97, 0.77],
    [0.75, 0.98],
    [0.48, 0.95],
    [0.29, 0.91],
    [0.08, 0.91],
    [0.03, 0.68],
    [0.075, 0.47],
    [0.025, 0.29],
    [0.19, 0.045],
  ],
];
const combine = (a: Point, b: Point, c: Point): Point => [
  (a[0] + 4 * b[0] + c[0]) / 6,
  (a[1] + 4 * b[1] + c[1]) / 6,
];

/** Periodic cubic B-spline: position, tangent and curvature meet smoothly at every join. */
export function bubbleWindowCurves(index: number): BubbleCurve[] {
  const points = CONTROLS[index % CONTROLS.length];
  return points.map((p1, i) => {
    const p0 = points[(i + points.length - 1) % points.length];
    const p2 = points[(i + 1) % points.length],
      p3 = points[(i + 2) % points.length];
    return {
      start: combine(p0, p1, p2),
      control1: [(2 * p1[0] + p2[0]) / 3, (2 * p1[1] + p2[1]) / 3],
      control2: [(p1[0] + 2 * p2[0]) / 3, (p1[1] + 2 * p2[1]) / 3],
      end: combine(p1, p2, p3),
    };
  });
}
