import type { CSSProperties } from "react";
import { colorById } from "../constants/palette";
import type { DayRecord } from "../domain/types";
import type { ImageUrls } from "../state/AppContext";
import { CollageGrid } from "./CollageGrid";
import { CollageStage } from "./CollageStage";
import { BrandLogo } from "./BrandLogo";

/** Shares the home grid's crop, rotation and spacing, without enabling editing. */
export function CompletionPreview({
  day,
  images,
  logo = false,
}: {
  day: Pick<DayRecord, "count" | "spacing" | "photos" | "colorId">;
  images: Record<string, ImageUrls>;
  logo?: boolean;
}) {
  return (
    <div
      className="completion-preview"
      role="img"
      aria-label="完成するコラージュのプレビュー"
      style={
        { "--completion-color": colorById(day.colorId).hex } as CSSProperties
      }
    >
      <CollageStage count={day.count} spacing={day.spacing} inactive={false}>
        <div className="completion-photo-grid">
          <CollageGrid
            count={day.count}
            spacing={day.spacing}
            photos={day.photos}
            images={images}
            locked
          />
          {logo && (
            <BrandLogo
              className={`completion-grid-logo ${day.count === 4 ? "center-seam" : "lower-seam"}`}
            />
          )}
        </div>
      </CollageStage>
    </div>
  );
}
