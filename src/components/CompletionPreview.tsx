import { useEffect } from "react";
import type { ArtworkStyle, DayRecord } from "../domain/types";
import { useCollageExport } from "../ui/useCollageExport";
import { CollageImageView } from "./CollageImageView";
import { ArtworkStyleSelector } from "./ArtworkStyleSelector";

export function CompletionPreview({
  day,
  logo,
  getImageBlob,
  onReadyChange,
  onStyleChange,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  onReadyChange: (ready: boolean) => void;
  onStyleChange: (style: ArtworkStyle) => void;
}) {
  const render = useCollageExport(day, logo, getImageBlob);
  useEffect(() => {
    onReadyChange(!!render.image);
  }, [render.image, onReadyChange]);
  return (
    <>
      <div className="completion-preview">
        <CollageImageView
          render={render}
          alt="完成するコラージュのプレビュー"
        />
      </div>
      <ArtworkStyleSelector
        value={day.artworkStyle}
        previews={render.previews}
        onChange={onStyleChange}
      />
    </>
  );
}
