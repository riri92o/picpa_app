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
const { createBackup, readBackup, planBackupMerge, assetsForDeletedDays } =
  load("src/domain/backup.ts");
const png = new Blob(
  [
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADklEQVR4AWL6////fwAAAAD//w7I1cwAAAAGSURBVAMACgUD/9k79a8AAAAASUVORK5CYII=",
      "base64",
    ),
  ],
  { type: "image/png" },
);
const assets = Array.from({ length: 5 }, (_, i) => ({
  id: `photo-${i}`,
  full: png,
  thumb: png,
  width: 1,
  height: 1,
  createdAt: "2026-10-01T12:00:00.000Z",
}));
const photos = assets.slice(0, 4).map((asset, i) => ({
  id: asset.id,
  zoom: i === 0 ? 2.4 : 1,
  x: i === 0 ? -1 : 0,
  y: i === 0 ? 1 : 0,
  rotation: i * 90,
}));
const day = {
  date: "2026-10-01",
  count: 4,
  colorId: "pale-green",
  spacing: "joined",
  artworkStyle: "bubble-window",
  randomChallenge: true,
  photos,
  completedAt: "2026-10-01T12:00:00.000Z",
  memo: "秋の色。🫧\nまた見たい風景",
};
const signature = (value) =>
  JSON.stringify([
    value.count,
    value.colorId,
    value.photos.map((p) => [p.id, p.x, p.y, p.zoom, p.rotation]),
  ]);
day.colorMatch = {
  version: 3,
  signature: signature(day),
  score: 83,
  similarity: 0.83,
  coverage: 0.6,
  photos: photos.map((p) => ({
    id: p.id,
    score: 83,
    similarity: 0.83,
    coverage: 0.6,
  })),
};
const settings = {
  theme: "system",
  randomCount: true,
  exportLogo: false,
  tutorialSeen: true,
  photoQuality: "high",
  futureFlag: "preserved",
};
const snapshot = {
  days: [day, { date: "2026-10-02", count: 6, photos: [] }],
  settings,
  assets,
};
const file = await createBackup(snapshot);
const decoded = await readBackup(file);
assert.deepEqual(decoded.days, snapshot.days);
assert.deepEqual(decoded.settings, settings);
assert.equal(
  decoded.assets.length,
  assets.length,
  "Whole backup preserves even currently unreferenced photo bytes",
);
for (const [i, asset] of decoded.assets.entries()) {
  assert.equal(asset.id, assets[i].id);
  assert.equal(asset.full.type, "image/png");
  assert.deepEqual(
    new Uint8Array(await asset.full.arrayBuffer()),
    new Uint8Array(await assets[i].full.arrayBuffer()),
  );
  assert.deepEqual(
    new Uint8Array(await asset.thumb.arrayBuffer()),
    new Uint8Array(await assets[i].thumb.arrayBuffer()),
  );
}
const empty = {
  days: [],
  settings: {
    theme: "light",
    randomCount: false,
    exportLogo: true,
    tutorialSeen: false,
  },
  assets: [],
};
assert.deepEqual(
  await readBackup(await createBackup(empty)),
  empty,
  "Empty records and legacy settings without quality remain valid",
);

async function editManifest(blob, edit) {
  const old = new Uint8Array(await blob.slice(0, 24).arrayBuffer());
  const length = new DataView(old.buffer).getUint32(16, true);
  const manifest = JSON.parse(await blob.slice(24, 24 + length).text());
  edit(manifest);
  const encoded = new TextEncoder().encode(JSON.stringify(manifest));
  new DataView(old.buffer).setUint32(16, encoded.byteLength, true);
  return new Blob([old, encoded, blob.slice(24 + length)]);
}
for (const [name, mutate] of [
  [
    "missing referenced photo",
    (manifest) => {
      manifest.days[0].photos[0].id = "missing-photo";
    },
  ],
  [
    "duplicate dates",
    (manifest) => {
      manifest.days.push(manifest.days[0]);
    },
  ],
  [
    "duplicate IDs",
    (manifest) => {
      manifest.assets[1].id = manifest.assets[0].id;
    },
  ],
  [
    "invalid local date",
    (manifest) => {
      manifest.days[0].date = "2026-02-31";
    },
  ],
  [
    "unknown palette",
    (manifest) => {
      manifest.days[0].colorId = "new-color";
    },
  ],
  [
    "invalid crop",
    (manifest) => {
      manifest.days[0].photos[0].zoom = 0;
    },
  ],
  [
    "invalid rotation",
    (manifest) => {
      manifest.days[0].photos[0].rotation = 45;
    },
  ],
  [
    "incomplete completed record",
    (manifest) => {
      manifest.days[0].photos.pop();
    },
  ],
  [
    "invalid setting",
    (manifest) => {
      manifest.settings.photoQuality = "unlimited";
    },
  ],
  [
    "non-image body",
    (manifest) => {
      manifest.assets[0].full.type = "text/html";
    },
  ],
  [
    "wrong checksum",
    (manifest) => {
      manifest.assets[0].full.sha256 = "0".repeat(64);
    },
  ],
])
  await assert.rejects(
    async () => readBackup(await editManifest(file, mutate)),
    undefined,
    name,
  );
