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
const {
  PHOTO_FILTERS,
  PHOTO_FILTER_TABLES,
  PHOTO_FILTER_SVG_TABLES,
  filterPhotoPixels,
  isPhotoFilter,
  resolvePhotoFilter,
  photoPlacementSignature,
} = load("src/domain/photoFilter.ts");
const { colorMatchSignature, validColorMatch } = load(
  "src/domain/colorMatch.ts",
);
const { createBackup, readBackup, planBackupMerge, validateBackupSnapshot } =
  load("src/domain/backup.ts");
const { backupPhotoRepairCandidates } = load("src/domain/backupRepair.ts");

assert.deepEqual(
  PHOTO_FILTERS.map((f) => f.id),
  ["none", "natural", "warm", "cool", "film", "soft"],
);
for (const value of [null, 0, {}, "unknown", "WARM"])
  assert.equal(isPhotoFilter(value), false);
assert.equal(resolvePhotoFilter(), "none");
assert.equal(resolvePhotoFilter("unknown"), "none");
const ramp = Uint8ClampedArray.from({ length: 256 * 4 }, (_, i) =>
  i % 4 === 3 ? 255 : Math.floor(i / 4),
);
const outputs = new Set();
for (const { id } of PHOTO_FILTERS) {
  const pixels = ramp.slice();
  filterPhotoPixels(pixels, id);
  if (id === "none") assert.deepEqual(pixels, ramp);
  outputs.add(Buffer.from(pixels).toString("hex"));
  for (let channel = 0; channel < 3; channel++) {
    const table = PHOTO_FILTER_TABLES[id][channel];
    assert.equal(table.length, 256);
    for (let i = 1; i < 256; i++)
      assert.ok(
        table[i] >= table[i - 1],
        "Tone curves preserve tonal ordering",
      );
    assert.deepEqual(
      PHOTO_FILTER_SVG_TABLES[id][channel]
        .split(" ")
        .map((n) => Math.round(Number(n) * 255)),
      Array.from(table),
      "Preview and export use exactly the same RGB table",
    );
  }
  const alpha = new Uint8ClampedArray([
    31, 72, 123, 0, 31, 72, 123, 128, 31, 72, 123, 255,
  ]);
  filterPhotoPixels(alpha, id);
  assert.deepEqual(Array.from(alpha.slice(0, 4)), [31, 72, 123, 0]);
  assert.deepEqual([alpha[3], alpha[7], alpha[11]], [0, 128, 255]);
}
assert.equal(outputs.size, 6, "All five grades produce a distinct image");
const neutral = (id) => {
  const pixel = new Uint8ClampedArray([128, 128, 128, 255]);
  filterPhotoPixels(pixel, id);
  return pixel;
};
assert.ok(neutral("warm")[0] > neutral("warm")[2]);
assert.ok(neutral("cool")[2] > neutral("cool")[0]);
assert.ok(neutral("soft")[0] > 128);
assert.ok(
  PHOTO_FILTER_TABLES.film[0][0] > 0 && PHOTO_FILTER_TABLES.film[0][255] < 255,
);

const photos = PHOTO_FILTERS.map((filter, i) => ({
  id: `photo-${i}`,
  zoom: 1.3,
  x: 0.2,
  y: -0.1,
  rotation: i % 2 ? 90 : 0,
  ...(i ? { filter: filter.id } : {}),
}));
const day = {
  date: "2026-11-09",
  count: 6,
  colorId: "pale-green",
  photos,
  completedAt: "2026-11-09T12:00:00.000Z",
  memo: "写真ごとに違う色合い",
  artworkStyle: "palette",
  spacing: "joined",
};
const legacy = { ...day, photos: photos.map(({ filter, ...p }) => p) };
const legacySignature = JSON.stringify([
  legacy.count,
  legacy.colorId,
  legacy.photos.map((p) => [p.id, p.x, p.y, p.zoom, p.rotation]),
]);
assert.equal(colorMatchSignature(legacy), legacySignature);
assert.equal(
  colorMatchSignature({
    ...legacy,
    photos: legacy.photos.map((p) => ({ ...p, filter: "none" })),
  }),
  legacySignature,
);
assert.notEqual(colorMatchSignature(day), legacySignature);
for (let i = 1; i < photos.length; i++)
  assert.deepEqual(
    photoPlacementSignature(photos[i]).slice(0, 5),
    photoPlacementSignature(legacy.photos[i]),
  );
