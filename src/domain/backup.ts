import { PALETTE } from "../constants/palette";
import type {
  AppSettings,
  ColorMatchResult,
  DayRecord,
  PhotoAsset,
  PhotoPlacement,
} from "./types";

export interface BackupSnapshot {
  days: DayRecord[];
  settings: AppSettings;
  assets: PhotoAsset[];
}
export interface BackupMergeResult {
  addedDays: number;
  skippedDays: number;
  addedPhotos: number;
}
interface ImageEntry {
  size: number;
  type: string;
  sha256: string;
}
interface BackupAsset {
  id: string;
  width: number;
  height: number;
  createdAt: string;
  full: ImageEntry;
  thumb: ImageEntry;
}
interface Manifest {
  app: "PicPa";
  createdAt: string;
  days: DayRecord[];
  settings: AppSettings;
  assets: BackupAsset[];
}

const MAGIC = new TextEncoder().encode("PICPA-BACKUP");
const HEADER_SIZE = 24;
const VERSION = 1;
const MAX_MANIFEST = 16 * 1024 * 1024;
const MAX_IMAGE = 64 * 1024 * 1024;
const MAX_ITEMS = 65536;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const colors = new Set(PALETTE.map((color) => color.id));
const styles = new Set([
  "black-frame",
  "white-frame",
  "specimen",
  "bubble-window",
  "palette",
]);
const invalid = () =>
  new Error("バックアップの内容が正しくないか、ファイルが破損しています");
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const number = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
const id = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 256;
const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 80 &&
  Number.isFinite(Date.parse(value));
function dateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function settings(value: unknown): asserts value is AppSettings {
  if (
    !object(value) ||
    !["light", "dark", "system"].includes(String(value.theme)) ||
    typeof value.randomCount !== "boolean" ||
    typeof value.exportLogo !== "boolean" ||
    typeof value.tutorialSeen !== "boolean" ||
    (value.photoQuality !== undefined &&
      !["compact", "standard", "high"].includes(String(value.photoQuality)))
  )
    throw invalid();
}
function placement(value: unknown): asserts value is PhotoPlacement {
  if (
    !object(value) ||
    !id(value.id) ||
    !number(value.zoom, 1, 2.4) ||
    !number(value.x, -1, 1) ||
    !number(value.y, -1, 1) ||
    ![0, 90, 180, 270].includes(Number(value.rotation)) ||
    typeof value.rotation !== "number"
  )
    throw invalid();
}
function score(
  value: unknown,
  photos: PhotoPlacement[],
): asserts value is ColorMatchResult {
  if (
    !object(value) ||
    !Number.isSafeInteger(value.version) ||
    !number(value.version, 1, 1000000) ||
    typeof value.signature !== "string" ||
    value.signature.length > 8192 ||
    !number(value.score, 0, 100) ||
    !number(value.similarity, 0, 1.000001) ||
    !number(value.coverage, 0, 1.000001) ||
    !Array.isArray(value.photos) ||
    value.photos.length !== photos.length
  )
    throw invalid();
  const ids = new Set(photos.map((photo) => photo.id));
  for (const photo of value.photos) {
    if (
      !object(photo) ||
      !id(photo.id) ||
      !ids.delete(photo.id) ||
      !number(photo.score, 0, 100) ||
      !number(photo.similarity, 0, 1.000001) ||
      !number(photo.coverage, 0, 1.000001)
    )
      throw invalid();
  }
}
function day(value: unknown): asserts value is DayRecord {
  if (
    !object(value) ||
    !dateKey(value.date) ||
    ![4, 6, 9].includes(Number(value.count)) ||
    typeof value.count !== "number" ||
    (value.colorId !== undefined &&
      (typeof value.colorId !== "string" || !colors.has(value.colorId))) ||
    (value.spacing !== undefined &&
      !["joined", "separated"].includes(String(value.spacing))) ||
    (value.artworkStyle !== undefined &&
      (typeof value.artworkStyle !== "string" ||
        !styles.has(value.artworkStyle))) ||
    (value.randomChallenge !== undefined &&
      typeof value.randomChallenge !== "boolean") ||
    (value.memo !== undefined &&
      (typeof value.memo !== "string" ||
        Array.from(value.memo).length > 100)) ||
    !Array.isArray(value.photos) ||
    value.photos.length > Number(value.count)
  )
    throw invalid();
  const ids = new Set<string>();
  for (const photo of value.photos) {
    placement(photo);
    if (ids.has(photo.id)) throw invalid();
    ids.add(photo.id);
  }
  if (value.photos.length && !value.colorId) throw invalid();
  if (
    value.completedAt !== undefined &&
    (!timestamp(value.completedAt) ||
      !value.colorId ||
      value.photos.length !== value.count)
  )
    throw invalid();
  if (value.colorMatch !== undefined) score(value.colorMatch, value.photos);
}
function assetMetadata(
  value: unknown,
): asserts value is Pick<PhotoAsset, "id" | "width" | "height" | "createdAt"> &
  Record<string, unknown> {
  if (
    !object(value) ||
    !id(value.id) ||
    !Number.isSafeInteger(value.width) ||
    !number(value.width, 1, 131072) ||
    !Number.isSafeInteger(value.height) ||
    !number(value.height, 1, 131072) ||
    !timestamp(value.createdAt)
  )
    throw invalid();
}
function records(
  days: unknown,
  assetIds: Set<string>,
): asserts days is DayRecord[] {
  if (!Array.isArray(days) || days.length > MAX_ITEMS) throw invalid();
  const dates = new Set<string>();
  for (const value of days) {
    day(value);
    if (dates.has(value.date)) throw invalid();
    dates.add(value.date);
    if (value.photos.some((photo) => !assetIds.has(photo.id))) throw invalid();
  }
}
/** Also guards direct storage imports, without asynchronous work inside a transaction. */
export function validateBackupSnapshot(
  value: unknown,
): asserts value is BackupSnapshot {
  if (
    !object(value) ||
    !Array.isArray(value.assets) ||
    value.assets.length > MAX_ITEMS
  )
    throw invalid();
  settings(value.settings);
  const ids = new Set<string>();
  for (const asset of value.assets) {
    assetMetadata(asset);
    if (!object(asset) || ids.has(asset.id)) throw invalid();
    ids.add(asset.id);
    for (const blob of [asset.full, asset.thumb])
      if (
        !(blob instanceof Blob) ||
        !imageTypes.has(blob.type) ||
        blob.size <= 0 ||
        blob.size > MAX_IMAGE
      )
        throw invalid();
  }
  records(value.days, ids);
}
async function hash(blob: Blob) {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "この環境ではバックアップを確認できません。通常のブラウザで開いてください",
    );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
