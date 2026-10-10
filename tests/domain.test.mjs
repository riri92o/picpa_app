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
const { PALETTE } = load("src/constants/palette.ts");
const { MIX_RECIPES, ingredientForBubble } = load(
  "src/constants/mixRecipes.ts",
);
const {
  toOklab,
  pixelSimilarity,
  scoreSubjectColors,
  colorMatchSignature,
  validColorMatch,
} = load("src/domain/colorMatch.ts");
const { COLOR_MATCH } = load("src/constants/colorMatch.ts");
for (const color of PALETTE) {
  const recipe = MIX_RECIPES[color.id];
  assert.ok(recipe?.length >= 2, `Missing recipe: ${color.id}`);
  assert.ok(
    Math.abs(recipe.reduce((sum, item) => sum + item.weight, 0) - 1) < 1e-8,
  );
  for (let i = 0; i < 10; i++)
    assert.ok(recipe.includes(ingredientForBubble(recipe, i)));
  const target = toOklab(
    ...[1, 3, 5].map((i) => parseInt(color.hex.slice(i, i + 2), 16)),
  );
  assert.ok(Math.abs(pixelSimilarity(target, target) - 1) < 1e-8, color.id);
}
assert.ok(Math.abs(toOklab(255, 255, 255)[0] - 1) < 1e-6);
assert.equal(toOklab(0, 0, 0)[0], 0);
const green = toOklab(169, 216, 174);
assert.ok(
  pixelSimilarity(toOklab(70, 130, 75), green) >
    pixelSimilarity(toOklab(210, 70, 90), green),
);
assert.ok(pixelSimilarity(toOklab(200, 200, 200), green) < 0.1);
const neutral = toOklab(171, 177, 177);
assert.ok(
  pixelSimilarity(neutral, neutral) >
    pixelSimilarity(toOklab(230, 80, 90), neutral),
);
function scene(background, subject, fraction = 1, offset = 0) {
  const size = 60,
    side = Math.round(size * Math.sqrt(fraction));
  return Array.from({ length: size * size }, (_, i) => {
    const x = i % size,
      y = Math.floor(i / size),
      start = Math.round((size - side) / 2) + offset;
    return x >= start && x < start + side && y >= start && y < start + side
      ? subject
      : background;
  });
}
const score = (labs, target = green) =>
  scoreSubjectColors(labs, 60, 60, target).score;
const white = toOklab(255, 255, 255),
  red = toOklab(215, 118, 121),
  blue = toOklab(134, 179, 223);
assert.equal(score(scene(green, green)), 100);
assert.ok(score(scene(red, red)) < 10, "Opposite hue must stay low");
assert.ok(score(scene(white, white)) < 5, "White must not count as green");
assert.ok(
  score(scene(white, green, 0.16)) >= 90,
  "A green subject on white should score highly",
);
assert.ok(
  score(scene(white, green, 0.16, 10)) >= 85,
  "Off-center subjects must also count",
);
assert.ok(
  score(scene(red, green, 0.003)) < 15,
  "A tiny matching speck is not the main subject",
);
assert.ok(
  score(Array.from({ length: 3600 }, (_, i) => (i % 60 < 30 ? red : green))) <
    85,
  "Competing colors must lower coherence",
);
assert.ok(score(scene(green, green)) > score(scene(blue, blue)));
assert.equal(score(scene(neutral, neutral), neutral), 100);
assert.ok(
  score(scene(white, neutral, 0.16), neutral) >= 80,
  "Neutral subject on white",
);
assert.ok(
  score(scene(red, red), neutral) < 10,
  "Colored subject must not match gray",
);
assert.ok(
  score(scene(toOklab(72, 128, 80), toOklab(72, 128, 80))) > 70,
  "Shaded green remains in the family",
);
assert.throws(() =>
  scoreSubjectColors(Array(3600).fill(undefined), 60, 60, green),
);
const day = {
  date: "2026-10-08",
  count: 4,
  colorId: "orange",
  photos: [{ id: "a", x: 0, y: 0, zoom: 1, rotation: 0 }],
};
assert.equal(
  colorMatchSignature(day),
  colorMatchSignature({ ...day, spacing: "joined" }),
);
assert.notEqual(
  colorMatchSignature(day),
  colorMatchSignature({ ...day, photos: [{ ...day.photos[0], x: 0.8 }] }),
);
const scored = {
  ...day,
  colorMatch: {
    version: COLOR_MATCH.version,
    signature: colorMatchSignature(day),
    score: 80,
  },
};
assert.equal(validColorMatch(scored).score, 80);
assert.equal(
  validColorMatch({
    ...scored,
    colorMatch: { ...scored.colorMatch, version: COLOR_MATCH.version - 1 },
  }),
  undefined,
);
console.log(
  "38 recipes, subject saliency, hue, neutral backgrounds, tiny patches, competing colors and cache invalidation: OK",
);

const { isChallengeLocked, isRandomChallenge } = load(
  "src/domain/challenge.ts",
);
const off = { randomCount: false },
  on = { randomCount: true };
const draft = { ...day, randomChallenge: false };
const completed = { ...draft, completedAt: "2026-10-08T10:00:00Z" };
assert.equal(isChallengeLocked(draft, off), false);
assert.equal(isChallengeLocked(draft, on), true);
assert.equal(isChallengeLocked(completed, off), true);
assert.equal(
  isRandomChallenge(completed, off),
  false,
  "Lock must not turn OFF into ON",
);
assert.equal(isChallengeLocked({ ...draft, randomChallenge: true }, off), true);
assert.equal(
  isChallengeLocked({ date: "2026-10-09", count: 6, photos: [] }, off),
  false,
);
assert.equal(
  isChallengeLocked({ date: "2026-10-09", count: 6, photos: [] }, on),
  false,
);
for (const id of ["white", "black"]) {
  const color = PALETTE.find((c) => c.id === id);
  const lab = toOklab(
    ...[1, 3, 5].map((i) => parseInt(color.hex.slice(i, i + 2), 16)),
  );
  assert.equal(score(scene(lab, lab), lab), 100);
  assert.ok(score(scene(red, red), lab) < 10);
}
console.log(
  "Completed challenge lock, preserved OFF state, midnight unlock, white/black scoring: OK",
);

