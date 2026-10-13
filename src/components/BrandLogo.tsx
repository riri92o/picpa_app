import { useId } from "react";
import { BRAND_LOGO } from "../constants/branding";

/** A presentation crop/mask preserves the approved pixels and letter shapes. */
export function BrandLogo({ className = "" }: { className?: string }) {
  const id = `brand-${useId().replace(/:/g, "")}`;
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
