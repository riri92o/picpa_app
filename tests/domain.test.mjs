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
