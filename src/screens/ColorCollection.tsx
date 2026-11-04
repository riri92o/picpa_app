import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ArrowLeft, Ellipsis } from "lucide-react";
import { buildColorCollection } from "../domain/colorCollection";
import { dateFromKey } from "../domain/date";
import { useApp } from "../state/AppContext";
import { CollectionGallery } from "../components/CollectionGallery";
import { ExportedCollage } from "../components/ExportedCollage";
import { ArtworkMemo } from "../components/ArtworkMemo";
import { ColorMatchBadge } from "../components/ColorMatchBadge";
import { SpacingSelector } from "../components/SpacingSelector";
import { Modal } from "../components/Modal";

export function ColorCollection({ onBack }: { onBack: () => void }) {
  const {
    days,
    today,
    settings,
    getImageBlob,
    setArtworkStyle,
    setSpacing,
    setMemo,
    dataBusy,
  } = useApp();
  const collection = useMemo(() => buildColorCollection(days), [days]);
  const [colorId, setColorId] = useState(() =>
    today.completedAt &&
    collection.collected.some(({ color }) => color.id === today.colorId)
      ? today.colorId!
      : (collection.mostRecentColorId ?? collection.colors[0]?.color.id ?? ""),
  );
  const entry =
    collection.colors.find(({ color }) => color.id === colorId) ??
    collection.colors[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const selectedDay = days.find(
    (day) => day.date === selectedDate && day.completedAt,
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const grid = colorsRef.current;
    const label = labelRef.current;
    const selected = grid?.querySelector<HTMLButtonElement>(
      '.collection-color[aria-pressed="true"]',
    );
    if (!grid || !label || !selected) return;
    const position = () => {
      const bounds = grid.getBoundingClientRect();
      const target = selected.getBoundingClientRect();
      const box = label.getBoundingClientRect();
      const center = target.left - bounds.left + target.width / 2;
      const left = Math.max(
        0,
        Math.min(center - box.width / 2, bounds.width - box.width),
      );
      const above =
        target.top - bounds.top >= box.height + 8 &&
        target.top >= box.height + 8;
      label.style.left = `${left}px`;
      label.style.top = `${above ? target.top - bounds.top - box.height - 8 : target.bottom - bounds.top + 8}px`;
      label.style.setProperty(
        "--collection-label-anchor",
        `${center - left}px`,
      );
      label.dataset.side = above ? "above" : "below";
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(grid);
    observer.observe(label);
    window.addEventListener("scroll", position, {
      passive: true,
      capture: true,
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", position, true);
    };
  }, [entry?.color.id, entry?.days.length]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  const close = () => {
    const date = selectedDate;
    setSelectedDate(null);
    setEditing(false);
    requestAnimationFrame(() =>
      screenRef.current
        ?.querySelector<HTMLButtonElement>(`[data-collection-date="${date}"]`)
        ?.focus({ preventScroll: true }),
    );
  };
  return (
    <main ref={screenRef} className="screen collection-screen">
      <div className="collection-heading">
        <button
          className="icon-button collection-back"
          onClick={onBack}
          disabled={dataBusy}
          aria-label="Homeに戻る"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 ref={titleRef} tabIndex={-1}>
          色のコレクション
        </h2>
      </div>
      <section className="collection-summary" aria-label="集めた色">
        <span>集めた色</span>
        <p>
          <strong>{collection.collected.length}</strong>
          <span> / {collection.total}色</span>
        </p>
      </section>
      <div
        ref={colorsRef}
        className="collection-colors"
        role="group"
        aria-label="色ごとの完成作品"
      >
        {collection.colors.map(({ color, days: works }) => (
          <button
            key={color.id}
            className={`collection-color ${works.length ? "collected" : "uncollected"} ${entry?.color.id === color.id ? "selected" : ""}`}
            onClick={() => setColorId(color.id)}
            aria-pressed={entry?.color.id === color.id}
            aria-label={`${color.name}、${works.length ? `${works.length}作品` : "未収集"}`}
            style={{ "--collection-color": color.hex } as CSSProperties}
          >
            <span className="collection-color-surface" aria-hidden="true" />
          </button>
        ))}
        {entry && (
          <div
            ref={labelRef}
            className="collection-color-label"
            aria-hidden="true"
          >
            <span>{entry.color.name}</span>
            <span>{entry.days.length}作品</span>
          </div>
        )}
      </div>
      {entry && (
        <section
          className="collection-works"
          aria-label={`${entry.color.name}の作品`}
        >
          {entry.days.length ? (
            <CollectionGallery
              key={entry.color.id}
              days={entry.days}
              paused={!!selectedDay}
              onOpen={(date) => {
                setEditing(false);
                setSelectedDate(date);
              }}
            />
          ) : (
            <p className="collection-empty">
              この色の作品を完成すると、ここに並びます。
            </p>
          )}
        </section>
      )}
      <Modal
        open={!!selectedDay}
        onClose={close}
        title={
          selectedDay
            ? new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(dateFromKey(selectedDay.date))
            : ""
        }
        className={!editing ? "artwork-viewer-sheet" : undefined}
        headerAction={
          <button
            className="icon-button small"
            aria-label={editing ? "作品を見る" : "デザイン・保存"}
            title={editing ? "作品を見る" : "デザイン・保存"}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? <ArrowLeft size={18} /> : <Ellipsis size={20} />}
          </button>
        }
      >
        {selectedDay && (
          <>
            {editing && (
              <SpacingSelector
                value={selectedDay.spacing}
                onChange={(spacing) => setSpacing(spacing, selectedDay.date)}
                detail
              />
            )}
            <ExportedCollage
              day={selectedDay}
              logo={settings.exportLogo}
              getImageBlob={getImageBlob}
              viewOnly={!editing}
              onStyleChange={(style) =>
                setArtworkStyle(style, selectedDay.date)
              }
            >
              {editing ? (
                <>
                  <ColorMatchBadge day={selectedDay} showComment />
                  <ArtworkMemo
                    key={selectedDay.date}
                    value={selectedDay.memo}
                    onSave={(memo) => setMemo(selectedDay.date, memo)}
                  />
                </>
              ) : selectedDay.memo?.trim() ? (
                <p className="viewer-memo" aria-label="作品のひとこと">
                  {selectedDay.memo}
                </p>
              ) : null}
            </ExportedCollage>
          </>
        )}
      </Modal>
    </main>
  );
}
