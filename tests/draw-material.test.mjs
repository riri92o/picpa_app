import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const modules = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (modules.has(absolute)) return modules.get(absolute);
  const exports = {};
  modules.set(absolute, exports);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) =>
    load(path.resolve(path.dirname(absolute), `${name}.ts`)),
  );
  return exports;
}

const { renderDrawDroplet } = load("src/ui/drawDroplet.ts");
const size = 256;
const displaySize = 32;
const scale = size / displaySize;
const radius = size * 0.47;
const background = [10, 17, 38];
const colors = ["#e5a4d5", "#ebc1a0", "#b3a0e0", "#94d9c8", "#9fd6e4"];
const luma = (rgb) =>
  rgb.reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
function hue(rgb) {
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const delta = max - min;
  if (delta < 1) return NaN;
  const sector =
    max === rgb[0]
      ? (rgb[1] - rgb[2]) / delta
      : max === rgb[1]
        ? (rgb[2] - rgb[0]) / delta + 2
        : (rgb[0] - rgb[1]) / delta + 4;
  return (((sector * 60) % 360) + 360) % 360;
}
const hueDifference = (a, b) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// Composite before reducing resolution. Averaging unassociated RGB/alpha would
// fabricate bright fringes and overstate what a tiny bubble actually displays.
function displayedPixels(pixels) {
  const output = [];
  for (let y = 0; y < displaySize; y++) {
    for (let x = 0; x < displaySize; x++) {
      const total = [0, 0, 0];
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const p = ((y * scale + dy) * size + x * scale + dx) * 4;
          const alpha = pixels[p + 3] / 255;
          for (let c = 0; c < 3; c++)
            total[c] += pixels[p + c] * alpha + background[c] * (1 - alpha);
        }
      }
      output.push(total.map((v) => v / (scale * scale)));
    }
  }
  return output;
}
function patchBrightness(display, nx, ny) {
  const x = Math.floor(displaySize / 2 + nx * displaySize * 0.47);
  const y = Math.floor(displaySize / 2 + ny * displaySize * 0.47);
  let total = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      total += luma(display[(y + dy) * displaySize + x + dx]);
  return total / 9;
}

const bodies = [];
for (const color of colors) {
  const pixels = renderDrawDroplet(size, color);
  assert.equal(pixels.length, size * size * 4);
  const body = [0, 0, 0];
  let bodyWeight = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / radius;
      const ny = (y + 0.5 - size / 2) / radius;
      const p = (y * size + x) * 4;
      if (nx * nx + ny * ny >= 1)
        assert.equal(pixels[p + 3], 0, `${color}: outside remains transparent`);
      // Keep pigment checks away from the upper-left softbox and the thin rim.
      if (nx >= -0.12 && nx <= 0.35 && ny >= 0 && ny <= 0.45) {
        const alpha = pixels[p + 3] / 255;
        for (let c = 0; c < 3; c++) body[c] += pixels[p + c] * alpha;
        bodyWeight += alpha;
      }
    }
  }
  const centerAlpha = pixels[((size / 2) * size + size / 2) * 4 + 3];
  assert.ok(
    centerAlpha >= 80 && centerAlpha <= 210,
    `${color}: pigment stays visible without making an opaque marble`,
  );
  assert.ok(bodyWeight > 0);
  const pigment = body.map((v) => v / bodyWeight);
  const expected = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  assert.ok(
    hueDifference(hue(pigment), hue(expected)) <= 25,
    `${color}: lighting must preserve the pigment's hue`,
  );

  const display = displayedPixels(pixels);
  assert.ok(
    patchBrightness(display, -0.524, -0.573) >
      patchBrightness(display, 0.524, 0.573) + 35,
    `${color}: the shared upper-left reflection survives at 32px`,
  );
  const highlight = display.filter(
    (rgb, i) =>
      i % displaySize < displaySize / 2 &&
      Math.floor(i / displaySize) < displaySize / 2 &&
      luma(rgb) >= 170,
  );
  assert.ok(
    highlight.length >= 4,
    `${color}: reflection needs several real display pixels, not a subpixel pinprick`,
  );
  assert.ok(
    Math.max(...highlight.map(luma)) >= 185,
    `${color}: the visible reflection retains a clear bright core`,
  );
  const visibleBody = display.filter((_, i) => {
    const nx =
      ((i % displaySize) + 0.5 - displaySize / 2) / (displaySize * 0.47);
    const ny =
      (Math.floor(i / displaySize) + 0.5 - displaySize / 2) /
      (displaySize * 0.47);
    return nx >= -0.12 && nx <= 0.35 && ny >= 0 && ny <= 0.45;
  });
  bodies.push(
    visibleBody
      .reduce((sum, rgb) => sum.map((v, c) => v + rgb[c]), [0, 0, 0])
      .map((v) => v / visibleBody.length),
  );
}
for (let i = 0; i < bodies.length; i++)
  for (let j = i + 1; j < bodies.length; j++)
    assert.ok(
      distance(bodies[i], bodies[j]) >= 10,
      `${colors[i]} and ${colors[j]} remain distinguishable at their displayed size`,
    );

console.log(
  "Draw droplets: transparent exterior, shared upper-left reflections visible after 256→32px area averaging, and five distinct pigment hues: OK",
);
