import type { DayRecord } from "../domain/types";
import type { ArtworkStyle, CollageSpacing } from "../domain/types";
import { Download, Share2 } from "lucide-react";
import { useCollageExport } from "../ui/useCollageExport";
import { useArtworkActions } from "../ui/useArtworkActions";
import { CollageImageView } from "./CollageImageView";
import { ArtworkStyleSelector } from "./ArtworkStyleSelector";
import { SpacingSelector } from "./SpacingSelector";
import { ArtworkMemo } from "./ArtworkMemo";
import { ColorMatchBadge } from "./ColorMatchBadge";
import { Modal } from "./Modal";

/** Home displays the same finished pixels as the archive, preview and download. */
export function HomeArtwork({
  day,
  logo,
  getImageBlob,
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
  optionsOpen: boolean;
  onOptionsClose: () => void;
  onStyleChange: (style: ArtworkStyle) => void;
  onSpacingChange: (spacing: CollageSpacing) => void;
  onMemoSave: (memo: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const render = useCollageExport(day, logo, getImageBlob);
  const actions = useArtworkActions(day, render.image);
  return (
    <>
      <div className="collage-stage home-artwork">
        <CollageImageView render={render} alt="今日の完成コラージュ" />
      </div>
      {day.memo?.trim() && (
        <p className="home-artwork-memo" aria-label="作品のひとこと">
          {day.memo}
        </p>
      )}
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
        open={optionsOpen}
        onClose={onOptionsClose}
        title="作品のデザインと詳細"
        className="home-artwork-options"
      >
        <section className="home-artwork-option-group">
          <h3>デザイン</h3>
          <ArtworkStyleSelector
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
          写真・並び・トリミング・枚数は完成時のまま固定されています。
        </p>
      </Modal>
    </>
  );
}
