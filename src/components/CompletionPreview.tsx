import type { DayRecord } from "../domain/types";
import type { ImageUrls } from "../state/AppContext";
import { CollageGrid } from "./CollageGrid";
import { CollageStage } from "./CollageStage";

/** Shares the home grid's crop, rotation and spacing, without enabling editing. */
export function CompletionPreview({
  day,
  images,
}: {
  day: Pick<DayRecord, "count" | "spacing" | "photos">;
  images: Record<string, ImageUrls>;
}) {
  return (
    <div
      className="completion-preview"
      role="img"
      aria-label="完成するコラージュのプレビュー"
    >
      <CollageStage count={day.count} spacing={day.spacing} inactive={false}>
        <CollageGrid
          count={day.count}
          spacing={day.spacing}
          photos={day.photos}
          images={images}
          locked
        />
      </CollageStage>
    </div>
  );
}
