import { useEffect, useRef, useState } from "react";
import type { DayRecord } from "../domain/types";
import type { ArtworkStyle, CollageSpacing } from "../domain/types";
import { Download, Maximize2, Share2 } from "lucide-react";
import { dateFromKey } from "../domain/date";
import { useCollageExport } from "../ui/useCollageExport";
import { useArtworkActions } from "../ui/useArtworkActions";
import { CollageImageView } from "./CollageImageView";
import { ArtworkStyleSelector } from "./ArtworkStyleSelector";
import { SpacingSelector } from "./SpacingSelector";
import { ArtworkMemo } from "./ArtworkMemo";
import { ColorMatchBadge } from "./ColorMatchBadge";
import { Modal } from "./Modal";
import type { ImageUrls } from "../state/AppContext";
import { colorById } from "../constants/palette";
import { useArtworkPalette } from "../ui/useArtworkPalette";
import { ArtworkAura, ArtworkColorSignature } from "./ArtworkAura";

/** Home displays the same finished pixels as the archive, preview and download. */
export function HomeArtwork({
  day,
  logo,
  getImageBlob,
  images,
  optionsOpen,
  onOptionsClose,
  onStyleChange,
  onSpacingChange,
  onMemoSave,
  disabled = false,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  images: Record<string, ImageUrls>;
  optionsOpen: boolean;
  onOptionsClose: () => void;
  onStyleChange: (style: ArtworkStyle) => void;
  onSpacingChange: (spacing: CollageSpacing) => void;
  onMemoSave: (memo: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const render = useCollageExport(day, logo, getImageBlob);
  const actions = useArtworkActions(day, render.image);
  const palette = useArtworkPalette(day, images);
  const daily = colorById(day.colorId).hex;
  const colors: [string, string, string] = palette ?? [daily, daily, daily];
  const frame = useRef<HTMLDivElement>(null);
  const viewerFrame = useRef<HTMLDivElement>(null);
  const [viewing, setViewing] = useState(false);
  useEffect(() => setViewing(false), [day.date]);
  return (
    <>
      <div
        ref={frame}
        className="collage-stage home-artwork"
        data-palette={palette ? "photo" : "daily"}
      >
        <ArtworkAura colors={colors} source={render.image?.url} frame={frame} />
        <CollageImageView render={render} alt="今日の完成コラージュ" />
        {render.image && (
          <button
            type="button"
            className="home-artwork-open"
            aria-label="作品を大きく鑑賞"
            disabled={disabled}
            onClick={(event) => {
              // Safari does not focus buttons on pointer clicks by default.
              event.currentTarget.focus({ preventScroll: true });
              setViewing(true);
            }}
          >
            <span aria-hidden="true">
              <Maximize2 size={16} />
            </span>
          </button>
        )}
      </div>
      <div className="home-artwork-caption">
        <ArtworkColorSignature colors={colors} />
        {day.memo?.trim() && (
          <p className="home-artwork-memo" aria-label="作品のひとこと">
            {day.memo}
          </p>
        )}
      </div>
      <div className="home-artwork-actions">
        <button
          className="primary-button home-save-button"
          onClick={actions.save}
          disabled={!render.image || actions.busy || disabled}
        >
          <Download size={19} aria-hidden="true" /> 画像を保存
        </button>
        <button
          className="secondary-button home-share-button"
          onClick={() => void actions.share()}
          disabled={!render.image || actions.busy || disabled}
        >
          <Share2 size={19} aria-hidden="true" />{" "}
          {actions.busy ? "共有中…" : "共有"}
        </button>
      </div>
      {actions.notice && (
        <p className="home-artwork-notice" role="status">
          {actions.notice}
        </p>
      )}
      <Modal
        open={viewing}
        onClose={() => setViewing(false)}
        title={new Intl.DateTimeFormat("ja-JP", {
          month: "long",
          day: "numeric",
        }).format(dateFromKey(day.date))}
        presentation="fullscreen"
        className="home-artwork-viewer"
      >
        <div className="home-viewer-content">
          <div ref={viewerFrame} className="home-viewer-image">
            {viewing && (
              <ArtworkAura
                colors={colors}
                source={render.image?.url}
                frame={viewerFrame}
              />
            )}
            <CollageImageView
              render={render}
              alt="大きく表示した今日の完成コラージュ"
            />
          </div>
          <ArtworkColorSignature colors={colors} />
          {day.memo?.trim() && <p className="home-viewer-memo">{day.memo}</p>}
        </div>
      </Modal>
      <Modal
        open={optionsOpen}
        onClose={onOptionsClose}
        title="作品のデザインと詳細"
        className="home-artwork-options"
      >
        <section className="home-artwork-option-group">
          <h3>デザイン</h3>
          <ArtworkStyleSelector
            carousel
            value={day.artworkStyle}
            previews={render.previews}
            onChange={onStyleChange}
          />
        </section>
        <section className="home-artwork-option-group">
          <h3>写真の間隔</h3>
          <SpacingSelector
            value={day.spacing}
            onChange={onSpacingChange}
            detail
          />
        </section>
        <section className="home-artwork-option-group">
          <h3>ひとこと</h3>
          <ArtworkMemo key={day.date} value={day.memo} onSave={onMemoSave} />
        </section>
        <section className="home-artwork-option-group">
          <h3>色マッチ度</h3>
          <ColorMatchBadge day={day} showComment />
        </section>
        <p className="modal-footnote">
          写真・並び・トリミング・フィルター・枚数は完成時のまま固定されています。
        </p>
      </Modal>
    </>
  );
}
