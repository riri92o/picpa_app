import { useEffect, useState } from "react";
import { colorById } from "../constants/palette";
import { exportCollageVariants } from "../domain/image";
import { resolveArtworkStyle } from "../domain/artworkLayout";
import type { ArtworkStyle, DayRecord } from "../domain/types";

type CollageArtwork = Pick<
  DayRecord,
  "date" | "count" | "photos" | "colorId" | "spacing" | "artworkStyle"
>;
export type CollageExportImage = { blob: Blob; url: string };
export type CollagePreviews = Record<ArtworkStyle, CollageExportImage>;

/** Every thumbnail is the actual export. Switching style reuses its final pixels. */
export function useCollageExport(
  day: CollageArtwork,
  logo: boolean,
  getImageBlob: (id: string) => Promise<Blob | undefined>,
) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    day.date,
    day.count,
    day.photos,
    day.colorId,
    day.spacing,
    logo,
    attempt,
  ]);
  const [state, setState] = useState<{
    key: string;
    previews: CollagePreviews | null;
    error: boolean;
  }>({ key: "", previews: null, error: false });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const urls: string[] = [];
    const color = colorById(day.colorId);
    setState({ key, previews: null, error: false });
    void exportCollageVariants(
      day.count,
      day.photos,
      getImageBlob,
      color.hex,
      logo,
      day.spacing,
      {
        date: day.date,
        colorLabel: color.id.replaceAll("-", " ").toUpperCase(),
        signal: controller.signal,
      },
    )
      .then((blobs) => {
        if (!active) return;
        const previews = Object.fromEntries(
          Object.entries(blobs).map(([style, blob]) => {
            const url = URL.createObjectURL(blob);
            urls.push(url);
            return [style, { blob, url }];
          }),
        ) as CollagePreviews;
        setState({ key, previews, error: false });
      })
      .catch((error: unknown) => {
        if (active && (error as Error).name !== "AbortError")
          setState({ key, previews: null, error: true });
      });
    return () => {
      active = false;
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // The serialized key includes artwork inputs, but intentionally excludes style and metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, getImageBlob]);
  const previews = state.key === key ? state.previews : null;
  const error = state.key === key && state.error;
  return {
    image: previews?.[resolveArtworkStyle(day.artworkStyle)] ?? null,
    previews,
    loading: !previews && !error,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