const scored = {
  ...day,
  colorMatch: {
    version: 3,
    signature: colorMatchSignature(day),
    score: 80,
    similarity: 0.8,
    coverage: 0.6,
    photos: photos.map((p) => ({
      id: p.id,
      score: 80,
      similarity: 0.8,
      coverage: 0.6,
    })),
  },
};
assert.ok(validColorMatch(scored));
assert.equal(
  validColorMatch({
    ...scored,
    photos: photos.map((p, i) => (i === 1 ? { ...p, filter: "cool" } : p)),
  }),
  undefined,
  "Changing one filter invalidates only the derived score cache",
);

const png = new Blob(
  [
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADklEQVR4AWL6////fwAAAAD//w7I1cwAAAAGSURBVAMACgUD/9k79a8AAAAASUVORK5CYII=",
      "base64",
    ),
  ],
  { type: "image/png" },
);
const settings = {
  theme: "dark",
  randomCount: false,
  exportLogo: true,
  tutorialSeen: true,
};
const assets = photos.map((p) => ({
  id: p.id,
  full: png,
  thumb: png,
  width: 1,
  height: 1,
  createdAt: "2026-11-09T12:00:00.000Z",
}));
const snapshot = { days: [scored], settings, assets };
const decoded = await readBackup(await createBackup(snapshot));
assert.deepEqual(
  decoded.days,
  snapshot.days,
  "Every photo's grade and score survive backup roundtrip",
);
for (const asset of decoded.assets)
  assert.deepEqual(
    new Uint8Array(await asset.full.arrayBuffer()),
    new Uint8Array(await png.arrayBuffer()),
    "Backup contains the original bytes",
  );
let serial = 0;
const plan = planBackupMerge(
  decoded,
  [],
  new Set(),
  () => `restored-${serial++}`,
);
assert.deepEqual(
  plan.days[0].photos.map((p) => p.filter),
  photos.map((p) => p.filter),
);
assert.equal(
  plan.days[0].colorMatch.signature,
  colorMatchSignature(plan.days[0]),
  "Restore remaps scored photo IDs and retains filters in the signature",
);
assert.equal(backupPhotoRepairCandidates(decoded, plan.days).length, 6);
assert.equal(
  backupPhotoRepairCandidates(decoded, [
    {
      ...plan.days[0],
      photos: plan.days[0].photos.map((p, i) =>
        i === 2 ? { ...p, filter: "soft" } : p,
      ),
    },
  ]).length,
  0,
  "A different photo edit is not treated as the same capture",
);
for (const invalid of ["future-filter", 0, null, {}])
  assert.throws(
    () =>
      validateBackupSnapshot({
        ...snapshot,
        days: [
          {
            ...scored,
            photos: photos.map((p, i) => (i ? p : { ...p, filter: invalid })),
          },
        ],
      }),
    /破損/,
  );
const legacySnapshot = { ...snapshot, days: [legacy] };
const legacyDecoded = await readBackup(await createBackup(legacySnapshot));
assert.deepEqual(
  legacyDecoded.days,
  [legacy],
  "Legacy records are not rewritten to add default fields",
);
console.log(
  "Photo filters: five distinct monotone sRGB grades, alpha preservation, shared SVG/Canvas tables, legacy signatures, per-photo scoring, byte-exact backup and ID remapping, schema and repair matching: OK",
);
