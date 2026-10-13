import { EXPORT_BRAND_LOGO } from "../constants/branding";

let logoImage: Promise<HTMLImageElement> | undefined;
function loadLogoImage(): Promise<HTMLImageElement> {
  if (!logoImage) {
    logoImage = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("ロゴを読み込めませんでした"));
      image.src = EXPORT_BRAND_LOGO.url;
    }).catch((error) => {
      logoImage = undefined;
      throw error;
    });
  }
  return logoImage;
}

export interface CollageLogoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The branded header is outside the photos and disappears when logo is OFF. */
export function collageBrandHeader(collageWidth: number, enabled: boolean) {
  const height = enabled
    ? Math.round(collageWidth * EXPORT_BRAND_LOGO.headerRatio)
    : 0;
  const width = Math.min(250, collageWidth * 0.245);
  const logo: CollageLogoPlacement | undefined = enabled
    ? {
        x: collageWidth / 2,
        y: height / 2,
        width,
        height: (width * EXPORT_BRAND_LOGO.height) / EXPORT_BRAND_LOGO.width,
      }
    : undefined;
  return { height, logo };
}

export async function drawCollageLogo(
  context: CanvasRenderingContext2D,
  placement: CollageLogoPlacement,
  left: number,
  top: number,
) {
  const image = await loadLogoImage();
  const { width, height } = placement;
  context.save();
  context.translate(
    left + placement.x - width / 2,
    top + placement.y - height / 2,
  );
  context.shadowColor = "#10152f85";
  context.shadowBlur = 3;
  context.drawImage(image, 0, 0, width, height);
  context.restore();
}
