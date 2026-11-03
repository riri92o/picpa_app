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

/** Clear circular photographs, with room for the thin film at the canvas edge. */
export const BUBBLE_FRAME = {
  padding: 40,
} as const;
