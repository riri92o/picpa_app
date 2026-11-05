import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  DayRecord,
  PhotoAsset,
  PhotoSummary,
} from "../domain/types";
import type { StoragePort } from "./StoragePort";
import { DEFAULT_SETTINGS } from "../constants/config";
import { isChallengeLocked } from "../domain/challenge";
import { localDateKey } from "../domain/date";
import {
  assetsForDeletedDays,
  isBackupImageReadable,
  planBackupMerge,
  validateBackupSnapshot,
  type BackupSnapshot,
} from "../domain/backup";
import { backupPhotoRepairCandidates } from "../domain/backupRepair";

interface SettingsRow {
  id: string;
  value: AppSettings;
}
interface AssetBody {
  id: string;
  full: Blob;
}
class PicPaDatabase extends Dexie {
  days!: EntityTable<DayRecord, "date">;
  assets!: EntityTable<PhotoSummary, "id">;
  assetBodies!: EntityTable<AssetBody, "id">;
  settings!: EntityTable<SettingsRow, "id">;
  constructor() {
    super("PicPa");
    this.version(1).stores({
      days: "date",
      assets: "id, createdAt",
      settings: "id",
    });
    this.version(2)
      .stores({
        days: "date",
        assets: "id, createdAt",
        assetBodies: "id",
        settings: "id",
      })
      .upgrade(async (transaction) => {
        const previous = (await transaction
          .table("assets")
          .toArray()) as PhotoAsset[];
        for (const asset of previous) {
          if (!asset.full) continue;
          await transaction
            .table("assetBodies")
            .put({ id: asset.id, full: asset.full });
          await transaction.table("assets").put({
            id: asset.id,
            thumb: asset.thumb,
            width: asset.width,
            height: asset.height,
            createdAt: asset.createdAt,
            fullBytes: asset.full.size,
            thumbBytes: asset.thumb.size,
          } satisfies PhotoSummary);
        }
      });
  }
}
const db = new PicPaDatabase();
export const localStorageRepository: StoragePort = {
  getDays: () => db.days.toArray(),
  putDay: async (day) => {
    await db.days.put(day);
  },
  getSettings: async () => (await db.settings.get("app"))?.value,
  putSettings: async (value) => {
    await db.settings.put({ id: "app", value });
  },
  getAssets: () => db.assets.toArray(),
  getFullImage: async (id) => (await db.assetBodies.get(id))?.full,
  putAsset: async (asset) => {
    await db.transaction("rw", db.assets, db.assetBodies, async () => {
      await db.assets.put({
        id: asset.id,
        thumb: asset.thumb,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
        fullBytes: asset.full.size,
        thumbBytes: asset.thumb.size,
      });
      await db.assetBodies.put({ id: asset.id, full: asset.full });
    });
  },
  deleteAsset: async (id) => {
    await db.transaction("rw", db.days, db.assets, db.assetBodies, async () => {
      // A restored photo can be shared across dates. Keep the binary and its
      // thumbnail until the final referencing record has also been removed.
      if (
        (await db.days.toArray()).some((day) =>
          day.photos.some((photo) => photo.id === id),
        )
      )
        return;
      await db.assets.delete(id);
      await db.assetBodies.delete(id);
    });
  },
  clearProgress: async () => {
    await db.transaction("rw", db.days, db.assets, db.assetBodies, async () => {
      await db.days.clear();
      await db.assets.clear();
      await db.assetBodies.clear();
    });
  },
  getBackupSnapshot: async (dates) =>
    db.transaction(
      "r",
      db.days,
      db.assets,
      db.assetBodies,
      db.settings,
      async () => {
        const selected = dates === undefined ? undefined : new Set(dates);
        const days = (await db.days.toArray()).filter(
          (day) => !selected || selected.has(day.date),
        );
        const ids = new Set(
          days.flatMap((day) => day.photos.map((photo) => photo.id)),
        );
        const summaries = (await db.assets.toArray()).filter(
          (asset) => !selected || ids.has(asset.id),
        );
        const bodies = new Map(
          (await db.assetBodies.bulkGet(summaries.map((asset) => asset.id)))
            .filter((body): body is AssetBody => !!body)
            .map((body) => [body.id, body.full]),
        );
        const assets: PhotoAsset[] = summaries.map((asset) => {
          const full = bodies.get(asset.id);
          if (!full)
            throw new Error(
              "写真を読み込めないため、バックアップを作成できませんでした",
            );
          return {
            id: asset.id,
            full,
            thumb: asset.thumb,
            width: asset.width,
            height: asset.height,
            createdAt: asset.createdAt,
          };
        });
        const snapshot: BackupSnapshot = {
          days,
          assets,
          settings: (await db.settings.get("app"))?.value ?? {
            ...DEFAULT_SETTINGS,
          },
        };
        validateBackupSnapshot(snapshot);
        return snapshot;
      },
    ),
  mergeBackup: async (snapshot, restoreSettings) => {
    // File parsing/checksums complete before this method. No external async work
    // belongs inside the IndexedDB transaction, so every insert commits together.
    validateBackupSnapshot(snapshot);
    const repairs: {
      id: string;
      source: PhotoAsset;
      summary?: PhotoSummary;
      body?: AssetBody;
      full: boolean;
      thumb: boolean;
    }[] = [];
    for (const candidate of backupPhotoRepairCandidates(
      snapshot,
      await db.days.toArray(),
    )) {
      const [summary, body] = await Promise.all([
        db.assets.get(candidate.id),
        db.assetBodies.get(candidate.id),
      ]);
      const [fullReadable, thumbReadable] = await Promise.all([
        isBackupImageReadable(body?.full),
        isBackupImageReadable(summary?.thumb),
      ]);
      if (!summary || !fullReadable || !thumbReadable)
        repairs.push({
          ...candidate,
          summary,
          body,
          full: !fullReadable,
          thumb: !thumbReadable,
        });
    }
    return db.transaction(
      "rw",
      db.days,
      db.assets,
      db.assetBodies,
      db.settings,
      async () => {
        const days = await db.days.toArray();
        const existingIds = new Set<string>([
          ...days.flatMap((day) => day.photos.map((photo) => photo.id)),
          ...(await db.assets.toCollection().primaryKeys()),
          ...(await db.assetBodies.toCollection().primaryKeys()),
        ]);
        const plan = planBackupMerge(snapshot, days, existingIds);
        // Recheck the record and storage metadata after the asynchronous checks.
        const eligible = new Map(
          backupPhotoRepairCandidates(snapshot, days).map((entry) => [
            entry.id,
            entry,
          ]),
        );
        let repairedPhotos = 0;
        for (const repair of repairs) {
          if (eligible.get(repair.id)?.source.id !== repair.source.id) continue;
          const [summary, body] = await Promise.all([
            db.assets.get(repair.id),
            db.assetBodies.get(repair.id),
          ]);
          const sameBlob = (a?: Blob, b?: Blob) =>
            a?.size === b?.size && a?.type === b?.type;
          if (
            !sameBlob(body?.full, repair.body?.full) ||
            !sameBlob(summary?.thumb, repair.summary?.thumb) ||
            summary?.createdAt !== repair.summary?.createdAt ||
            summary?.width !== repair.summary?.width ||
            summary?.height !== repair.summary?.height ||
            summary?.fullBytes !== repair.summary?.fullBytes ||
            summary?.thumbBytes !== repair.summary?.thumbBytes
          )
            continue;
          if (repair.full)
            await db.assetBodies.put({
              id: repair.id,
              full: repair.source.full,
            });
          await db.assets.put({
            ...(summary ?? {
              id: repair.id,
              width: repair.source.width,
              height: repair.source.height,
              createdAt: repair.source.createdAt,
            }),
            thumb: repair.thumb ? repair.source.thumb : summary!.thumb,
            fullBytes: repair.full ? repair.source.full.size : body!.full.size,
            thumbBytes: repair.thumb
              ? repair.source.thumb.size
              : summary!.thumb.size,
          });
          repairedPhotos++;
        }
        await db.assets.bulkAdd(
          plan.assets.map((asset) => ({
            id: asset.id,
            thumb: asset.thumb,
            width: asset.width,
            height: asset.height,
            createdAt: asset.createdAt,
            fullBytes: asset.full.size,
            thumbBytes: asset.thumb.size,
          })),
        );
        await db.assetBodies.bulkAdd(
          plan.assets.map((asset) => ({ id: asset.id, full: asset.full })),
        );
        await db.days.bulkAdd(plan.days);
        if (restoreSettings) {
          const currentSettings =
            (await db.settings.get("app"))?.value ?? DEFAULT_SETTINGS;
          const existingToday = days.find((day) => day.date === localDateKey());
          const restoredSettings = { ...snapshot.settings };
          if (
            existingToday &&
            isChallengeLocked(existingToday, currentSettings)
          )
            restoredSettings.randomCount = currentSettings.randomCount;
          else if (existingToday?.colorId && restoredSettings.randomCount)
            await db.days.put({ ...existingToday, randomChallenge: true });
          await db.settings.put({ id: "app", value: restoredSettings });
        }
        return repairedPhotos
          ? { ...plan.result, repairedPhotos }
          : plan.result;
      },
    );
  },
  deleteDays: async (dates) => {
    await db.transaction("rw", db.days, db.assets, db.assetBodies, async () => {
      const ids = assetsForDeletedDays(await db.days.toArray(), dates);
      await db.days.bulkDelete(dates);
      await db.assets.bulkDelete(ids);
      await db.assetBodies.bulkDelete(ids);
    });
  },
};