// A malformed input must fail without relying only on a readable JSON manifest.
await assert.rejects(() => readBackup(file.slice(0, file.size - 1)), /破損/);
await assert.rejects(
  () => readBackup(new Blob([file, new Uint8Array([0])])),
  /破損/,
);
const bytes = new Uint8Array(await file.arrayBuffer());
bytes[bytes.length - 1] ^= 1;
await assert.rejects(() => readBackup(new Blob([bytes])), /破損/);
const future = new Uint8Array(await file.arrayBuffer());
new DataView(future.buffer).setUint32(12, 999, true);
await assert.rejects(() => readBackup(new Blob([future])), /最新版/);
await assert.rejects(() => readBackup(new Blob(["ordinary text"])), /破損/);
await assert.rejects(
  () => createBackup({ ...snapshot, assets: assets.slice(1) }),
  /破損/,
);

const sourceBefore = structuredClone(decoded.days);
let nextId = 0;
const current = [
  { ...day, memo: "Keep this device's record", date: "2026-10-02" },
];
const plan = planBackupMerge(
  decoded,
  current,
  new Set(["restored-0"]),
  () => `restored-${nextId++}`,
);
assert.deepEqual(plan.result, { addedDays: 1, skippedDays: 1, addedPhotos: 4 });
assert.equal(plan.days[0].date, day.date);
assert.equal(
  plan.assets[0].id,
  "restored-1",
  "Even an imported-ID collision never overwrites an existing photo",
);
assert.equal(new Set(plan.assets.map((a) => a.id)).size, 4);
assert.deepEqual(
  plan.days[0].photos.map((p) => p.id),
  plan.assets.map((a) => a.id),
);
assert.equal(plan.days[0].memo, day.memo);
assert.equal(plan.days[0].completedAt, day.completedAt);
assert.equal(plan.days[0].colorMatch.signature, signature(plan.days[0]));
assert.equal(plan.days[0].colorMatch.score, day.colorMatch.score);
assert.deepEqual(
  plan.days[0].colorMatch.photos.map((p) => p.id),
  plan.days[0].photos.map((p) => p.id),
);
assert.deepEqual(
  decoded.days,
  sourceBefore,
  "Merge never mutates the preview snapshot",
);
assert.equal(current[0].memo, "Keep this device's record");
const stale = structuredClone(decoded);
stale.days[0].colorMatch.signature = "outdated-cache";
assert.equal(
  planBackupMerge(stale, [], new Set()).days[0].colorMatch.signature,
  "outdated-cache",
  "A stale cache must not be made valid by restoring",
);
const allSkipped = planBackupMerge(decoded, decoded.days, new Set());
assert.deepEqual(allSkipped.result, {
  addedDays: 0,
  skippedDays: 2,
  addedPhotos: 0,
});
assert.deepEqual(allSkipped.assets, []);
const shared = [
  { ...day },
  { ...day, date: "2026-10-03", photos: [photos[0]] },
];
assert.deepEqual(
  assetsForDeletedDays(shared, [day.date]),
  photos.slice(1).map((p) => p.id),
  "An asset still referenced by another record is retained",
);
assert.deepEqual(assetsForDeletedDays(shared, []), []);
assert.deepEqual(
  new Set(assetsForDeletedDays(shared, [day.date, "2026-10-03"])),
  new Set(photos.map((p) => p.id)),
);
console.log(
  "Backup: byte-exact binary roundtrip, legacy/quality settings, metadata/score preservation, corrupt/version/schema rejection, conflict-safe merge, shared-photo deletion: OK",
);