const { accentTokens, contrastRatio } = load("src/ui/theme.ts");
for (const color of PALETTE) {
  const tokens = accentTokens(color.hex, true);
  assert.ok(
    contrastRatio(tokens["--accent-soft"], tokens["--control-ink"]) >= 4.5,
    `Unreadable selected control: ${color.id}`,
  );
  assert.ok(
    contrastRatio(tokens["--accent-readable-dark"], "#252d4c") >= 5.2,
    `Unreadable accent on night sky: ${color.id}`,
  );
}
const undrawn = accentTokens("#bdc1c5");
assert.equal(undrawn["--film-pink"], "#e0e5ed");
assert.equal(undrawn["--film-blue"], "#bfc8d7");
console.log(
  "38 daily colors: selected-control and night-sky text contrast, neutral undrawn film: OK",
);

const { hasSystemStatusBarInset, floatingBubblePosition } =
  load("src/ui/viewport.ts");
const iosViewport = {
  iosStandalone: true,
  safeTop: 0,
  screenHeight: 874,
  viewportHeight: 812,
  portrait: true,
  scale: 1,
};
assert.equal(hasSystemStatusBarInset(iosViewport), true);
for (const change of [
  { iosStandalone: false },
  { safeTop: 59 },
  { viewportHeight: 874 },
  { portrait: false },
  { scale: 1.2 },
  { viewportHeight: 600 },
])
  assert.equal(hasSystemStatusBarInset({ ...iosViewport, ...change }), false);
const { FLOATING_BUBBLES } = load("src/constants/liquidMotion.ts");
for (const height of [568, 812, 844]) {
  for (const bubble of FLOATING_BUBBLES) {
    const original = floatingBubblePosition(bubble, 390, height);
    assert.deepEqual(original, { x: 390 * bubble.x, y: height * bubble.y });
    const guarded = floatingBubblePosition(bubble, 390, height, true);
    assert.ok(
      guarded.y - bubble.r * 1.12 - Math.abs(bubble.dy) >= 12 - 1e-8,
      "Top contour must survive floating and deformation without being cut",
    );
    assert.equal(guarded.x, original.x);
  }
}
console.log(
  "iOS native status-bar detection, browser/zoom exclusions and complete bubble contours: OK",
);

const { fluidHandoff, fluidFilmOpacity } = load("src/ui/fluidSurface.ts");
const { FLUID_SURFACE, LIQUID_MOTION } = load("src/constants/liquidMotion.ts");
const ritualDuration =
  LIQUID_MOTION.gather + LIQUID_MOTION.swirl + LIQUID_MOTION.settle;
for (let elapsed = 0; elapsed <= ritualDuration + 100; elapsed += 10) {
  const handoff = fluidHandoff(elapsed);
  assert.ok(handoff.fluid >= 0 && handoff.fluid <= 1);
  assert.ok(handoff.main >= 0 && handoff.main <= 1);
  assert.ok(
    Math.abs(handoff.main + handoff.fluid - 1) < 1e-10,
    "SVG and fluid handoffs must neither disappear nor double their weights",
  );
}
assert.deepEqual(fluidHandoff(0), { fluid: 0, main: 1 });
assert.deepEqual(fluidHandoff(LIQUID_MOTION.gather + 500), {
  fluid: 1,
  main: 0,
});
assert.deepEqual(fluidHandoff(ritualDuration), { fluid: 0, main: 1 });
assert.equal(fluidFilmOpacity(0.9), 0);
assert.equal(fluidFilmOpacity(3), FLUID_SURFACE.interiorOpacity);
assert.ok(
  fluidFilmOpacity(1.1) > fluidFilmOpacity(3),
  "The rim must remain legible",
);

// Inspect real rendered alpha, not only the material helper. No browser or images required.
const { createFluidMix } = load("src/ui/fluidMix.ts");
let fluidPixels;
const filmCanvas = {
  width: 0,
  height: 0,
  getContext: () => ({
    createImageData: (width, height) => ({
      data: new Uint8ClampedArray(width * height * 4),
    }),
    putImageData: (image) => {
      fluidPixels = image.data;
    },
  }),
};
const drawFilm = createFluidMix(
  filmCanvas,
  { width: 96, height: 180, x: 48, y: 48, size: 40 },
  "#A9D8AE",
  "pale-green",
);
drawFilm(0);
assert.ok(fluidPixels.every((value, i) => i % 4 !== 3 || value === 0));
let visibleFilm = false;
for (let elapsed = 50; elapsed <= ritualDuration; elapsed += 50) {
  drawFilm(elapsed);
  for (let i = 3; i < fluidPixels.length; i += 4) {
    assert.ok(
      fluidPixels[i] <= Math.ceil(255 * FLUID_SURFACE.rimOpacity),
      "Even overlapping fluid pools must stay translucent",
    );
    visibleFilm ||= fluidPixels[i] > 100;
  }
}
assert.ok(visibleFilm, "Translucency must not erase the flowing contour");
assert.ok(
  fluidPixels.every((value, i) => i % 4 !== 3 || value === 0),
  "The canvas must fully hand back to the settled SVG",
);
console.log(
  "Translucent fluid pixels, visible rims and complementary SVG/canvas handoffs: OK",
);
