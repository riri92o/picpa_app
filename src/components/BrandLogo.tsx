import { useId } from "react";
import { BRAND_LOGO, EXPORT_BRAND_LOGO } from "../constants/branding";

/** A presentation crop/mask preserves the approved pixels and letter shapes. */
export function BrandLogo({
  className = "",
  variant = "bubble",
}: {
  className?: string;
  variant?: "bubble" | "white";
}) {
  const id = `brand-${useId().replace(/:/g, "")}`;
  if (variant === "white")
    return (
      <img
        className={`brand-logo ${className}`}
        src={EXPORT_BRAND_LOGO.url}
        width={EXPORT_BRAND_LOGO.width}
        height={EXPORT_BRAND_LOGO.height}
        alt="PicPa"
      />
    );
  const { crop, sourceWidth, sourceHeight, url } = BRAND_LOGO;
  return (
    <svg
      className={`brand-logo ${className}`}
      viewBox={`0 0 ${crop.width} ${crop.height}`}
      role="img"
      aria-label="PicPa"
    >
      <defs>
        <clipPath id={id}>
          <rect width={crop.width} height={crop.height} rx={crop.height / 2} />
        </clipPath>
      </defs>
      <image
        href={url}
        x={-crop.x}
        y={-crop.y}
        width={sourceWidth}
        height={sourceHeight}
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}
