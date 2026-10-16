import type { ArtworkStyle, GridCount } from "../domain/types";

export const ARTWORK_STYLES: {
  id: ArtworkStyle;
  name: string;
  number: string;
}[] = [
  { id: "specimen", name: "色の標本", number: "01" },
  { id: "bubble-window", name: "バブルの窓", number: "02" },
  { id: "palette", name: "今日のパレット", number: "03" },
  { id: "black-frame", name: "黒枠", number: "04" },
  { id: "white-frame", name: "白枠", number: "05" },
];
export const DEFAULT_ARTWORK_STYLE: ArtworkStyle = "bubble-window";
export const ARTWORK_WIDTH = 1200;

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
