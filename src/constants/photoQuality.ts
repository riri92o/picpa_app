import type { PhotoQuality } from "../domain/types";

export const PHOTO_QUALITY_OPTIONS = [
  {
    id: "compact",
    label: "容量優先",
    description: "写真の解像度を保ち、圧縮を強めて容量を抑えます。",
    fullQuality: 0.68,
    thumbQuality: 0.65,
  },
  {
    id: "standard",
    label: "標準",
    description: "見た目と容量のバランスを取る、おすすめの設定です。",
    fullQuality: 0.78,
    thumbQuality: 0.72,
  },
  {
    id: "high",
    label: "高画質",
    description: "圧縮を控えめにします。保存容量は大きくなります。",
    fullQuality: 0.88,
    thumbQuality: 0.78,
  },
] as const satisfies readonly {
  id: PhotoQuality;
  label: string;
  description: string;
  fullQuality: number;
  thumbQuality: number;
}[];

export function resolvePhotoQuality(value?: string): PhotoQuality {
  return (
    PHOTO_QUALITY_OPTIONS.find((option) => option.id === value)?.id ??
    "standard"
  );
}
