import type { DayRecord } from "./types";

export const MEMO_MAX_LENGTH = 100;
export const memoLength = (value: string) => Array.from(value).length;

export function withArtworkMemo(day: DayRecord, value: string): DayRecord {
  const memo = Array.from(value.replace(/\r\n?/g, "\n").trim())
    .slice(0, MEMO_MAX_LENGTH)
    .join("");
  // Notes are metadata: photo placements, completion and scoring stay untouched.
  return { ...day, memo: memo || undefined };
}
