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
const { PALETTE, DEFAULT_COLOR } = load("src/constants/palette.ts");
const { MIX_RECIPES } = load("src/constants/mixRecipes.ts");
const { buildColorCollection } = load("src/domain/colorCollection.ts");
const { chooseDailyColor } = load("src/domain/color.ts");
const legacy = JSON.parse(
  fs.readFileSync("tests/fixtures/palette-v0.2.json", "utf8"),
);
assert.equal(PALETTE.length, 64);
assert.equal(new Set(PALETTE.map((c) => c.id)).size, 64);
assert.equal(DEFAULT_COLOR.id, "pale-green");
for (const color of legacy)
  assert.deepEqual(
    PALETTE.find((c) => c.id === color.id),
    color,
    `Legacy identity and exact colors: ${color.id}`,
  );
for (const color of PALETTE) {
  assert.match(color.hex, /^#[0-9A-F]{6}$/);
  assert.match(color.tint, /^#[0-9A-F]{6}$/);
  assert.ok(MIX_RECIPES[color.id]?.length >= 2);
}
const day = (date, colorId, completed = true) => ({
  date,
  colorId,
  count: 4,
  photos: [{ id: "kept-photo", zoom: 1.4, x: 0.2, y: -0.1, rotation: 90 }],
  ...(completed ? { completedAt: `${date}T12:00:00.000Z` } : {}),
});
const days = [
  day("2026-10-01", "pale-green"),
  day("2026-11-01", "pale-green"),
  day("2026-11-04", "cobalt"),
  day("2026-11-03", "red", false),
  day("2026-10-02", "unknown-color"),
  day("2026-10-03", undefined),
];
const original = structuredClone(days),
  paletteBefore = structuredClone(PALETTE);
const collection = buildColorCollection(days);
assert.equal(collection.total, 64);
assert.equal(
  collection.collected.length,
  2,
  "Only completed, recognized colors count; repeated colors count once",
);
assert.equal(collection.completedCount, 3);
assert.equal(collection.mostRecentColorId, "cobalt");
assert.deepEqual(
  collection.colors
    .find((c) => c.color.id === "pale-green")
    .days.map((d) => d.date),
  ["2026-11-01", "2026-10-01"],
);
assert.equal(
  collection.colors.find((c) => c.color.id === "red").days.length,
  0,
);
assert.equal(
  collection.colors.find((c) => c.color.id === "pale-green").days[0],
  days[1],
  "Records are referenced, not cloned or rewritten",
);
assert.deepEqual(days, original);
assert.deepEqual(PALETTE, paletteBefore);
assert.equal(buildColorCollection([]).collected.length, 0);
assert.equal(buildColorCollection([], []).total, 0);
const future = [
  ...PALETTE,
  ...Array.from({ length: 64 }, (_, i) => ({
    id: `future-${i}`,
    name: `future ${i}`,
    hex: "#A9D8AE",
    tint: "#F0F8F1",
  })),
];
assert.equal(
  buildColorCollection([...days, day("2026-11-05", "future-63")], future).total,
  128,
);
assert.equal(
  buildColorCollection([...days, day("2026-11-05", "future-63")], future)
    .collected.length,
  3,
);
const updated = days.map((d) => ({
  ...d,
  memo: "変更",
  spacing: "joined",
  artworkStyle: "palette",
}));
assert.deepEqual(
  buildColorCollection(updated).collected.map((c) => [
    c.color.id,
    c.days.length,
  ]),
  collection.collected.map((c) => [c.color.id, c.days.length]),
);
for (const color of PALETTE) {
  const id = chooseDailyColor(
    PALETTE.filter((c) => c.id !== color.id)
      .slice(0, 3)
      .map((c, i) => day(`2026-11-0${i + 1}`, c.id)),
  );
  assert.ok(PALETTE.some((c) => c.id === id));
}
const added = PALETTE.filter((c) => !legacy.some((old) => old.id === c.id));
const originalCrypto = globalThis.crypto;
try {
  for (const color of added) {
    const index = PALETTE.findIndex((c) => c.id === color.id);
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (values) => {
          values[0] = index;
          return values;
        },
      },
    });
    assert.equal(
      chooseDailyColor([]),
      color.id,
      "Each new color can actually be drawn",
    );
  }
} finally {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: originalCrypto,
  });
}
console.log(
  "Collection: 64 colors, exact 38-color legacy identity, completed-only counts, same-color history, future palette growth, input immutability and all new daily draw candidates: OK",
);
