import type {
  AppSettings,
  DayRecord,
  PhotoAsset,
  PhotoSummary,
} from "../domain/types";
import type { BackupMergeResult, BackupSnapshot } from "../domain/backup";
export interface StoragePort {
  getDays(): Promise<DayRecord[]>;
  putDay(day: DayRecord): Promise<void>;
  getSettings(): Promise<AppSettings | undefined>;
  putSettings(settings: AppSettings): Promise<void>;
  getAssets(): Promise<PhotoSummary[]>;
  getFullImage(id: string): Promise<Blob | undefined>;
  putAsset(asset: PhotoAsset): Promise<void>;
  deleteAsset(id: string): Promise<void>;
  clearProgress(): Promise<void>;
  getBackupSnapshot(dates?: string[]): Promise<BackupSnapshot>;
  mergeBackup(
    snapshot: BackupSnapshot,
    restoreSettings: boolean,
  ): Promise<BackupMergeResult>;
  deleteDays(dates: string[]): Promise<void>;
}
