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
import type {
  AppSettings,
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
  addSamplePhotos: () => Promise<void>;
  reduceCount: (count: GridCount, ids: string[]) => void;
  addPhotos: (files: FileList | File[], replaceId?: string) => Promise<void>;
  removePhoto: (id: string) => void;
  updatePlacement: (id: string, patch: Partial<PhotoPlacement>) => void;
  reorderPhotos: (activeId: string, overId: string) => void;
  completeToday: () => void;
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
          settingsRef.current = loadedSettings;
          setSettings(loadedSettings);
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
          if (!blob) return;
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
    if (ready) void ensureFullImages(today.photos.map((photo) => photo.id));
  }, [ready, today.photos, ensureFullImages]);
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
    (next: DayRecord) => {
      daysRef.current = [
        ...daysRef.current.filter((day) => day.date !== next.date),
        next,
      ];
      setDays(daysRef.current);
      writeQueueRef.current = writeQueueRef.current
        .then(() => repository.putDay(next))
        .catch(() =>
          setError("保存に失敗しました。空き容量を確認してください"),
        );
    },
    [repository],
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
    if (day.colorId) return day;
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
        .map((p) => p.id);
      assetsRef.current = assetsRef.current.filter(
        (asset) => !removed.includes(asset.id),
      );
      setAssets(assetsRef.current);
      for (const id of removed) {
        forgetImage(id);
        void repository
          .deleteAsset(id)
          .catch(() => setError("写真の削除に失敗しました"));
      }
    },
    [currentDay, saveDay, repository, forgetImage],
  );
  const setSpacing = useCallback(
    (spacing: CollageSpacing, date?: string) => {
      const day = date
        ? daysRef.current.find((item) => item.date === date)
        : currentDay();
      if (!day) return;
      // Presentation only: completed photo placements and completion timestamp stay locked.
      saveDay({ ...day, spacing });
    },
    [currentDay, saveDay],
  );
  const addPhotos = useCallback(
    async (files: FileList | File[], replaceId?: string) => {
      const day = currentDay();
      if (!day.colorId || day.completedAt) return;
      const selected = Array.from(files);
      const space = replaceId ? 1 : day.count - day.photos.length;
      if (!space) return;
      try {
        const prepared: PhotoAsset[] = [];
        for (const file of selected.slice(0, space))
          prepared.push(await preparePhoto(file));
        for (const asset of prepared) await repository.putAsset(asset);
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
        saveDay({ ...day, photos });
        if (replaceId && newPlacements.length) {
          assetsRef.current = assetsRef.current.filter(
            (asset) => asset.id !== replaceId,
          );
          setAssets(assetsRef.current);
          forgetImage(replaceId);
          void repository.deleteAsset(replaceId);
        }
      } catch {
        setError(
          "写真を追加できませんでした。画像形式と空き容量を確認してください",
        );
      }
    },
    [currentDay, repository, saveDay, forgetImage],
  );
  const removePhoto = useCallback(
    (id: string) => {
      const day = currentDay();
      if (day.completedAt) return;
      saveDay({ ...day, photos: day.photos.filter((p) => p.id !== id) });
      assetsRef.current = assetsRef.current.filter((asset) => asset.id !== id);
      setAssets(assetsRef.current);
      forgetImage(id);
      void repository
        .deleteAsset(id)
        .catch(() => setError("写真の削除に失敗しました"));
    },
    [currentDay, repository, saveDay, forgetImage],
  );
  // Temporary development action; the assets and loader live in src/dev.
  const addSamplePhotos = useCallback(async () => {
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
  const completeToday = useCallback(() => {
    const day = currentDay();
    if (day.colorId && !day.completedAt && day.photos.length === day.count)
      saveDay({ ...day, completedAt: new Date().toISOString() });
  }, [currentDay, saveDay]);
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
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
      void repository
        .putSettings(next)
        .catch(() => setError("設定を保存できませんでした"));
    },
    [repository, currentDay, saveDay],
  );
  const getImageBlob = useCallback(
    async (id: string) => {
      const cached = fullBlobsRef.current.get(id);
      if (cached) return cached;
      const blob = await repository.getFullImage(id);
      if (blob) fullBlobsRef.current.set(id, blob);
      return blob;
    },
    [repository],
  );
  const ensureColorMatch = useCallback(
    (date: string): Promise<ColorMatchResult | undefined> => {
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
  const resetProgress = useCallback(async () => {
    scoreGeneration.current++;
    scoreJobs.current.clear();
    try {
      await writeQueueRef.current;
      await repository.clearProgress();
      for (const pair of urlsRef.current.values()) {
        if (pair.full) URL.revokeObjectURL(pair.full);
        URL.revokeObjectURL(pair.thumb);
      }
      urlsRef.current.clear();
      fullBlobsRef.current.clear();
      daysRef.current = [];
      assetsRef.current = [];
      setDays([]);
      setAssets([]);
      setImages({});
      return true;
    } catch {
      setError("記録を初期化できませんでした");
      return false;
    }
  }, [repository]);
  return (
    <AppContext.Provider
      value={{
        ready,
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
