import { useMemo } from "react";
import { soapFilmImage } from "../ui/soapFilm";

/** A cached spherical film follows the existing floating and mixing transforms.
 * The reflected light is shaded on the surface, rather than drawn as stickers. */
export function SoapBubbleSurface({
  color,
  neutral = false,
  revealed = false,
}: {
  color: string;
  neutral?: boolean;
  revealed?: boolean;
}) {
  const image = useMemo(
    () => soapFilmImage(color, neutral, revealed),
    [color, neutral, revealed],
  );
  return <image href={image} x="-50" y="-50" width="100" height="100" />;
}
