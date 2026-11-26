import { useMemo } from "react";
import { soapFilmImage } from "../ui/soapFilm";
import { drawDropletImage } from "../ui/drawDroplet";

/** A cached spherical film follows the existing floating and mixing transforms.
 * The reflected light is shaded on the surface, rather than drawn as stickers. */
export function SoapBubbleSurface({
  color,
  neutral = false,
  revealed = false,
  variant = "bubble",
}: {
  color: string;
  neutral?: boolean;
  revealed?: boolean;
  variant?: "bubble" | "droplet";
}) {
  const image = useMemo(
    () =>
      variant === "droplet"
        ? drawDropletImage(color)
        : soapFilmImage(color, neutral, revealed),
    [color, neutral, revealed, variant],
  );
  return <image href={image} x="-50" y="-50" width="100" height="100" />;
}
