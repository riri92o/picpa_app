import { PALETTE } from "../constants/palette";
import type { ColorDefinition, DayRecord } from "./types";

export interface CollectedColor {
  color: ColorDefinition;
  days: DayRecord[];
}

function collectionOrder(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  if (delta < 20) return 720 - (max + min) / 2;
  const hue =
    max === r
      ? (g - b) / delta
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return (hue * 60 + 375) % 360;
}

/** Collection is derived from completed records. No duplicated photos, saved
 * thumbnails, counters or migrations; old color IDs keep their exact meaning. */
export function buildColorCollection(
  days: DayRecord[],
  palette: ColorDefinition[] = PALETTE,
) {
  const colors: CollectedColor[] = [...palette]
    .sort((a, b) => collectionOrder(a.hex) - collectionOrder(b.hex))
    .map((color) => ({
      color,
      days: [],
    }));
  const byId = new Map(colors.map((entry) => [entry.color.id, entry]));
  for (const day of days) {
    if (day.completedAt && day.colorId) byId.get(day.colorId)?.days.push(day);
  }
  colors.forEach((entry) =>
    entry.days.sort((a, b) => b.date.localeCompare(a.date)),
  );
  const collected = colors.filter((entry) => entry.days.length > 0);
  return {
    colors,
    collected,
    total: colors.length,
    completedCount: collected.reduce(
      (sum, entry) => sum + entry.days.length,
      0,
    ),
    mostRecentColorId: collected.reduce<CollectedColor | undefined>(
      (latest, entry) =>
        !latest || entry.days[0].date > latest.days[0].date ? entry : latest,
      undefined,
    )?.color.id,
  };
}
