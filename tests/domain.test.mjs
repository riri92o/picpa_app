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
const vermilion = toOklab(222, 136, 108);
const warmBeige = toOklab(216, 204, 176);
const paleGreen = toOklab(169, 216, 174);
const greenWithWarmBackground = Array.from({ length: 3600 }, (_, i) =>
  i % 60 < 42 ? warmBeige : paleGreen,
);
assert.ok(
  score(greenWithWarmBackground, vermilion) < 40,
  "Pale-green photos with warm neutral areas must not score as vermilion",
);
assert.ok(
  score(scene(white, paleGreen, 0.16), paleGreen) >= 85,
  "Tighter color separation must preserve a matching pale-green subject",
);
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
    contrastRatio(tokens["--accent-readable-dark"], tokens["--sky-surface"]) >=
      5.2,
    `Unreadable accent on night sky: ${color.id}`,
  );
}
const undrawn = accentTokens("#bdc1c5");
assert.equal(undrawn["--film-pink"], "#e0e5ed");
assert.equal(undrawn["--film-blue"], "#bfc8d7");
const sceneSamples = Object.fromEntries(
  ["red", "leaf", "blue"].map((id) => {
    const color = PALETTE.find((item) => item.id === id);
    return [id, accentTokens(color.hex, true)];
  }),
);
assert.equal(
  new Set(Object.values(sceneSamples).map((t) => t["--sky-bottom"])).size,
  3,
);
assert.equal(
  new Set(Object.values(sceneSamples).map((t) => t["--film-blue"])).size,
  3,
);
assert.equal(
  undrawn["--sky-page"],
  accentTokens("#bdc1c5", false)["--sky-page"],
);
console.log(
  "38 daily colors: selected-control and themed-surface contrast, neutral undrawn film, red/green/blue scenes: OK",
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

const { collageBrandHeader } = load("src/domain/branding.ts");
const { gridDimensions } = load("src/domain/image.ts");
const { collageLayout } = load("src/domain/collageLayout.ts");
for (const count of [4, 6, 9]) {
  const [columns, rows] = gridDimensions(count);
  const cellWidth = count === 9 ? 340 : 510;
  const cellHeight = count === 9 ? 340 : count === 4 ? 455 : 408;
  for (const gap of [0, 7]) {
    const width = columns * cellWidth + (columns - 1) * gap;
    const height = rows * cellHeight + (rows - 1) * gap;
    const layout = collageLayout(count, gap ? "separated" : "joined");
    assert.equal(layout.width, width);
    assert.equal(layout.height, height);
    assert.equal(layout.gap, gap);
    const header = collageBrandHeader(width, true);
    const logo = header.logo;
    assert.equal(logo.x, width / 2);
    assert.ok(logo.x - logo.width / 2 > 0 && logo.x + logo.width / 2 < width);
    assert.ok(
      logo.y - logo.height / 2 > 0 && logo.y + logo.height / 2 < header.height,
      "The logo must stay entirely above the photos",
    );
    assert.ok(
      header.height < height / 4,
      "Branding must not dominate the collage",
    );
    assert.deepEqual(collageBrandHeader(width, false), {
      height: 0,
      logo: undefined,
    });
  }
}
console.log(
  "White logo: metallic header stays above 4/6/9 photos and is removed when OFF: OK",
);

const { OPENING_BUBBLES, OPENING_MOTION } = load("src/constants/branding.ts");
const { openingBubbleOffset } = load("src/ui/openingMotion.ts");
let openingTravel = 0;
for (const [index, bubble] of OPENING_BUBBLES.entries()) {
  const start = openingBubbleOffset(bubble, index, 0);
  const end = openingBubbleOffset(
    bubble,
    index,
    OPENING_MOTION.minimumDuration,
  );
  openingTravel += Math.hypot(end.x - start.x, end.y - start.y);
  let previous = start;
  for (let time = 0; time < bubble.period * 1000; time += 100) {
    const position = openingBubbleOffset(bubble, index, time);
    assert.ok(Math.abs(position.x) <= Math.abs(bubble.dx) + 1e-8);
    assert.ok(Math.abs(position.y) <= bubble.dy + 1e-8);
    assert.ok(
      Math.hypot(position.x - previous.x, position.y - previous.y) < 2.5,
      "Opening bubbles must drift gently, below 25 pixels per second",
    );
    previous = position;
  }
}
assert.ok(
  openingTravel / OPENING_BUBBLES.length > 12,
  "Floating must be visible during the short opening",
);
console.log(
  "Opening float: gentle continuous drift and visible travel during launch: OK",
);

const { COLOR_HINTS } = load("src/constants/colorHints.ts");
assert.deepEqual(
  Object.keys(COLOR_HINTS).sort(),
  PALETTE.map((color) => color.id).sort(),
);
for (const color of PALETTE) {
  const hint = COLOR_HINTS[color.id];
  assert.ok(hint.description.trim(), `Missing color description: ${color.id}`);
  assert.equal(
    new Set(hint.examples).size,
    3,
    `Need three distinct examples: ${color.id}`,
  );
  assert.ok(hint.examples.every((example) => example.trim()));
}
const { withArtworkMemo, memoLength, MEMO_MAX_LENGTH } =
  load("src/domain/memo.ts");
const memoSource = {
  ...scored,
  completedAt: "2026-10-08T10:00:00Z",
  spacing: "joined",
};
const memoResult = withArtworkMemo(
  memoSource,
  "  散歩で見つけた緑。\r\n葉っぱがきれい。  ",
);
assert.equal(memoResult.memo, "散歩で見つけた緑。\n葉っぱがきれい。");
assert.deepEqual(
  Object.fromEntries(
    Object.entries(memoResult).filter(([key]) => key !== "memo"),
  ),
  memoSource,
);
assert.equal(
  memoSource.memo,
  undefined,
  "Adding a memo must not mutate the existing record",
);
assert.equal(
  validColorMatch(memoResult).score,
  80,
  "Memo edits must not invalidate photo scoring",
);
assert.equal(withArtworkMemo(memoResult, " \n ").memo, undefined);
const emojiMemo = withArtworkMemo(
  memoSource,
  "🌿".repeat(MEMO_MAX_LENGTH + 1),
).memo;
assert.equal(memoLength(emojiMemo), MEMO_MAX_LENGTH);
assert.equal(
  emojiMemo,
  "🌿".repeat(MEMO_MAX_LENGTH),
  "The memo limit must not split emoji surrogate pairs",
);
console.log(
  "38 color hints; legacy, completed, cleared and Unicode memos preserve photos and scores: OK",
);
