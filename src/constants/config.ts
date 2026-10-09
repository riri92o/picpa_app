import type { AppSettings, GridCount } from "../domain/types";
export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  randomCount: false,
  exportLogo: true,
  tutorialSeen: false,
};
export const DEFAULT_COUNT: GridCount = 6;
export const NAV_MOTION = {
  duration: 0.58,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};
export const BUBBLE_MOTION = {
  duration: 0.46,
  ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
};
