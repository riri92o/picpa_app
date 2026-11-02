import { useEffect, useRef, useState } from "react";
import { resolveArtworkStyle } from "../domain/artworkLayout";
import type { DayRecord } from "../domain/types";
import type { CollageExportImage } from "./useCollageExport";

/** Home actions use the already displayed export, including transparent PNGs. */
export function useArtworkActions(
  day: DayRecord,
  image: CollageExportImage | null,
) {
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [notice, setNotice] = useState("");
  useEffect(() => setNotice(""), [image?.url]);
  const filename = (blob: Blob) =>
    `PicPa-${day.date}-${resolveArtworkStyle(day.artworkStyle)}.${blob.type === "image/png" ? "png" : "jpg"}`;
  const download = (current: CollageExportImage) => {
    // A separate URL stays alive if the user changes tabs while Files opens.
    const url = URL.createObjectURL(current.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename(current.blob);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  const save = () => {
    if (!image || working.current) return;
    try {
      download(image);
      setNotice("保存を開始しました。保存先で画像を確認してください。");
    } catch {
      setNotice("保存を開始できませんでした。もう一度お試しください。");
    }
  };
  const share = async () => {
    if (!image || working.current) return;
    working.current = true;
    setBusy(true);
    setNotice("");
    try {
      const file = new File([image.blob], filename(image.blob), {
        type: image.blob.type,
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "PicPa" });
      } else {
        download(image);
        setNotice(
          "この環境では共有に対応していないため、画像の保存を開始しました。",
        );
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setNotice("共有できませんでした。画像を保存してお試しください。");
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  return { save, share, busy, notice };
}
