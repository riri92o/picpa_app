import type { ArtworkStyle } from "../domain/types";

export const ARTWORK_STYLES: {
  id: ArtworkStyle;
  name: string;
  number: string;
}[] = [
  { id: "black-frame", name: "黒枠", number: "01" },
  { id: "white-frame", name: "白枠", number: "02" },
  { id: "specimen", name: "色の標本", number: "03" },
  { id: "bubble-window", name: "バブルの窓", number: "04" },
  { id: "palette", name: "今日のパレット", number: "05" },
];
export const DEFAULT_ARTWORK_STYLE: ArtworkStyle = "black-frame";
export const ARTWORK_WIDTH = 1200;

export const WATER_MATERIAL = {
  baseOpacity: 0.44,
  rimOpacity: 0.18,
  reflectionOpacity: 0.24,
  maxOpacity: 0.86,
  whiteMix: 0.04,
  blurRadius: 9,
  blurSigma: 4.5,
} as const;

/** Rounded, equally sized windows with a continuous translucent water rim. */
export const BUBBLE_FRAME = {
  padding: 56,
  outerInset: 14,
  cornerRatio: 0.2,
} as const;
