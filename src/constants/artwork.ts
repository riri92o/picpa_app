import type { ArtworkStyle, GridCount } from "../domain/types";

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
  baseOpacity: 0.38,
  rimOpacity: 0.24,
  reflectionOpacity: 0.22,
  maxOpacity: 0.86,
  whiteMix: 0.04,
  blurRadius: 7,
  blurSigma: 3.5,
} as const;

/** Stable, asymmetric compositions. Exporting the same work never reshuffles its windows. */
export const BUBBLE_COMPOSITIONS: Record<
  GridCount,
  { rows: number[]; columns: number[][] }
> = {
  4: {
    rows: [0.53, 0.47],
    columns: [
      [0.61, 0.39],
      [0.43, 0.57],
    ],
  },
  6: {
    rows: [0.36, 0.28, 0.36],
    columns: [
      [0.61, 0.39],
      [0.44, 0.56],
      [0.53, 0.47],
    ],
  },
  9: {
    rows: [0.34, 0.28, 0.38],
    columns: [
      [0.4, 0.26, 0.34],
      [0.28, 0.42, 0.3],
      [0.35, 0.28, 0.37],
    ],
  },
};
