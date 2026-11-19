import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ARTWORK_STYLES } from "../constants/artwork";
import { resolveArtworkStyle } from "../domain/artworkLayout";
import type { ArtworkStyle } from "../domain/types";
import type { CollagePreviews } from "../ui/useCollageExport";

export function ArtworkStyleSelector({
  value,
  previews,
  onChange,
  carousel = false,
}: {
  value?: ArtworkStyle;
  previews: CollagePreviews | null;
  onChange: (style: ArtworkStyle) => void;
  carousel?: boolean;
}) {
  const selected = resolveArtworkStyle(value);
  const selectedIndex = ARTWORK_STYLES.findIndex(({ id }) => id === selected);
  const list = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const currentIndex = useRef(selectedIndex);
  currentIndex.current = selectedIndex;
  const positioned = useRef(false);
  const reduced = useReducedMotion();
  const center = (index: number, smooth = false) => {
    const element = list.current;
    const button = buttons.current[index];
    if (!element || !button) return;
    element.scrollTo({
      left:
        element.scrollLeft +
        button.getBoundingClientRect().left -
        element.getBoundingClientRect().left -
        (element.clientWidth - button.offsetWidth) / 2,
      behavior: smooth ? "smooth" : "instant",
    });
  };
  useLayoutEffect(() => {
    if (!carousel) return;
    center(selectedIndex, positioned.current && !reduced);
    positioned.current = true;
  }, [selectedIndex, reduced, carousel]);
  useLayoutEffect(() => {
    const element = list.current;
    if (!carousel || !element) return;
    const observer = new ResizeObserver(() => center(currentIndex.current));
    observer.observe(element);
    return () => observer.disconnect();
  }, [carousel]);
  const cards = (
    <div
      ref={list}
      className={`artwork-styles ${carousel ? "artwork-carousel-track" : ""}`}
      role="group"
      aria-label="完成画像のデザイン"
    >
      {ARTWORK_STYLES.map(({ id, name, number }, index) => (
        <button
          key={id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          className={`${selected === id ? "selected" : ""} ${id === "bubble-window" ? "water-style" : ""}`}
          aria-pressed={selected === id}
          onClick={() => onChange(id)}
          onKeyDown={(event) => {
            if (!carousel) return;
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? ARTWORK_STYLES.length - 1
                  : event.key === "ArrowLeft"
                    ? Math.max(0, index - 1)
                    : event.key === "ArrowRight"
                      ? Math.min(ARTWORK_STYLES.length - 1, index + 1)
                      : null;
            if (next === null) return;
            event.preventDefault();
            onChange(ARTWORK_STYLES[next].id);
            buttons.current[next]?.focus({ preventScroll: true });
          }}
        >
          <span className="artwork-style-thumbnail" aria-hidden="true">
            {previews ? (
              <img src={previews[id].url} alt="" />
            ) : (
              <span>{number}</span>
            )}
          </span>
          {carousel && selected === id && (
            <span className="artwork-style-check" aria-hidden="true">
              <Check size={12} />
            </span>
          )}
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
  if (!carousel) return cards;
  return (
    <div className="artwork-style-carousel">
      {cards}
      <div className="artwork-carousel-controls">
        <button
          type="button"
          aria-label="前のデザイン"
          disabled={selectedIndex === 0}
          onClick={() => onChange(ARTWORK_STYLES[selectedIndex - 1].id)}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <div role="status" aria-live="polite" aria-atomic="true">
          <span className="sr-only">
            {ARTWORK_STYLES[selectedIndex].name}、{ARTWORK_STYLES.length}種類中
            {selectedIndex + 1}番目
          </span>
          <span className="artwork-carousel-dots" aria-hidden="true">
            {ARTWORK_STYLES.map(({ id }) => (
              <span key={id} className={selected === id ? "selected" : ""} />
            ))}
          </span>
        </div>
        <button
          type="button"
          aria-label="次のデザイン"
          disabled={selectedIndex === ARTWORK_STYLES.length - 1}
          onClick={() => onChange(ARTWORK_STYLES[selectedIndex + 1].id)}
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
