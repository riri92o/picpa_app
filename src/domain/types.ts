export type GridCount = 4 | 6 | 9;
export type CollageSpacing = "joined" | "separated";
export type ThemeChoice = "light" | "dark" | "system";
export interface PhotoPlacement {
  id: string;
  zoom: number;
  x: number;
  y: number;
  rotation: number;
}
export interface ColorMatchResult {
  version: number;
  signature: string;
  score: number;
  similarity: number;
  coverage: number;
  photos: { id: string; score: number; similarity: number; coverage: number }[];
}
export interface DayRecord {
  date: string;
  colorId?: string;
  count: GridCount;
  spacing?: CollageSpacing;
  /** Mode captured when the daily color is drawn; absent on older records. */
  randomChallenge?: boolean;
  photos: PhotoPlacement[];
  completedAt?: string;
  colorMatch?: ColorMatchResult;
}
export interface PhotoAsset {
  id: string;
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: string;
}
export interface PhotoSummary {
  id: string;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: string;
  fullBytes: number;
  thumbBytes: number;
}
export interface AppSettings {
  theme: ThemeChoice;
  randomCount: boolean;
  exportLogo: boolean;
  tutorialSeen: boolean;
}
export interface ColorDefinition {
  id: string;
  name: string;
  hex: string;
  tint: string;
}
