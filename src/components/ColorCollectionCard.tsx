import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { buildColorCollection } from "../domain/colorCollection";
import { useApp } from "../state/AppContext";
import type { CSSProperties } from "react";

export function ColorCollectionCard({ onOpen }: { onOpen: () => void }) {
  const { days, dataBusy } = useApp();
  const collection = useMemo(() => buildColorCollection(days), [days]);
  const swatches =
    collection.collected.length <= 12
      ? collection.collected
      : Array.from(
          { length: 12 },
          (_, index) =>
            collection.collected[
              Math.round((index * (collection.collected.length - 1)) / 11)
            ],
        );
  return (
    <button
      className="color-collection-card"
      onClick={onOpen}
      disabled={dataBusy}
      aria-label={`色のコレクションを開く、${collection.total}色中${collection.collected.length}色`}
    >
      <span className="collection-card-content">
        <span className="collection-card-heading">
          <span>色のコレクション</span>
          <span className="collection-card-count">
            {collection.collected.length} / {collection.total}色
          </span>
        </span>
        <span className="collection-card-colors" aria-hidden="true">
          {swatches.map(({ color }) => (
            <span
              key={color.id}
              className="collection-color-dot"
              style={{ "--collection-color": color.hex } as CSSProperties}
            />
          ))}
        </span>
      </span>
      <ChevronRight size={19} aria-hidden="true" />
    </button>
  );
}
