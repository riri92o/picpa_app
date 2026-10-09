import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import type {
  CollageSpacing,
  GridCount,
  PhotoPlacement,
} from "../domain/types";
import { gridDimensions } from "../domain/image";
import type { ImageUrls } from "../state/AppContext";
import { CroppedPhoto } from "./CroppedPhoto";

export function PhotoTile({
  placement,
  url,
  onClick,
}: {
  placement: PhotoPlacement;
  url?: string;
  onClick?: () => void;
}) {
  const sortableProps = useSortable({ id: placement.id });
  const style = {
    transform: CSS.Transform.toString(sortableProps.transform),
    transition: sortableProps.transition,
  };
  return (
    <div
      ref={sortableProps.setNodeRef}
      style={style}
      className={`photo-tile ${sortableProps.isDragging ? "dragging" : ""}`}
      {...sortableProps.attributes}
      {...sortableProps.listeners}
      onClick={onClick}
    >
      <CroppedPhoto src={url} placement={placement} alt="コラージュ写真" />
    </div>
  );
}
function StaticPhotoTile({
  placement,
  url,
}: {
  placement: PhotoPlacement;
  url?: string;
}) {
  return (
    <div className="photo-tile static">
      <CroppedPhoto src={url} placement={placement} alt="コラージュ写真" />
    </div>
  );
}
export function CollageGrid({
  count,
  photos,
  images,
  locked = false,
  onAdd,
  onEdit,
  onReorder,
  mini = false,
  spacing = "separated",
}: {
  count: GridCount;
  photos: PhotoPlacement[];
  images: Record<string, ImageUrls>;
  locked?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onReorder?: (active: string, over: string) => void;
  mini?: boolean;
  spacing?: CollageSpacing;
}) {
  const [cols] = gridDimensions(count);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );
  const tiles = Array.from({ length: count }, (_, index) => {
    const placement = photos[index];
    if (placement && (locked || mini))
      return (
        <StaticPhotoTile
          key={placement.id}
          placement={placement}
          url={
            mini
              ? images[placement.id]?.thumb
              : (images[placement.id]?.full ?? images[placement.id]?.thumb)
          }
        />
      );
    return placement ? (
      <PhotoTile
        key={placement.id}
        placement={placement}
        url={images[placement.id]?.full ?? images[placement.id]?.thumb}
        onClick={() => onEdit?.(placement.id)}
      />
    ) : (
      <button
        key={`empty-${index}`}
        className="empty-tile"
        onClick={onAdd}
        disabled={locked || !onAdd}
        aria-label="写真を追加"
      >
        <Plus size={mini ? 10 : 30} strokeWidth={1.6} />
      </button>
    );
  });
  const grid = (
    <div
      className={`collage-grid ${mini ? "mini" : ""} count-${count} spacing-${spacing}`}
      style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}
    >
      {tiles}
    </div>
  );
  if (locked || mini) return grid;
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id)
      onReorder?.(String(active.id), String(over.id));
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={photos.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        {grid}
      </SortableContext>
    </DndContext>
  );
}
