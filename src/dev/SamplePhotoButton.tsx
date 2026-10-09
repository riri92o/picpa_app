import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { useApp } from "../state/AppContext";

// Remove this component and samplePhotos.ts when the test tool is no longer needed.
export function SamplePhotoButton() {
  const { today, addSamplePhotos } = useApp();
  const [busy, setBusy] = useState(false);
  if (today.completedAt) return null;
  return (
    <div className="sample-tools">
      <button
        className="sample-button"
        aria-label="サンプル写真を追加（テスト用）"
        title="ペールグリーンのサンプル写真を追加"
        disabled={busy || today.photos.length === today.count}
        onClick={async () => {
          setBusy(true);
          try {
            await addSamplePhotos();
          } finally {
            setBusy(false);
          }
        }}
      >
        <ImagePlus size={16} />
        {busy ? "追加中…" : "サンプル"}
      </button>
      <p className="sr-only">ペールグリーンの写真で空き枠を埋めます</p>
    </div>
  );
}
