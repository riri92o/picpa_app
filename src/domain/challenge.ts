import type { AppSettings, DayRecord } from "./types";

export function isRandomChallenge(
  day: DayRecord,
  settings: AppSettings,
): boolean {
  return day.randomChallenge === true || settings.randomCount;
}

export function isChallengeLocked(
  day: DayRecord,
  settings: AppSettings,
): boolean {
  return (
    !!day.completedAt || (!!day.colorId && isRandomChallenge(day, settings))
  );
}
