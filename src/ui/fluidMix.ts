import { FLOATING_BUBBLES, LIQUID_MOTION } from "../constants/liquidMotion";

import { ingredientForBubble, recipeForColor } from "../constants/mixRecipes";

export interface FluidBox {
  width: number;
  height: number;
  x: number;
  y: number;
  size: number;
}
type RGB = [number, number, number];
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: RGB;
  strength: number;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (hex: string): RGB =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const blend = (a: RGB, b: RGB, t: number): RGB =>
  a.map((c, i) => mix(c, b[i], t)) as RGB;
const gray: RGB = [189, 193, 197];
const neutralFilm: RGB = [226, 235, 247];
const coolFilm: RGB = [183, 239, 243];
const warmFilm: RGB = [255, 216, 230];

/** UI-only field renderer. Spring-linked tails deform independently of their heads;
 * overlapping compact density kernels produce a shared contour, rather than stacked shapes.
 * No React state or stored data is changed by an animation frame. */
export function createFluidMix(
  canvas: HTMLCanvasElement,
  box: FluidBox,
  resultHex: string,
  colorId: string,
) {
  const scale = Math.min(LIQUID_MOTION.fieldScale, 384 / box.width);
  const width = Math.ceil(box.width * scale),
    height = Math.ceil(box.height * scale);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const pixels = context.createImageData(width, height);
  const density = new Float32Array(width * height);
  const weights = new Float32Array(width * height);
  const coverage = new Float32Array(width * height);
  const channels = [
    new Float32Array(width * height),
    new Float32Array(width * height),
    new Float32Array(width * height),
  ];
  const result = rgb(resultHex);
  const recipe = recipeForColor(colorId);
  const totalWeight = recipe.reduce((sum, item) => sum + item.weight, 0);
  const mixed = [0, 1, 2].map(
    (channel) =>
      recipe.reduce(
        (sum, item) => sum + rgb(item.hex)[channel] * item.weight,
        0,
      ) / totalWeight,
  ) as RGB;
  const groups = FLOATING_BUBBLES.map((b, i) => ({
    startX: box.width * b.x,
    startY: box.height * b.y,
    angle: (i % 2) * Math.PI + (Math.floor(i / 2) - 2) * 0.2,
    color: rgb(ingredientForBubble(recipe, i).hex),
    nodes: Array.from({ length: 4 }, (_, j): Node => ({
      x: box.width * b.x,
      y: box.height * b.y,
      vx: 0,
      vy: 0,
      radius: b.r * [0.86, 0.52, 0.3, 0.13][j],
      color: gray,
      strength: 0,
    })),
  }));
  const core: Node = {
    x: box.x,
    y: box.y,
    vx: 0,
    vy: 0,
    radius: box.size * 0.44,
    color: gray,
    strength: 1,
  };
  let previous = 0;
  return (elapsed: number) => {
    const { gather, swirl, settle, turns, tailStiffness, tailDamping } =
      LIQUID_MOTION;
    const gatherU = smooth(elapsed / gather);
    const flow = clamp((elapsed - gather) / swirl);
    const settling = clamp((elapsed - gather - swirl) / settle);
    // Integrated acceleration/deceleration: the angular speed starts and ends at zero.
    const rotation =
      2 *
      Math.PI *
      turns *
      (flow - Math.sin(2 * Math.PI * flow) / (2 * Math.PI));
    const convergence = smooth(flow);
    const neutralToColor = smooth((elapsed - gather * 0.78) / 400);
    const finalMix = smooth((flow - 0.48) / 0.52);
    const dt = Math.min(0.05, Math.max(0, (elapsed - previous) / 1000));
    previous = elapsed;
    const count = Math.max(1, Math.ceil(dt / (1 / 120))),
      h = dt / count;
    groups.forEach((group, i) => {
      const head = group.nodes[0];
      const theta =
        group.angle +
        rotation +
        0.11 * Math.sin(rotation * 1.8 + i) * Math.sin(flow * Math.PI);
      const orbit = box.size * (0.49 * (1 - convergence) + 0.035);
      const tx = box.x + Math.cos(theta) * orbit;
      const ty =
        box.y +
        Math.sin(theta) * orbit * (0.62 + 0.08 * Math.sin(rotation + i));
      const bend =
        Math.sin(Math.PI * gatherU) * box.size * (i % 2 ? 0.14 : -0.14);
      head.x =
        elapsed < gather
          ? mix(group.startX, tx, gatherU) - Math.sin(group.angle) * bend
          : tx;
      head.y =
        elapsed < gather
          ? mix(group.startY, ty, gatherU) + Math.cos(group.angle) * bend
          : ty;
      // Each successive spring follows the previous node, so the tail retains momentum
      // through changes of direction and curls behind the moving head.
      for (let n = 0; n < count; n++) {
        for (let j = 1; j < group.nodes.length; j++) {
          const node = group.nodes[j],
            lead = group.nodes[j - 1];
          node.vx +=
            ((lead.x - node.x) * tailStiffness - node.vx * tailDamping) * h;
          node.vy +=
            ((lead.y - node.y) * tailStiffness - node.vy * tailDamping) * h;
          node.x += node.vx * h;
          node.y += node.vy * h;
        }
      }
      group.nodes.forEach((node, j) => {
        const base = FLOATING_BUBBLES[i].r * [0.86, 0.52, 0.3, 0.13][j];
        const moving = box.size * [0.18, 0.125, 0.074, 0.031][j];
        const knead =
          1 +
          0.09 *
            Math.sin(rotation * 2 + i + j * 0.8) *
            Math.sin(flow * Math.PI);
        node.radius =
          mix(base, moving, gatherU) * knead * (1 - 0.85 * smooth(settling));
        node.strength =
          mix(i < 2 ? 0.46 : 0.7, 1, gatherU) * (1 - smooth(settling));
        node.color = blend(
          gray,
          blend(group.color, result, finalMix),
          neutralToColor,
        );
      });
    });
    const rebound =
      1 - 0.06 * Math.sin(settling * Math.PI * 2) * (1 - settling);
    core.radius = box.size * (0.44 - 0.26 * Math.sin(flow * Math.PI)) * rebound;
    core.color = blend(
      gray,
      blend(blend(mixed, result, smooth(flow / 0.6) * 0.7), result, finalMix),
      neutralToColor,
    );
    const nodes = [core, ...groups.flatMap((g) => g.nodes)];
    density.fill(0);
    weights.fill(0);
    coverage.fill(0);
    channels.forEach((c) => c.fill(0));
    pixels.data.fill(0);
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    for (const node of nodes) {
      const nx = node.x * scale,
        ny = node.y * scale;
      const support = node.radius * scale * 2.2,
        inverse = 1 / (support * support);
      const x0 = Math.max(0, Math.floor(nx - support)),
        x1 = Math.min(width - 1, Math.ceil(nx + support));
      const y0 = Math.max(0, Math.floor(ny - support)),
        y1 = Math.min(height - 1, Math.ceil(ny + support));
      minX = Math.min(minX, x0);
      maxX = Math.max(maxX, x1);
      minY = Math.min(minY, y0);
      maxY = Math.max(maxY, y1);
      for (let y = y0; y <= y1; y++) {
        const dy = (y - ny) ** 2;
        for (let x = x0; x <= x1; x++) {
          const q = 1 - ((x - nx) ** 2 + dy) * inverse;
          if (q <= 0) continue;
          const field = 2 * q * q * q,
            index = y * width + x;
          density[index] += field;
          // A sharper color weight keeps flowing pools visible while the contour is unified.
          const squared = field * field;
          const weight = squared * squared * squared * field;
          weights[index] += weight;
          coverage[index] += weight * node.strength;
          for (let c = 0; c < 3; c++)
            channels[c][index] += node.color[c] * weight;
        }
      }
    }
    const fade = 1 - smooth((settling - 0.67) / 0.33);
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const index = y * width + x,
          value = density[index];
        if (value < 0.92) continue;
        const p = index * 4;
        // Shade the same unified field, so connected liquid retains its depth while mixing.
        const slopeX = density[index - 1] - density[index + 1] || 0;
        const slopeY = density[index - width] - density[index + width] || 0;
        const light = Math.max(-0.14, Math.min(0.28, -(slopeX + slopeY) * 1.7));
        // Soap-film bands follow the shared density contour. The spring trajectories,
        // mixing recipes and convergence timing above are deliberately unchanged.
        const edge = 1 - smooth((value - 0.98) / 1.7);
        const band =
          0.5 +
          0.5 * Math.sin(x * 0.09 + y * 0.055 + value * 4 - elapsed * 0.0006);
        const filmWeight = edge * (0.18 + 0.42 * band);
        for (let c = 0; c < 3; c++) {
          const base = channels[c][index] / weights[index];
          const lit =
            light > 0 ? base + (255 - base) * light : base * (1 + light);
          const film = mix(
            neutralFilm[c],
            mix(coolFilm[c], warmFilm[c], band),
            neutralToColor,
          );
          pixels.data[p + c] = mix(lit, film, filmWeight);
        }
        // Retain the original feathered contour and fade into the settled SVG bubble.
        pixels.data[p + 3] =
          (255 * smooth((value - 0.92) / 0.16) * fade * coverage[index]) /
          weights[index];
      }
    context.putImageData(pixels, 0, 0);
  };
}
