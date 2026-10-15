import { useEffect } from "react";
import type { DayRecord } from "../domain/types";
import { useCollageExport } from "../ui/useCollageExport";
import { CollageImageView } from "./CollageImageView";

export function CompletionPreview({
  day,
  logo,
  getImageBlob,
  onReadyChange,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  onReadyChange: (ready: boolean) => void;
}) {
  const render = useCollageExport(day, logo, getImageBlob);
  useEffect(() => {
    onReadyChange(!!render.image);
  }, [render.image, onReadyChange]);
  return (
    <div className="completion-preview">
      <CollageImageView render={render} alt="完成するコラージュのプレビュー" />
    </div>
  );
}
