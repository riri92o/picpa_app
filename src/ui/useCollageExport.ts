import { useEffect, useState } from "react";
import { colorById } from "../constants/palette";
import { exportCollage, exportCollageVariants } from "../domain/image";
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
  allStyles = true,
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
    allStyles ? "all" : resolveArtworkStyle(day.artworkStyle),
  ]);
  const [state, setState] = useState<{
    key: string;
    previews: CollagePreviews | null;
    single: CollageExportImage | null;
    error: boolean;
  }>({ key: "", previews: null, single: null, error: false });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const urls: string[] = [];
    const color = colorById(day.colorId);
    setState({ key, previews: null, single: null, error: false });
    const options = {
      date: day.date,
      colorLabel: color.id.replaceAll("-", " ").toUpperCase(),
      signal: controller.signal,
    };
    const generate = allStyles
      ? exportCollageVariants(
          day.count,
          day.photos,
          getImageBlob,
          color.hex,
          logo,
          day.spacing,
          options,
        )
      : exportCollage(
          day.count,
          day.photos,
          getImageBlob,
          color.hex,
          logo,
          day.spacing,
          { ...options, style: resolveArtworkStyle(day.artworkStyle) },
        );
    void generate
      .then((blobs) => {
        if (!active) return;
        if (blobs instanceof Blob) {
          const url = URL.createObjectURL(blobs);
          urls.push(url);
          setState({
            key,
            previews: null,
            single: { blob: blobs, url },
            error: false,
          });
          return;
        }
        const previews = Object.fromEntries(
          Object.entries(blobs).map(([style, blob]) => {
            const url = URL.createObjectURL(blob);
            urls.push(url);
            return [style, { blob, url }];
          }),
        ) as CollagePreviews;
        setState({ key, previews, single: null, error: false });
      })
      .catch(() => {
        // A decoder's AbortError is a real failure. Ignore only our own cleanup.
        if (active && !controller.signal.aborted)
          setState({ key, previews: null, single: null, error: true });
      });
    return () => {
      active = false;
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // All-style previews can switch instantly; single-image viewing keys the chosen style too.
    // Memo and score metadata do not affect the final pixels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, getImageBlob]);
  const current = state.key === key;
  const previews = current ? state.previews : null;
  const image =
    previews?.[resolveArtworkStyle(day.artworkStyle)] ??
    (current ? state.single : null);
  const error = state.key === key && state.error;
  return {
    image,
    previews,
    loading: !image && !error,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
