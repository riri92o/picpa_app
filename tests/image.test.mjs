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
const { waitForImageTask } = load("src/domain/imageTask.ts");
const { loadArtworkImage } = load("src/domain/artworkImage.ts");
assert.equal(await waitForImageTask(Promise.resolve("ready")), "ready");
await assert.rejects(
  waitForImageTask(
    Promise.reject(new DOMException("native decoder abort", "AbortError")),
  ),
  { name: "AbortError" },
);
await assert.rejects(waitForImageTask(new Promise(() => {}), undefined, 1), {
  name: "TimeoutError",
});
const cancelled = new AbortController();
let finishLate,
  lateReleases = 0;
const cancelledTask = waitForImageTask(
  new Promise((resolve) => {
    finishLate = resolve;
  }),
  cancelled.signal,
  100,
  () => lateReleases++,
);
cancelled.abort();
await assert.rejects(cancelledTask, { name: "AbortError" });
finishLate({});
await Promise.resolve();
assert.equal(
  lateReleases,
  1,
  "Late bitmap results are released after cancellation",
);

const originalBitmap = globalThis.createImageBitmap;
const originalImage = globalThis.Image;
const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;
const originalSetTimeout = globalThis.setTimeout;
const liveURLs = new Set();
URL.createObjectURL = (blob) => {
  const url = originalCreateURL(blob);
  liveURLs.add(url);
  return url;
};
URL.revokeObjectURL = (url) => {
  liveURLs.delete(url);
  originalRevokeURL(url);
};
class TestImage {
  static mode = "loaded";
  naturalWidth = 320;
  naturalHeight = 240;
  width = 0;
  height = 0;
  onload = null;
  onerror = null;
  set src(value) {
    this.currentSource = value;
    if (TestImage.mode === "loaded") queueMicrotask(() => this.onload?.());
    if (TestImage.mode === "error") queueMicrotask(() => this.onerror?.());
  }
  removeAttribute(name) {
    if (name === "src") this.currentSource = "";
  }
}
globalThis.Image = TestImage;
const blob = new Blob(["test decoder input"], { type: "image/jpeg" });
try {
  let closes = 0;
  const bitmap = {
    width: 320,
    height: 240,
    close() {
      closes++;
    },
  };
  globalThis.createImageBitmap = async () => bitmap;
  const native = await loadArtworkImage(blob, 900);
  assert.equal(native.source, bitmap);
  assert.equal(native.usedElement, false);
  native.release();
  assert.equal(closes, 1);

  globalThis.createImageBitmap = async () => {
    throw new DOMException("native decoder abort", "AbortError");
  };
  const fallback = await loadArtworkImage(blob, 900);
  assert.ok(fallback.source instanceof TestImage);
  assert.equal(fallback.source.width, 320);
  assert.equal(fallback.source.height, 240);
  assert.equal(fallback.usedElement, true);
  assert.equal(liveURLs.size, 1);
  fallback.release();
  assert.equal(liveURLs.size, 0);

  let completeBitmap;
  globalThis.createImageBitmap = () =>
    new Promise((resolve) => {
      completeBitmap = resolve;
    });
  globalThis.setTimeout = (callback, delay, ...args) =>
    originalSetTimeout(callback, delay === 3500 ? 1 : delay, ...args);
  const stalled = await loadArtworkImage(blob, 900);
  assert.equal(
    stalled.usedElement,
    true,
    "A stalled bitmap decoder falls back to the element decoder",
  );
  completeBitmap(bitmap);
  await Promise.resolve();
  assert.equal(
    closes,
    2,
    "Timed-out decoder resources are released if they arrive late",
  );
  stalled.release();
  globalThis.setTimeout = originalSetTimeout;

  globalThis.createImageBitmap = async () => {
    throw new DOMException("native abort", "AbortError");
  };
  TestImage.mode = "error";
  await assert.rejects(
    loadArtworkImage(blob, 900),
    /写真を読み込めませんでした/,
  );
  assert.equal(liveURLs.size, 0, "Failed element decoding releases its URL");

  TestImage.mode = "pending";
  const controller = new AbortController();
  const pending = loadArtworkImage(blob, 900, controller.signal);
  await new Promise((resolve) => originalSetTimeout(resolve, 0));
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(
    liveURLs.size,
    0,
    "Closing the view releases a pending element decode",
  );
} finally {
  globalThis.createImageBitmap = originalBitmap;
  globalThis.Image = originalImage;
  globalThis.setTimeout = originalSetTimeout;
  URL.createObjectURL = originalCreateURL;
  URL.revokeObjectURL = originalRevokeURL;
}
console.log(
  "Image loading: native AbortError fallback, stalled decoder fallback, bounded waits, cancellation, late bitmap disposal and object URL cleanup: OK",
);
