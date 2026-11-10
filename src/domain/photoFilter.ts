import type { PhotoPlacement } from "./types";

export const PHOTO_FILTERS = [
  { id: "none", name: "元画像" },
  { id: "natural", name: "ナチュラル" },
  { id: "warm", name: "ウォーム" },
  { id: "cool", name: "クール" },
  { id: "film", name: "フィルム" },
  { id: "soft", name: "ソフト" },
] as const;

export type PhotoFilter = (typeof PHOTO_FILTERS)[number]["id"];

export function isPhotoFilter(value: unknown): value is PhotoFilter {
  return PHOTO_FILTERS.some((filter) => filter.id === value);
}

export function resolvePhotoFilter(value?: string): PhotoFilter {
  return isPhotoFilter(value) ? value : "none";
}

// Independent sRGB tone curves make the same grade available to SVG previews
// and Canvas exports, without relying on Canvas.filter support in WebKit.
// Saved preset IDs fix these curves; a different grade should get a new ID.
const RECIPES = {
  none: { contrast: 1, lift: 0, gamma: 1, gains: [1, 1, 1] },
  natural: {
    contrast: 1.045,
    lift: 0.012,
    gamma: 0.98,
    gains: [1, 1.005, 1.035],
  },
  warm: { contrast: 0.98, lift: 0.012, gamma: 1, gains: [1.055, 1.015, 0.925] },
  cool: { contrast: 1.025, lift: 0.006, gamma: 1, gains: [0.95, 1.015, 1.085] },
  film: { contrast: 0.86, lift: 0.008, gamma: 1.055, gains: [1.025, 1, 0.945] },
  soft: {
    contrast: 0.86,
    lift: 0.026,
    gamma: 0.94,
    gains: [1.005, 1.012, 1.025],
  },
} as const;

export const PHOTO_FILTER_TABLES = Object.fromEntries(
  PHOTO_FILTERS.map(({ id }) => {
    const recipe = RECIPES[id];
    const tables = recipe.gains.map((gain) =>
      Uint8ClampedArray.from({ length: 256 }, (_, value) => {
        const tone =
          (Math.pow(value / 255, recipe.gamma) - 0.5) * recipe.contrast +
          0.5 +
          recipe.lift;
        return Math.max(0, Math.min(255, tone * gain * 255));
      }),
    ) as [Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray];
    return [id, tables];
  }),
) as Record<
  PhotoFilter,
  [Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray]
>;

export const PHOTO_FILTER_SVG_TABLES = Object.fromEntries(
  PHOTO_FILTERS.map(({ id }) => [
    id,
    PHOTO_FILTER_TABLES[id].map((table) =>
      Array.from(table, (value) => (value / 255).toFixed(6)).join(" "),
    ),
  ]),
) as Record<PhotoFilter, [string, string, string]>;

/** In-place, bounded RGB transform. Alpha and the stored photograph stay intact. */
export function filterPhotoPixels(
  pixels: Uint8ClampedArray,
  filter: PhotoFilter,
) {
  if (filter === "none") return;
  const [red, green, blue] = PHOTO_FILTER_TABLES[filter];
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    pixels[i] = red[pixels[i]];
    pixels[i + 1] = green[pixels[i + 1]];
    pixels[i + 2] = blue[pixels[i + 2]];
  }
}

/** Keep legacy no-filter score signatures byte-for-byte unchanged. */
export function photoPlacementSignature(photo: PhotoPlacement) {
  const signature: (string | number)[] = [
    photo.id,
    photo.x,
    photo.y,
    photo.zoom,
    photo.rotation,
  ];
  const filter = resolvePhotoFilter(photo.filter);
  if (filter !== "none") signature.push(filter);
  return signature;
}
