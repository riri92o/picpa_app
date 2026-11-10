import type { BackupSnapshot } from "./backup";
import type { DayRecord } from "./types";
import { resolvePhotoFilter } from "./photoFilter";

/** Match the original capture, even after restore remapped its asset IDs.
 * Presentation/memo changes remain this device's own values. */
export function backupPhotoRepairCandidates(
  snapshot: BackupSnapshot,
  currentDays: DayRecord[],
) {
  const assets = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const current = new Map(currentDays.map((day) => [day.date, day]));
  const candidates = new Map<
    string,
    { id: string; source: BackupSnapshot["assets"][number] }
  >();
  const ambiguous = new Set<string>();
  for (const day of snapshot.days) {
    const existing = current.get(day.date);
    if (
      !existing ||
      existing.count !== day.count ||
      existing.colorId !== day.colorId ||
      existing.photos.length !== day.photos.length ||
      !day.photos.every((photo, index) => {
        const previous = existing.photos[index];
        return (
          previous.zoom === photo.zoom &&
          previous.x === photo.x &&
          previous.y === photo.y &&
          previous.rotation === photo.rotation &&
          resolvePhotoFilter(previous.filter) ===
            resolvePhotoFilter(photo.filter)
        );
      }) ||
      !(
        (day.completedAt && day.completedAt === existing.completedAt) ||
        day.photos.every(
          (photo, index) => photo.id === existing.photos[index].id,
        )
      )
    )
      continue;
    day.photos.forEach((photo, index) => {
      const source = assets.get(photo.id);
      if (!source) return;
      const id = existing.photos[index].id;
      if (candidates.has(id) && candidates.get(id)!.source.id !== source.id)
        ambiguous.add(id);
      else candidates.set(id, { id, source });
    });
  }
  return [...candidates.values()].filter(({ id }) => !ambiguous.has(id));
}
