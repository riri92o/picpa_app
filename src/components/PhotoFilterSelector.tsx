import { useLayoutEffect, useRef } from "react";
import {
  PHOTO_FILTERS,
  resolvePhotoFilter,
  type PhotoFilter,
} from "../domain/photoFilter";
import type { PhotoPlacement } from "../domain/types";
import { CroppedPhoto } from "./CroppedPhoto";

export function PhotoFilterSelector({
  src,
  placement,
  disabled,
  onChange,
}: {
  src?: string;
  placement: PhotoPlacement;
  disabled: boolean;
  onChange: (filter: PhotoFilter) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const selected = resolvePhotoFilter(placement.filter);
  useLayoutEffect(() => {
    const element = list.current;
    const button =
      buttons.current[
        PHOTO_FILTERS.findIndex((filter) => filter.id === selected)
      ];
    if (element && button)
      element.scrollLeft =
        button.offsetLeft + button.offsetWidth / 2 - element.clientWidth / 2;
  }, [selected]);
  return (
    <section
      className="photo-filter-selector"
      aria-label="この写真のフィルター"
    >
      <div className="photo-filter-heading">
        <h3>フィルター</h3>
        <span>この写真に適用</span>
      </div>
      <div
        ref={list}
        className="photo-filter-options"
        role="radiogroup"
        aria-label="写真のフィルター"
        aria-orientation="horizontal"
      >
        {PHOTO_FILTERS.map((filter, index) => (
          <button
            key={filter.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-label={filter.name}
            aria-checked={selected === filter.id}
            tabIndex={selected === filter.id ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(filter.id)}
            onKeyDown={(event) => {
              const last = PHOTO_FILTERS.length - 1;
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? last
                    : ["ArrowRight", "ArrowDown"].includes(event.key)
                      ? (index + 1) % PHOTO_FILTERS.length
                      : ["ArrowLeft", "ArrowUp"].includes(event.key)
                        ? (index + last) % PHOTO_FILTERS.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              onChange(PHOTO_FILTERS[next].id);
              buttons.current[next]?.focus({ preventScroll: true });
              buttons.current[next]?.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }}
          >
            <span className="photo-filter-thumb" aria-hidden="true">
              <CroppedPhoto
                src={src}
                placement={{ ...placement, filter: filter.id }}
                alt=""
              />
            </span>
            <span className="photo-filter-name">{filter.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