async function imageSignature(blob: Blob, decode: boolean) {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (byte, i) => bytes[i] === byte,
  );
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (
    !(blob.type === "image/jpeg"
      ? jpeg
      : blob.type === "image/png"
        ? png
        : webp)
  )
    throw invalid();
  if (decode && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      bitmap.close();
    } catch {
      throw invalid();
    }
  }
}
/** One manifest plus original binary parts; no base64 copy or photo recompression. */
export async function createBackup(snapshot: BackupSnapshot): Promise<Blob> {
  validateBackupSnapshot(snapshot);
  const assets: BackupAsset[] = [];
  const parts: Blob[] = [];
  for (const asset of snapshot.assets) {
    const entry = async (blob: Blob): Promise<ImageEntry> => {
      await imageSignature(blob, false);
      return { size: blob.size, type: blob.type, sha256: await hash(blob) };
    };
    assets.push({
      id: asset.id,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,
      full: await entry(asset.full),
      thumb: await entry(asset.thumb),
    });
    parts.push(asset.full, asset.thumb);
  }
  const manifest: Manifest = {
    app: "PicPa",
    createdAt: new Date().toISOString(),
    days: snapshot.days,
    settings: snapshot.settings,
    assets,
  };
  const encoded = new TextEncoder().encode(JSON.stringify(manifest));
  if (encoded.byteLength > MAX_MANIFEST)
    throw new Error("記録が多いため、月や作品を選んでバックアップしてください");
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC);
  const view = new DataView(header.buffer);
  view.setUint32(12, VERSION, true);
  view.setUint32(16, encoded.byteLength, true);
  return new Blob([header, encoded, ...parts], {
    type: "application/octet-stream",
  });
}
/** Fully validates the selected file before any caller starts its write transaction. */
export async function readBackup(file: Blob): Promise<BackupSnapshot> {
  if (!(file instanceof Blob) || file.size < HEADER_SIZE) throw invalid();
  const header = new Uint8Array(await file.slice(0, HEADER_SIZE).arrayBuffer());
  if (!MAGIC.every((byte, i) => header[i] === byte))
    throw new Error("PicPaのバックアップファイル（.picpa）を選んでください");
  const view = new DataView(header.buffer);
  if (view.getUint32(12, true) !== VERSION)
    throw new Error(
      "このバックアップの形式には対応していません。PicPaを最新版に更新してください",
    );
  const length = view.getUint32(16, true);
  if (
    !length ||
    length > MAX_MANIFEST ||
    HEADER_SIZE + length > file.size ||
    view.getUint32(20, true) !== 0
  )
    throw invalid();
  let value: unknown;
  try {
    value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await file.slice(HEADER_SIZE, HEADER_SIZE + length).arrayBuffer(),
      ),
    );
  } catch {
    throw invalid();
  }
  if (
    !object(value) ||
    value.app !== "PicPa" ||
    !timestamp(value.createdAt) ||
    !Array.isArray(value.assets) ||
    value.assets.length > MAX_ITEMS
  )
    throw invalid();
  settings(value.settings);
  const ids = new Set<string>();
  let expected = HEADER_SIZE + length;
  for (const asset of value.assets) {
    assetMetadata(asset);
    if (!object(asset) || ids.has(asset.id)) throw invalid();
    ids.add(asset.id);
    for (const entry of [asset.full, asset.thumb]) {
      if (
        !object(entry) ||
        !Number.isSafeInteger(entry.size) ||
        !number(entry.size, 1, MAX_IMAGE) ||
        typeof entry.type !== "string" ||
        !imageTypes.has(entry.type) ||
        typeof entry.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(entry.sha256)
      )
        throw invalid();
      expected += entry.size;
      if (!Number.isSafeInteger(expected) || expected > file.size)
        throw invalid();
    }
  }
  if (expected !== file.size) throw invalid();
  records(value.days, ids);
  const manifest = value as unknown as Manifest;
  let offset = HEADER_SIZE + length;
  const assets: PhotoAsset[] = [];
  for (const asset of manifest.assets) {
    const read = async (entry: ImageEntry) => {
      const blob = file.slice(offset, offset + entry.size, entry.type);
      offset += entry.size;
      if ((await hash(blob)) !== entry.sha256) throw invalid();
      await imageSignature(blob, true);
      return blob;
    };
    assets.push({
      id: asset.id,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,
      full: await read(asset.full),
      thumb: await read(asset.thumb),
    });
  }
  return { days: manifest.days, settings: manifest.settings, assets };
}

