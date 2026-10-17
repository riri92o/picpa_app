import type { DayRecord } from "../domain/types";
import { useCollageExport } from "../ui/useCollageExport";
import { CollageImageView } from "./CollageImageView";

/** Home displays the same finished pixels as the archive, preview and download. */
export function HomeArtwork({
  day,
  logo,
  getImageBlob,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
}) {
  const render = useCollageExport(day, logo, getImageBlob);
  return (
    <div className="collage-stage home-artwork">
      <CollageImageView render={render} alt="今日の完成コラージュ" />
    </div>
  );
}
