import { useEffect, useState, type ReactNode } from "react";
import { Download, Share2 } from "lucide-react";
import type { ArtworkStyle, DayRecord } from "../domain/types";
import { useCollageExport } from "../ui/useCollageExport";
import { CollageImageView } from "./CollageImageView";
import { ArtworkStyleSelector } from "./ArtworkStyleSelector";
import { resolveArtworkStyle } from "../domain/artworkLayout";
import { validColorMatch } from "../domain/colorMatch";
import { ColorMatchBadge } from "./ColorMatchBadge";

/** Displays the selected final artwork, using its original PNG/JPEG for save and share. */
export function ExportedCollage({
  day,
  logo,
  getImageBlob,
  children,
  onStyleChange,
  viewOnly = false,
  showActions = !viewOnly,
  showColorMatch = false,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  children?: ReactNode;
  onStyleChange: (style: ArtworkStyle) => void;
  viewOnly?: boolean;
  showActions?: boolean;
  showColorMatch?: boolean;
}) {
  const render = useCollageExport(day, logo, getImageBlob, !viewOnly);
  const { image } = render;
  const extension = image?.blob.type === "image/png" ? "png" : "jpg";
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setNotice("");
  }, [image?.url]);

  const save = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `PicPa-${day.date}-${resolveArtworkStyle(day.artworkStyle)}.${extension}`;
    link.click();
    setNotice("画像を保存しました");
  };
  const share = async () => {
    if (!image) return;
    setBusy(true);
    try {
      const file = new File(
        [image.blob],
        `PicPa-${day.date}-${resolveArtworkStyle(day.artworkStyle)}.${extension}`,
        {
          type: image.blob.type,
        },
      );
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
    <div className={`exported-collage ${viewOnly ? "artwork-viewer" : ""}`}>
      <CollageImageView
        render={render}
        alt={viewOnly ? "完成したコラージュ" : "保存・共有する完成画像"}
      />
      {!viewOnly && (
        <ArtworkStyleSelector
          value={day.artworkStyle}
          previews={render.previews}
          onChange={onStyleChange}
        />
      )}
      {children}
      {showColorMatch &&
        (image || validColorMatch(day) ? (
          <ColorMatchBadge day={day} compact showComment />
        ) : (
          <div
            className="color-match compact"
            role="status"
            aria-label="色マッチ度は画像の準備後に表示します"
          >
            <span className="color-match-copy">色マッチ度</span>
            <span className="score-loading" aria-hidden="true">
              —
            </span>
          </div>
        ))}
      {showActions && (
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
      )}
      {showActions && notice && (
        <p className="modal-footnote centered" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