const signature = (day: DayRecord) =>
  JSON.stringify([
    day.count,
    day.colorId,
    day.photos.map((p) => [p.id, p.x, p.y, p.zoom, p.rotation]),
  ]);
/** Pure planning is synchronous so Dexie can run it within its atomic transaction. */
export function planBackupMerge(
  snapshot: BackupSnapshot,
  currentDays: DayRecord[],
  existingIds: Set<string>,
  newId: () => string = () => crypto.randomUUID(),
) {
  validateBackupSnapshot(snapshot);
  const dates = new Set(currentDays.map((day) => day.date));
  const added = snapshot.days.filter((day) => !dates.has(day.date));
  const needed = new Set(
    added.flatMap((day) => day.photos.map((photo) => photo.id)),
  );
  const ids = new Map<string, string>();
  const occupied = new Set(existingIds);
  const assets = snapshot.assets
    .filter((asset) => needed.has(asset.id))
    .map((asset) => {
      let mapped = newId();
      let attempts = 0;
      while (occupied.has(mapped)) {
        if (++attempts > 100)
          throw new Error("写真の識別子を作成できませんでした");
        mapped = newId();
      }
      occupied.add(mapped);
      ids.set(asset.id, mapped);
      return { ...asset, id: mapped };
    });
  const days = added.map((day) => {
    const next: DayRecord = {
      ...day,
      photos: day.photos.map((photo) => ({ ...photo, id: ids.get(photo.id)! })),
    };
    if (day.colorMatch)
      next.colorMatch = {
        ...day.colorMatch,
        signature:
          day.colorMatch.signature === signature(day)
            ? signature(next)
            : day.colorMatch.signature,
        photos: day.colorMatch.photos.map((photo) => ({
          ...photo,
          id: ids.get(photo.id)!,
        })),
      };
    return next;
  });
  return {
    days,
    assets,
    result: {
      addedDays: days.length,
      skippedDays: snapshot.days.length - days.length,
      addedPhotos: assets.length,
    } satisfies BackupMergeResult,
  };
}

/** Only references removed with the selected records are eligible for deletion. */
export function assetsForDeletedDays(days: DayRecord[], dates: string[]) {
  const selected = new Set(dates);
  const candidates = new Set(
    days
      .filter((day) => selected.has(day.date))
      .flatMap((day) => day.photos.map((photo) => photo.id)),
  );
  for (const day of days)
    if (!selected.has(day.date))
      for (const photo of day.photos) candidates.delete(photo.id);
  return [...candidates];
}
