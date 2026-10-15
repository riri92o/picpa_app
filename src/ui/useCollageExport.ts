import { useEffect, useState } from "react";
import { colorById } from "../constants/palette";
import { exportCollage } from "../domain/image";
import type { DayRecord } from "../domain/types";

type CollageArtwork = Pick<
  DayRecord,
  "count" | "photos" | "colorId" | "spacing"
>;
export type CollageExportImage = { blob: Blob; url: string };

/** Confirmation, completion and archive all render through the saved-image pipeline. */
export function useCollageExport(
  day: CollageArtwork,
  logo: boolean,
  getImageBlob: (id: string) => Promise<Blob | undefined>,
) {
  const [image, setImage] = useState<CollageExportImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setImage(null);
    setLoading(true);
    setError(false);
    void exportCollage(
      day.count,
      day.photos,
      getImageBlob,
      colorById(day.colorId).hex,
      logo,
      day.spacing,
    )
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ blob, url: objectUrl });
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    day.count,
    day.photos,
    day.colorId,
    day.spacing,
    getImageBlob,
    logo,
    attempt,
  ]);
  return {
    image,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
