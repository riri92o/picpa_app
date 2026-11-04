import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateFromKey } from "../domain/date";
import type { DayRecord } from "../domain/types";
import { useApp } from "../state/AppContext";
import { useCollageExport } from "../ui/useCollageExport";

function CollectionPreview({
  day,
  logo,
  getImageBlob,
  onSettled,
}: {
  day: DayRecord;
  logo: boolean;
  getImageBlob: (id: string) => Promise<Blob | undefined>;
  onSettled: () => void;
}) {
  const render = useCollageExport(day, logo, getImageBlob, false);
  useEffect(() => {
    if (render.image || render.error) onSettled();
  }, [render.image, render.error, onSettled]);
  return render.image ? (
    <img src={render.image.url} alt="" />
  ) : (
    <span className="collection-preview-state">
      {render.error ? "作品を開いて確認" : "画像を準備中…"}
    </span>
  );
}

/** Two previews per page, generated sequentially. Closing the gallery releases
 * its URLs and aborts pending work before the full-size viewer opens. */
function GalleryPage({
  days,
  onOpen,
  paused,
}: {
  days: DayRecord[];
  onOpen: (date: string) => void;
  paused: boolean;
}) {
  const { settings, getImageBlob, dataBusy } = useApp();
  const [readyThrough, setReadyThrough] = useState(0);
  useEffect(() => {
    if (paused) setReadyThrough(0);
  }, [paused]);
  const settleFirst = useCallback(
    () => setReadyThrough((value) => Math.max(value, 1)),
    [],
  );
  const settleSecond = useCallback(
    () => setReadyThrough((value) => Math.max(value, 2)),
    [],
  );
  return (
    <div className="collection-artworks">
      {days.map((day, index) => {
        const date = new Intl.DateTimeFormat("ja-JP", {
          month: "long",
          day: "numeric",
        }).format(dateFromKey(day.date));
        return (
          <button
            key={day.date}
            className="collection-artwork"
            data-collection-date={day.date}
            disabled={dataBusy}
            onClick={() => onOpen(day.date)}
            aria-label={`${day.date}の完成作品を開く`}
          >
            <span className="collection-artwork-image" aria-hidden="true">
              {!paused && index <= readyThrough ? (
                <CollectionPreview
                  day={day}
                  logo={settings.exportLogo}
                  getImageBlob={getImageBlob}
                  onSettled={index === 0 ? settleFirst : settleSecond}
                />
              ) : (
                <span className="collection-preview-state">画像を準備中…</span>
              )}
            </span>
            <time dateTime={day.date}>{date}</time>
          </button>
        );
      })}
    </div>
  );
}

export function CollectionGallery({
  days,
  onOpen,
  paused = false,
}: {
  days: DayRecord[];
  onOpen: (date: string) => void;
  paused?: boolean;
}) {
  const { settings } = useApp();
  const [page, setPage] = useState(0);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(days.length / 2) - 1),
  );
  const shown = days.slice(currentPage * 2, currentPage * 2 + 2);
  const signature = JSON.stringify([
    shown.map((day) => [day.date, day.photos, day.spacing, day.artworkStyle]),
    settings.exportLogo,
  ]);
  return (
    <>
      <GalleryPage
        key={signature}
        days={shown}
        onOpen={onOpen}
        paused={paused}
      />
      {days.length > 2 && (
        <div className="collection-pagination" aria-label="作品のページ">
          <button
            className="icon-button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            aria-label="前の作品"
          >
            <ChevronLeft size={20} />
          </button>
          <span>
            {currentPage * 2 + 1}–{Math.min(currentPage * 2 + 2, days.length)} /{" "}
            {days.length}作品
          </span>
          <button
            className="icon-button"
            disabled={(currentPage + 1) * 2 >= days.length}
            onClick={() => setPage(currentPage + 1)}
            aria-label="次の作品"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  );
}
