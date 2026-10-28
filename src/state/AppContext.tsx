import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_COUNT, DEFAULT_SETTINGS } from "../constants/config";
import { chooseDailyColor, chooseGridCount } from "../domain/color";
import { isChallengeLocked, isRandomChallenge } from "../domain/challenge";
import { localDateKey } from "../domain/date";
import { preparePhoto } from "../domain/image";
import { resolvePhotoQuality } from "../constants/photoQuality";
import {
  createBackup,
  type BackupSnapshot,
  type BackupMergeResult,
} from "../domain/backup";
import { withArtworkMemo } from "../domain/memo";
import { withArtworkStyle, resolveArtworkStyle } from "../domain/artworkLayout";
import type {
  AppSettings,
  ArtworkStyle,
  CollageSpacing,
  DayRecord,
  GridCount,
  PhotoAsset,
  PhotoPlacement,
  PhotoSummary,
} from "../domain/types";
import { localStorageRepository } from "../storage/dexieStorage";
import {
  analyzeColorMatch,
  colorMatchSignature,
  validColorMatch,
} from "../domain/colorMatch";
import type { ColorMatchResult } from "../domain/types";
import type { StoragePort } from "../storage/StoragePort";

export interface ImageUrls {
  full?: string;
  thumb: string;
}
interface AppContextValue {
  ready: boolean;
  dataBusy: boolean;
  reloadRequired: boolean;
  exportBackup: (dates?: string[]) => Promise<Blob>;
  restoreBackup: (
    snapshot: BackupSnapshot,
    restoreSettings: boolean,
  ) => Promise<BackupMergeResult>;
  deleteRecords: (dates: string[]) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
  todayKey: string;
  today: DayRecord;
  days: DayRecord[];
  settings: AppSettings;
  images: Record<string, ImageUrls>;
  assets: PhotoSummary[];
  drawToday: () => DayRecord;
  setCount: (count: GridCount) => void;
  setSpacing: (spacing: CollageSpacing, date?: string) => void;
  setArtworkStyle: (style: ArtworkStyle, date?: string) => void;
  setMemo: (date: string, memo: string) => Promise<boolean>;
  addSamplePhotos: () => Promise<void>;
  reduceCount: (count: GridCount, ids: string[]) => void;
  addPhotos: (files: FileList | File[], replaceId?: string) => Promise<void>;
  removePhoto: (id: string) => void;
  updatePlacement: (id: string, patch: Partial<PhotoPlacement>) => void;
  reorderPhotos: (activeId: string, overId: string) => void;
  completeToday: (memo?: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  ensureFullImages: (ids: string[]) => Promise<void>;
  resetProgress: () => Promise<boolean>;
  ensureColorMatch: (date: string) => Promise<ColorMatchResult | undefined>;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  repository = localStorageRepository,
}: {
  children: ReactNode;
  repository?: StoragePort;
}) {
  const [ready, setReady] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const reloadRequiredRef = useRef(false);
  const maintenanceRef = useRef(false);
  const importingRef = useRef(false);
  const dataEpoch = useRef(0);
  const scoreJobs = useRef(
    new Map<string, Promise<ColorMatchResult | undefined>>(),
  );
  const scoreGeneration = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(localDateKey());
  const [days, setDays] = useState<DayRecord[]>([]);
  const daysRef = useRef<DayRecord[]>([]);
  const [assets, setAssets] = useState<PhotoSummary[]>([]);
  const assetsRef = useRef<PhotoSummary[]>([]);
  const [images, setImages] = useState<Record<string, ImageUrls>>({});
  const urlsRef = useRef<Map<string, ImageUrls>>(new Map());
  const fullBlobsRef = useRef<Map<string, Blob>>(new Map());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueueWrite = useCallback(function enqueue<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const pending = writeQueueRef.current.then(operation);
    writeQueueRef.current = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      repository.getDays(),
      repository.getAssets(),
      repository.getSettings(),
    ])
      .then(([loadedDays, loadedAssets, loadedSettings]) => {
        if (!alive) return;
        daysRef.current = loadedDays;
        setDays(loadedDays);
        assetsRef.current = loadedAssets;
        setAssets(loadedAssets);
        const urls: Record<string, ImageUrls> = {};
        for (const asset of loadedAssets) {
          urls[asset.id] = { thumb: URL.createObjectURL(asset.thumb) };
          urlsRef.current.set(asset.id, urls[asset.id]);
        }
        setImages(urls);
        if (loadedSettings) {
          const normalized = {
            ...DEFAULT_SETTINGS,
            ...loadedSettings,
            photoQuality: resolvePhotoQuality(loadedSettings.photoQuality),
          };
          settingsRef.current = normalized;
          setSettings(normalized);
        }
        setReady(true);
      })
      .catch(() => {
        if (alive) {
          setError("保存データを読み込めませんでした");
          setReady(true);
        }
      });
    return () => {
      alive = false;
      for (const pair of urlsRef.current.values()) {
        if (pair.full) URL.revokeObjectURL(pair.full);
        URL.revokeObjectURL(pair.thumb);
      }
      urlsRef.current.clear();
      fullBlobsRef.current.clear();
    };
  }, [repository]);

  useEffect(() => {
    const refresh = () => setTodayKey(localDateKey());
    let timer: number;
    const scheduleMidnight = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      timer = window.setTimeout(
        () => {
          refresh();
          scheduleMidnight();
        },
        midnight.getTime() - now.getTime() + 20,
      );
    };
    scheduleMidnight();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const today = useMemo(
    () =>
      days.find((day) => day.date === todayKey) ?? {
        date: todayKey,
        count: DEFAULT_COUNT,
        photos: [],
      },
    [days, todayKey],
  );
  const ensureFullImages = useCallback(
    async (ids: string[]) => {
      if (maintenanceRef.current) return;
      const epoch = dataEpoch.current;
      await Promise.all(
        ids.map(async (id) => {
          if (fullBlobsRef.current.has(id)) return;
          let blob: Blob | undefined;
          try {
            blob = await repository.getFullImage(id);
          } catch {
            setError("写真を読み込めませんでした");
            return;
          }
          if (!blob || epoch !== dataEpoch.current) return;
          fullBlobsRef.current.set(id, blob);
          const pair = urlsRef.current.get(id);
          if (!pair || pair.full) return;
          const updated = { ...pair, full: URL.createObjectURL(blob) };
          urlsRef.current.set(id, updated);
          setImages((previous) => ({ ...previous, [id]: updated }));
        }),
      );
    },
    [repository],
  );
  useEffect(() => {
    if (ready && !maintenanceBusy)
      void ensureFullImages(today.photos.map((photo) => photo.id));
  }, [ready, today.photos, maintenanceBusy, ensureFullImages]);
  const forgetImage = useCallback((id: string) => {
    const pair = urlsRef.current.get(id);
    if (pair?.full) URL.revokeObjectURL(pair.full);
    if (pair?.thumb) URL.revokeObjectURL(pair.thumb);
    urlsRef.current.delete(id);
    fullBlobsRef.current.delete(id);
    setImages((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);
  const saveDay = useCallback(
    (next: DayRecord, duringImport = false) => {
      if (maintenanceRef.current || (importingRef.current && !duringImport))
        return Promise.resolve(false);
      daysRef.current = [
        ...daysRef.current.filter((day) => day.date !== next.date),
        next,
      ];
      setDays(daysRef.current);
      const pending = enqueueWrite(() => repository.putDay(next));
      void pending.catch(() =>
        setError("保存に失敗しました。空き容量を確認してください"),
      );
      return pending.then(
        () => true,
        () => false,
      );
    },
    [repository, enqueueWrite],
  );
  const currentDay = useCallback(
    () =>
      daysRef.current.find((day) => day.date === todayKey) ?? {
        date: todayKey,
        count: DEFAULT_COUNT,
        photos: [],
      },
    [todayKey],
  );
  const drawToday = useCallback(() => {
    const day = currentDay();
    if (maintenanceRef.current || importingRef.current || day.colorId)
      return day;
    const next: DayRecord = {
      ...day,
      colorId: chooseDailyColor(daysRef.current),
      randomChallenge: settingsRef.current.randomCount,
      count: settingsRef.current.randomCount ? chooseGridCount() : day.count,
    };
    saveDay(next);
    return next;
  }, [currentDay, saveDay]);
  const setCount = useCallback(
    (count: GridCount) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (
        day.completedAt ||
        isRandomChallenge(day, settingsRef.current) ||
        count < day.photos.length
      )
        return;
      saveDay({ ...day, count });
    },
    [currentDay, saveDay],
  );
  const reduceCount = useCallback(
    (count: GridCount, ids: string[]) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (
        !day.colorId ||
        day.completedAt ||
        isRandomChallenge(day, settingsRef.current) ||
        ids.length !== count
      )
        return;
      saveDay({
        ...day,
        count,
        photos: day.photos.filter((p) => ids.includes(p.id)),
      });
      const removed = day.photos
        .filter((p) => !ids.includes(p.id))
        .map((p) => p.id)
        .filter(
          (id) =>
            !daysRef.current.some((record) =>
              record.photos.some((photo) => photo.id === id),
            ),
        );
      assetsRef.current = assetsRef.current.filter(
        (asset) => !removed.includes(asset.id),
      );
      setAssets(assetsRef.current);
      for (const id of removed) {
        forgetImage(id);
        void enqueueWrite(() => repository.deleteAsset(id)).catch(() =>
          setError("写真の削除に失敗しました"),
        );
      }
    },
    [currentDay, saveDay, repository, forgetImage],
  );
  const setSpacing = useCallback(
    (spacing: CollageSpacing, date?: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = date
        ? daysRef.current.find((item) => item.date === date)
        : currentDay();
      if (!day) return;
      // Presentation only: completed photo placements and completion timestamp stay locked.
      saveDay({ ...day, spacing });
    },
    [currentDay, saveDay],
  );
  const setMemo = useCallback(
    (date: string, memo: string) => {
      if (maintenanceRef.current || importingRef.current)
        return Promise.resolve(false);
      const day = daysRef.current.find((item) => item.date === date);
      if (!day?.completedAt) return Promise.resolve(false);
      return saveDay(withArtworkMemo(day, memo));
    },
    [saveDay],
  );
  const setArtworkStyle = useCallback(
    (style: ArtworkStyle, date?: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = date
        ? daysRef.current.find((item) => item.date === date)
        : currentDay();
      if (!day?.colorId) return;
      void saveDay(withArtworkStyle(day, style));
    },
    [currentDay, saveDay],
  );
  const addPhotos = useCallback(
    async (files: FileList | File[], replaceId?: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (!day.colorId || day.completedAt) return;
      if (replaceId && !day.photos.some((photo) => photo.id === replaceId))
        return;
      const selected = Array.from(files);
      const space = replaceId ? 1 : day.count - day.photos.length;
      if (!space || !selected.length) return;
      importingRef.current = true;
      setImportBusy(true);
      try {
        const prepared: PhotoAsset[] = [];
        for (const file of selected.slice(0, space))
          prepared.push(
            await preparePhoto(
              file,
              resolvePhotoQuality(settingsRef.current.photoQuality),
            ),
          );
        const liveDay = currentDay();
        if (
          localDateKey() !== day.date ||
          liveDay.completedAt ||
          !liveDay.colorId
        )
          return;
        for (const asset of prepared)
          await enqueueWrite(() => repository.putAsset(asset));
        if (localDateKey() !== day.date) {
          for (const asset of prepared)
            await enqueueWrite(() => repository.deleteAsset(asset.id));
          return;
        }
        const summaries: PhotoSummary[] = prepared.map((asset) => ({
          id: asset.id,
          thumb: asset.thumb,
          width: asset.width,
          height: asset.height,
          createdAt: asset.createdAt,
          fullBytes: asset.full.size,
          thumbBytes: asset.thumb.size,
        }));
        assetsRef.current = [...assetsRef.current, ...summaries];
        setAssets(assetsRef.current);
        const newUrls: Record<string, ImageUrls> = {};
        for (const asset of prepared) {
          fullBlobsRef.current.set(asset.id, asset.full);
          newUrls[asset.id] = {
            full: URL.createObjectURL(asset.full),
            thumb: URL.createObjectURL(asset.thumb),
          };
          urlsRef.current.set(asset.id, newUrls[asset.id]);
        }
        setImages((previous) => ({ ...previous, ...newUrls }));
        const newPlacements = prepared.map((asset) => ({
          id: asset.id,
          zoom: 1,
          x: 0,
          y: 0,
          rotation: 0,
        }));
        const photos = replaceId
          ? day.photos.map((p) => (p.id === replaceId ? newPlacements[0] : p))
          : [...day.photos, ...newPlacements];
        if (!(await saveDay({ ...day, photos }, true))) {
          daysRef.current = [
            ...daysRef.current.filter((record) => record.date !== day.date),
            day,
          ];
          setDays(daysRef.current);
          const ids = new Set(prepared.map((asset) => asset.id));
          assetsRef.current = assetsRef.current.filter(
            (asset) => !ids.has(asset.id),
          );
          setAssets(assetsRef.current);
          for (const asset of prepared) {
            forgetImage(asset.id);
            await enqueueWrite(() => repository.deleteAsset(asset.id));
          }
          throw new Error("写真を保存できませんでした");
        }
        if (
          replaceId &&
          newPlacements.length &&
          !daysRef.current.some((record) =>
            record.photos.some((photo) => photo.id === replaceId),
          )
        ) {
          assetsRef.current = assetsRef.current.filter(
            (asset) => asset.id !== replaceId,
          );
          setAssets(assetsRef.current);
          forgetImage(replaceId);
          await enqueueWrite(() => repository.deleteAsset(replaceId));
        }
      } catch {
        setError(
          "写真を追加できませんでした。画像形式と空き容量を確認してください",
        );
      } finally {
        importingRef.current = false;
        setImportBusy(false);
      }
    },
    [currentDay, repository, saveDay, forgetImage],
  );
  const removePhoto = useCallback(
    (id: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (day.completedAt) return;
      saveDay({ ...day, photos: day.photos.filter((p) => p.id !== id) });
      if (
        daysRef.current.some((record) =>
          record.photos.some((photo) => photo.id === id),
        )
      )
        return;
      assetsRef.current = assetsRef.current.filter((asset) => asset.id !== id);
      setAssets(assetsRef.current);
      forgetImage(id);
      void enqueueWrite(() => repository.deleteAsset(id)).catch(() =>
        setError("写真の削除に失敗しました"),
      );
    },
    [currentDay, repository, saveDay, forgetImage],
  );
  // Temporary development action; the assets and loader live in src/dev.
  const addSamplePhotos = useCallback(async () => {
    if (maintenanceRef.current || importingRef.current) return;
    const day = currentDay();
    if (day.completedAt || day.photos.length === day.count) return;
    try {
      const { loadSampleFiles } = await import("../dev/samplePhotos");
      if (!currentDay().colorId) {
        saveDay({
          ...currentDay(),
          colorId: "pale-green",
          randomChallenge: settingsRef.current.randomCount,
          count: settingsRef.current.randomCount
            ? chooseGridCount()
            : currentDay().count,
        });
      }
      const sampleDay = currentDay();
      const files = await loadSampleFiles(
        sampleDay.count - sampleDay.photos.length,
        sampleDay.photos.length,
      );
      await addPhotos(files);
    } catch {
      setError("サンプル写真を読み込めませんでした");
    }
  }, [currentDay, saveDay, addPhotos]);
  const updatePlacement = useCallback(
    (id: string, patch: Partial<PhotoPlacement>) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (day.completedAt) return;
      saveDay({
        ...day,
        photos: day.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
    },
    [currentDay, saveDay],
  );
  const reorderPhotos = useCallback(
    (activeId: string, overId: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (day.completedAt) return;
      const from = day.photos.findIndex((p) => p.id === activeId),
        to = day.photos.findIndex((p) => p.id === overId);
      if (from < 0 || to < 0 || from === to) return;
      const photos = [...day.photos];
      photos.splice(to, 0, photos.splice(from, 1)[0]);
      saveDay({ ...day, photos });
    },
    [currentDay, saveDay],
  );
  const completeToday = useCallback(
    (memo?: string) => {
      if (maintenanceRef.current || importingRef.current) return;
      const day = currentDay();
      if (day.colorId && !day.completedAt && day.photos.length === day.count)
        saveDay({
          ...(memo === undefined ? day : withArtworkMemo(day, memo)),
          artworkStyle: resolveArtworkStyle(day.artworkStyle),
          completedAt: new Date().toISOString(),
        });
    },
    [currentDay, saveDay],
  );
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      if (maintenanceRef.current || importingRef.current) return;
      // Guard the state operation too, so a locked challenge cannot be bypassed.
      const { randomCount, ...otherSettings } = patch;
      const day = currentDay();
      const canChangeChallenge = !isChallengeLocked(day, settingsRef.current);
      if (canChangeChallenge && randomCount === true && day.colorId) {
        // Enabling after the draw locks today's existing count without rerolling it.
        saveDay({ ...day, randomChallenge: true });
      }
      const next = {
        ...settingsRef.current,
        ...otherSettings,
        ...(canChangeChallenge && randomCount !== undefined
          ? { randomCount }
          : {}),
      };
      settingsRef.current = next;
      setSettings(next);
      void enqueueWrite(() => repository.putSettings(next)).catch(() =>
        setError("設定を保存できませんでした"),
      );
    },
    [repository, currentDay, saveDay],
  );
  const getImageBlob = useCallback(
    async (id: string) => {
      if (maintenanceRef.current) return undefined;
      const epoch = dataEpoch.current;
      const cached = fullBlobsRef.current.get(id);
      if (cached) return cached;
      const blob = await repository.getFullImage(id);
      if (epoch !== dataEpoch.current) return undefined;
      if (blob) fullBlobsRef.current.set(id, blob);
      return blob;
    },
    [repository],
  );
  const ensureColorMatch = useCallback(
    (date: string): Promise<ColorMatchResult | undefined> => {
      if (maintenanceRef.current || importingRef.current)
        return Promise.resolve(undefined);
      const day = daysRef.current.find((item) => item.date === date);
      if (!day?.completedAt) return Promise.resolve(undefined);
      const cached = validColorMatch(day);
      if (cached) return Promise.resolve(cached);
      const signature = colorMatchSignature(day);
      const key = `${date}:${signature}`;
      const pending = scoreJobs.current.get(key);
      if (pending) return pending;
      const generation = scoreGeneration.current;
      const job = analyzeColorMatch(day, getImageBlob)
        .then((result) => {
          const current = daysRef.current.find((item) => item.date === date);
          if (
            maintenanceRef.current ||
            importingRef.current ||
            generation !== scoreGeneration.current ||
            !current?.completedAt ||
            colorMatchSignature(current) !== signature
          )
            return undefined;
          saveDay({ ...current, colorMatch: result });
          return result;
        })
        .finally(() => {
          if (scoreJobs.current.get(key) === job) scoreJobs.current.delete(key);
        });
      scoreJobs.current.set(key, job);
      return job;
    },
    [getImageBlob, saveDay],
  );
  const reloadStoredData = useCallback(async () => {
    const [loadedDays, loadedAssets, loadedSettings] = await Promise.all([
      repository.getDays(),
      repository.getAssets(),
      repository.getSettings(),
    ]);
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
      photoQuality: resolvePhotoQuality(loadedSettings?.photoQuality),
    };
    dataEpoch.current++;
    const urls: Record<string, ImageUrls> = {};
    for (const asset of loadedAssets)
      urls[asset.id] = { thumb: URL.createObjectURL(asset.thumb) };
    for (const pair of urlsRef.current.values()) {
      if (pair.full) URL.revokeObjectURL(pair.full);
      URL.revokeObjectURL(pair.thumb);
    }
    urlsRef.current = new Map(Object.entries(urls));
    fullBlobsRef.current.clear();
    daysRef.current = loadedDays;
    assetsRef.current = loadedAssets;
    settingsRef.current = nextSettings;
    setDays(loadedDays);
    setAssets(loadedAssets);
    setSettings(nextSettings);
    setImages(urls);
  }, [repository]);
  const runDataOperation = useCallback(
    async function run<T>(
      operation: () => Promise<T>,
      refresh = false,
    ): Promise<T> {
      if (maintenanceRef.current || importingRef.current)
        throw new Error(
          "写真やデータを処理しています。完了してからもう一度お試しください",
        );
      maintenanceRef.current = true;
      setMaintenanceBusy(true);
      scoreGeneration.current++;
      scoreJobs.current.clear();
      dataEpoch.current++;
      try {
        await writeQueueRef.current;
        const result = await operation();
        if (refresh) {
          try {
            await reloadStoredData();
          } catch {
            reloadRequiredRef.current = true;
            setReloadRequired(true);
            const message =
              "記録の変更は保存されました。表示を更新するため、アプリを再読み込みしてください";
            setError(message);
            throw new Error(message);
          }
        }
        return result;
      } finally {
        if (!reloadRequiredRef.current) maintenanceRef.current = false;
        setMaintenanceBusy(false);
      }
    },
    [reloadStoredData],
  );
  const exportBackup = useCallback(
    (dates?: string[]) =>
      runDataOperation(async () =>
        createBackup(await repository.getBackupSnapshot(dates)),
      ),
    [repository, runDataOperation],
  );
  const restoreBackup = useCallback(
    (snapshot: BackupSnapshot, restoreSettings: boolean) =>
      runDataOperation(
        () => repository.mergeBackup(snapshot, restoreSettings),
        true,
      ),
    [repository, runDataOperation],
  );
  const deleteRecords = useCallback(
    async (dates: string[]) => {
      try {
        await runDataOperation(() => repository.deleteDays(dates), true);
        return true;
      } catch {
        if (!reloadRequiredRef.current)
          setError("記録を削除できませんでした。もう一度お試しください");
        return false;
      }
    },
    [repository, runDataOperation],
  );
  const resetProgress = useCallback(async () => {
    try {
      await runDataOperation(() => repository.clearProgress(), true);
      return true;
    } catch {
      if (!reloadRequiredRef.current)
        setError("データを削除できませんでした。もう一度お試しください");
      return false;
    }
  }, [repository, runDataOperation]);
  return (
    <AppContext.Provider
      value={{
        ready,
        dataBusy: maintenanceBusy || importBusy || reloadRequired,
        reloadRequired,
        exportBackup,
        restoreBackup,
        deleteRecords,
        error,
        clearError: () => setError(null),
        todayKey,
        today,
        days,
        settings,
        images,
        assets,
        drawToday,
        setCount,
        setSpacing,
        setArtworkStyle,
        setMemo,
        addSamplePhotos,
        reduceCount,
        addPhotos,
        removePhoto,
        updatePlacement,
        reorderPhotos,
        completeToday,
        updateSettings,
        getImageBlob,
        ensureFullImages,
        ensureColorMatch,
        resetProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider is missing");
  return value;
}
