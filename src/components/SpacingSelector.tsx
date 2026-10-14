import type { CollageSpacing } from "../domain/types";

function SpacingIllustration({ spacing }: { spacing: CollageSpacing }) {
  const joined = spacing === "joined";
  const width = joined ? 13 : 11;
  const height = joined ? 11 : 9;
  const stepX = joined ? 13 : 15;
  const stepY = joined ? 11 : 13;
  return (
    <svg viewBox="0 0 32 28" width="32" height="28" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => {
        const x = 3 + (index % 2) * stepX;
        const y = 3 + Math.floor(index / 2) * stepY;
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function SpacingSelector({
  value = "separated",
  onChange,
  detail = false,
}: {
  value?: CollageSpacing;
  onChange: (spacing: CollageSpacing) => void;
  detail?: boolean;
}) {
  return (
    <div
      className={`spacing-selector spacing-pictograms ${detail ? "detail-spacing" : ""}`}
      role="group"
      aria-label="写真の間隔"
    >
      {(["joined", "separated"] as const).map((spacing) => {
        const label = spacing === "joined" ? "すき間なし" : "すき間あり";
        return (
          <button
            key={spacing}
            className={value === spacing ? "selected" : ""}
            aria-pressed={value === spacing}
            aria-label={label}
            title={label}
            onClick={() => onChange(spacing)}
          >
            <SpacingIllustration spacing={spacing} />
          </button>
        );
      })}
    </div>
  );
}
