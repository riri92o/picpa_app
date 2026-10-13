import { BRAND_LOGO } from "../constants/branding";
import type { GridCount } from "./types";

let logoImage: Promise<HTMLImageElement> | undefined;
function loadLogoImage(): Promise<HTMLImageElement> {
  if (!logoImage) {
    logoImage = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("ロゴを読み込めませんでした"));
      image.src = BRAND_LOGO.url;
    }).catch((error) => {
      logoImage = undefined;
      throw error;
    });
  }
  return logoImage;
}

/** A compact logo on an interior horizontal seam, for every fixed grid. */
export function collageLogoPlacement(
  count: GridCount,
  collageWidth: number,
  cellHeight: number,
  gap: number,
) {
  const seamRow = count === 4 ? 1 : 2;
  const width = Math.min(190, collageWidth * 0.185);
  return {
    x: collageWidth / 2,
    y: seamRow * cellHeight + (seamRow - 0.5) * gap,
    width,
    height: (width * BRAND_LOGO.crop.height) / BRAND_LOGO.crop.width,
  };
}

export async function drawCollageLogo(
  context: CanvasRenderingContext2D,
  placement: ReturnType<typeof collageLogoPlacement>,
  left: number,
  top: number,
) {
  const image = await loadLogoImage();
  const { width, height } = placement;
  const { crop } = BRAND_LOGO;
  context.save();
  context.translate(
    left + placement.x - width / 2,
    top + placement.y - height / 2,
  );
  context.beginPath();
  context.roundRect(0, 0, width, height, height / 2);
  context.shadowColor = "#10152f85";
  context.shadowBlur = 6;
  context.fillStyle = "#14182e";
  context.fill();
  context.shadowBlur = 0;
  context.clip();
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );
  context.restore();
}
