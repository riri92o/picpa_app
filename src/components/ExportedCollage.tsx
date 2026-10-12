import { useEffect, useState, type ReactNode } from "react";
import { Download, Share2 } from "lucide-react";
import { colorById } from "../constants/palette";
import { exportCollage } from "../domain/image";
import type { DayRecord } from "../domain/types";

type ExportedImage = { blob: Blob; url: string };

/** Displays the exact export, including the selected color's metallic frame. */
export function ExportedCollage({
  day,
  logo,
  getImageBlob,
  children,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  children?: ReactNode;
}) {
  const [image, setImage] = useState<ExportedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setImage(null);
    setLoading(true);
    setNotice("");
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
        if (active) setNotice("画像を準備できませんでした");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [day.count, day.photos, day.colorId, day.spacing, getImageBlob, logo]);

  const save = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `PicPa-${day.date}.jpg`;
    link.click();
    setNotice("画像を保存しました");
  };
  const share = async () => {
    if (!image) return;
    setBusy(true);
    try {
      const file = new File([image.blob], `PicPa-${day.date}.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "PicPa" });
      } else {
        save();
        setNotice("共有に対応していないため画像を保存しました");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setNotice("共有できませんでした");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="exported-collage">
      <div className="exported-collage-image" aria-live="polite">
        {image ? (
          <img src={image.url} alt="保存・共有する完成画像" />
        ) : (
          <span>
            {loading ? "画像を準備中…" : "プレビューを表示できません"}
          </span>
        )}
      </div>
      {children}
      <div className="detail-actions">
        <button
          className="secondary-button"
          disabled={!image || busy}
          onClick={save}
        >
          <Download size={18} /> 保存
        </button>
        <button
          className="primary-button"
          disabled={!image || busy}
          onClick={() => void share()}
        >
          <Share2 size={18} /> 共有
        </button>
      </div>
      {notice && <p className="modal-footnote centered">{notice}</p>}
    </div>
  );
}
