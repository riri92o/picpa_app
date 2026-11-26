import { MEMBRANE_DROPLETS, membranePoint } from "./drawMembrane";

interface Point {
  x: number;
  y: number;
}

const TAU = Math.PI * 2;
const SEGMENTS = 24;
const SAMPLES = SEGMENTS * 2;
const number = (value: number) => Number(value.toFixed(3));
const xy = (point: Point) => `${number(point.x)} ${number(point.y)}`;
const add = (a: Point, b: Point, scale = 1): Point => ({
  x: a.x + b.x * scale,
  y: a.y + b.y * scale,
});
const wrapped = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

/** Evaluate the existing 24 Catmull–Rom cubics, without moving their outline. */
function outlineAt(parameter: number, phase: number) {
  const normalized = ((parameter % SEGMENTS) + SEGMENTS) % SEGMENTS;
  const segment = Math.floor(normalized);
  const t = normalized - segment;
  const sample = (index: number) =>
    membranePoint((index * TAU) / SEGMENTS, phase);
  const a = sample(segment - 1);
  const b = sample(segment);
  const c = sample(segment + 1);
  const e = sample(segment + 2);
  const p = add(b, { x: c.x - a.x, y: c.y - a.y }, 1 / 6);
  const q = add(c, { x: b.x - e.x, y: b.y - e.y }, 1 / 6);
  const u = 1 - t;
  const point = {
    x:
      u * u * u * b.x +
      3 * u * u * t * p.x +
      3 * u * t * t * q.x +
      t * t * t * c.x,
    y:
      u * u * u * b.y +
      3 * u * u * t * p.y +
      3 * u * t * t * q.y +
      t * t * t * c.y,
  };
  const derivative = {
    x:
      3 * u * u * (p.x - b.x) +
      6 * u * t * (q.x - p.x) +
      3 * t * t * (c.x - q.x),
    y:
      3 * u * u * (p.y - b.y) +
      6 * u * t * (q.y - p.y) +
      3 * t * t * (c.y - q.y),
  };
  const length = Math.hypot(derivative.x, derivative.y) || 1;
  const tangent = { x: derivative.x / length, y: derivative.y / length };
  return {
    point,
    tangent,
    normal: { x: tangent.y, y: -tangent.x },
  };
}

/** A filled rim with a broad upper-left reflection and quieter wet lower edge.
 * All phases have identical cubic commands for Framer Motion interpolation.
 * Width is bounded independently of the existing membrane and bead radii. */
export function membraneRibbonPath(phase = 0, widthMultiplier = 1): string {
  const multiplier = Number.isFinite(widthMultiplier)
    ? Math.max(0, Math.min(2.5, widthMultiplier))
    : 1;
  const offsetAt = (parameter: number, side: number) => {
    const { point, normal } = outlineAt(parameter, phase);
    const angle = (parameter * TAU) / SEGMENTS;
    const key = Math.exp(-Math.pow(wrapped(angle + 2.35) / 0.78, 2));
    const lower = Math.exp(-Math.pow(wrapped(angle - 1.05) / 0.85, 2));
    const wet = 0.5 + 0.5 * Math.sin(angle * 3 + phase);
    const width = Math.min(
      0.95,
      (0.07 + 0.38 * key + 0.16 * lower + 0.035 * wet) * multiplier,
    );
    return add(point, normal, side * width);
  };
  const step = SEGMENTS / SAMPLES;
  const derivativeAt = (parameter: number, side: number) => {
    const epsilon = 0.001;
    const before = offsetAt(parameter - epsilon, side);
    const after = offsetAt(parameter + epsilon, side);
    return {
      x: (after.x - before.x) / (2 * epsilon),
      y: (after.y - before.y) / (2 * epsilon),
    };
  };
  const contour = (side: number, reverse: boolean) => {
    const direction = reverse ? -1 : 1;
    let result = `M ${xy(offsetAt(0, side))}`;
    for (let i = 0; i < SAMPLES; i++) {
      const from = direction * i * step;
      const to = direction * (i + 1) * step;
      const span = direction * step;
      const start = offsetAt(from, side);
      const end = offsetAt(to, side);
      const c1 = add(start, derivativeAt(from, side), span / 3);
      const c2 = add(end, derivativeAt(to, side), -span / 3);
      result += ` C ${xy(c1)} ${xy(c2)} ${xy(end)}`;
    }
    return `${result} Z`;
  };
  // Opposite winding creates a transparent center under the default fill rule.
  return `${contour(1, false)} ${contour(-1, true)}`;
}

/** Two tapered wet joins tangent to the unchanged membrane and bead circle.
 * Paint beneath the bead and use the same circle mask as the main rim. */
export function membraneMeniscusPath(phase: number, index: number): string {
  const drop = MEMBRANE_DROPLETS[index];
  if (!drop?.color) return "";
  const radius = drop.radius * 100;
  const center = membranePoint(drop.angle, phase);
  const parameter = (drop.angle * SEGMENTS) / TAU;
  const { tangent, normal } = outlineAt(parameter, phase);
  const local = (x: number, y: number) =>
    add(add(center, tangent, x * radius), normal, y * radius);
  return [-1, 1]
    .map((side) => {
      const anchor = outlineAt(
        parameter + (side * ((radius * 1.45) / 45.4) * SEGMENTS) / TAU,
        phase,
      );
      const outer = add(anchor.point, anchor.normal, 0.22);
      const inner = add(anchor.point, anchor.normal, -0.09);
      const outerCircle = local(side * 0.78, Math.sqrt(1 - 0.78 ** 2));
      const innerCircle = local(side * 0.91, Math.sqrt(1 - 0.91 ** 2));
      const outerTangent = add(
        { x: 0, y: 0 },
        tangent,
        -side * Math.sqrt(1 - 0.78 ** 2),
      );
      const arrive = add(outerTangent, normal, 0.78);
      const leave = add(
        add({ x: 0, y: 0 }, tangent, side * Math.sqrt(1 - 0.91 ** 2)),
        normal,
        -0.91,
      );
      const c1 = add(outer, anchor.tangent, -side * radius * 0.34);
      const c2 = add(outerCircle, arrive, -radius * 0.48);
      const c3 = add(innerCircle, leave, radius * 0.42);
      const c4 = add(inner, anchor.tangent, -side * radius * 0.25);
      // A semicircular cap follows both ribbon tangents instead of closing in
      // a straight, sharp corner where the wet join meets the main rim.
      const cap1 = add(inner, anchor.tangent, side * ((0.31 * 2) / 3));
      const cap2 = add(outer, anchor.tangent, side * ((0.31 * 2) / 3));
      return `M ${xy(outer)} C ${xy(c1)} ${xy(c2)} ${xy(outerCircle)} L ${xy(innerCircle)} C ${xy(c3)} ${xy(c4)} ${xy(inner)} C ${xy(cap1)} ${xy(cap2)} ${xy(outer)} Z`;
    })
    .join(" ");
}
