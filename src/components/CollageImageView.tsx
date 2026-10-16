import type { useCollageExport } from "../ui/useCollageExport";

export function CollageImageView({
  render,
  alt,
}: {
  render: ReturnType<typeof useCollageExport>;
  alt: string;
}) {
  return (
    <div
      className={`exported-collage-image ${render.image?.blob.type === "image/png" ? "transparent" : ""}`}
      aria-live="polite"
      aria-busy={render.loading}
    >
      {render.image ? (
        <img src={render.image.url} alt={alt} />
      ) : render.error ? (
        <div className="collage-image-error" role="alert">
          <p>画像を準備できませんでした</p>
          <button className="secondary-button" onClick={render.retry}>
            再読み込み
          </button>
        </div>
      ) : (
        <span>画像を準備中…</span>
      )}
    </div>
  );
}
