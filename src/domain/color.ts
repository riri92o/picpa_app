import { PALETTE } from "../constants/palette";
import type { DayRecord, GridCount } from "./types";

export function chooseDailyColor(days: DayRecord[]): string {
  const recent = days
    .filter((day) => day.colorId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((day) => day.colorId);
  const available = PALETTE.filter((color) => !recent.includes(color.id));
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return available[bytes[0] % available.length].id;
}
export function chooseGridCount(): GridCount {
  const counts: GridCount[] = [4, 6, 9];
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return counts[bytes[0] % counts.length];
}
