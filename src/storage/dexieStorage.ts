import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  DayRecord,
  PhotoAsset,
  PhotoSummary,
} from "../domain/types";
import type { StoragePort } from "./StoragePort";

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
    await db.transaction("rw", db.assets, db.assetBodies, async () => {
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
};
