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

const { beginCropGesture, moveCropGesture } = load("src/domain/cropGesture.ts");
const { getCropGeometry } = load("src/domain/crop.ts");
const frame = { width: 320, height: 256 };
const source = { width: 1536, height: 1024 };
const base = { id: "existing-photo", zoom: 1.3, x: 0.15, y: -0.2, rotation: 0 };
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const geometry = (placement, image = source) =>
  getCropGeometry(
    frame.width,
    frame.height,
    image.width,
    image.height,
    placement,
  );

assert.equal(beginCropGesture(base, []), null);
for (const image of [source, { width: 1024, height: 1536 }]) {
  for (const rotation of [0, 90, 180, 270]) {
    const placement = { ...base, rotation };
    const copy = structuredClone(placement);
    const before = geometry(placement, image);
    const start = beginCropGesture(placement, [{ x: 0, y: 0 }]);
    const moved = moveCropGesture(start, [{ x: 12, y: -8 }], frame, image);
    const after = geometry({ ...placement, ...moved }, image);
    near(after.panX - before.panX, 12);
    near(after.panY - before.panY, -8);
    near(moved.zoom, placement.zoom);

    const center = { x: 18, y: -12 };
    const shift = { x: 7, y: -4 };
    const pinch = beginCropGesture(placement, [
      { x: center.x - 40, y: center.y },
      { x: center.x + 40, y: center.y },
    ]);
    const enlarged = moveCropGesture(
      pinch,
      [
        { x: center.x + shift.x - 60, y: center.y + shift.y },
        { x: center.x + shift.x + 60, y: center.y + shift.y },
      ],
      frame,
      image,
    );
    near(enlarged.zoom, 1.95);
    const enlargedGeometry = geometry({ ...placement, ...enlarged }, image);
    near(
      (center.x - before.panX) / before.scale,
      (center.x + shift.x - enlargedGeometry.panX) / enlargedGeometry.scale,
    );
    near(
      (center.y - before.panY) / before.scale,
      (center.y + shift.y - enlargedGeometry.panY) / enlargedGeometry.scale,
    );
    assert.deepEqual(
      placement,
      copy,
      "Existing editing values are never mutated",
    );
  }
}

const two = [
  { x: -40, y: 0 },
  { x: 40, y: 0 },
];
const start = beginCropGesture(base, two);
for (const [spread, expected] of [
  [10000, 2.4],
  [0.01, 1],
]) {
  const result = moveCropGesture(
    start,
    [
      { x: -spread, y: -10000 },
      { x: spread, y: -10000 },
    ],
    frame,
    source,
  );
  assert.equal(result.zoom, expected);
  assert.ok(Math.abs(result.x) <= 1 && Math.abs(result.y) <= 1);
  const crop = geometry({ ...base, ...result });
  assert.ok(crop.imageWidth >= frame.width && crop.imageHeight >= frame.height);
  assert.ok(Math.abs(crop.panX) <= crop.maxPanX);
  assert.ok(Math.abs(crop.panY) <= crop.maxPanY);
}

const pinched = moveCropGesture(
  start,
  [
    { x: -65, y: 5 },
    { x: 65, y: 5 },
  ],
  frame,
  source,
);
const last = { x: 65, y: 5 };
const rebased = beginCropGesture({ ...base, ...pinched }, [last]);
const same = moveCropGesture(rebased, [last], frame, source);
for (const key of ["x", "y", "zoom"]) near(same[key], pinched[key]);
const continued = moveCropGesture(
  rebased,
  [{ x: last.x + 6, y: last.y - 3 }],
  frame,
  source,
);
const before = geometry({ ...base, ...pinched });
const after = geometry({ ...base, ...continued });
near(after.panX - before.panX, 6);
near(after.panY - before.panY, -3);
near(continued.zoom, pinched.zoom);

const coincident = beginCropGesture(base, [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
]);
const safe = moveCropGesture(coincident, two, frame, source);
assert.ok(Object.values(safe).every(Number.isFinite));
console.log(
  "Crop gestures: finger-anchored pinch and pan in all rotations, edge/zoom limits, continuous two-to-one-finger transition, immutable legacy placements: OK",
);
