import { ARTWORK_STYLES } from "../constants/artwork";
import { resolveArtworkStyle } from "../domain/artworkLayout";
import type { ArtworkStyle } from "../domain/types";
import type { CollagePreviews } from "../ui/useCollageExport";

export function ArtworkStyleSelector({
  value,
  previews,
  onChange,
}: {
  value?: ArtworkStyle;
  previews: CollagePreviews | null;
  onChange: (style: ArtworkStyle) => void;
}) {
  return (
    <div
      className="artwork-styles"
      role="group"
      aria-label="完成画像のデザイン"
    >
      {ARTWORK_STYLES.map(({ id, name, number }) => (
        <button
          key={id}
          className={`${resolveArtworkStyle(value) === id ? "selected" : ""} ${id === "bubble-window" ? "water-style" : ""}`}
          aria-pressed={resolveArtworkStyle(value) === id}
          onClick={() => onChange(id)}
        >
          <span className="artwork-style-thumbnail" aria-hidden="true">
            {previews ? (
              <img src={previews[id].url} alt="" />
            ) : (
              <span>{number}</span>
            )}
          </span>
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}
