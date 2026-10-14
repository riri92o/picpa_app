import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { COLOR_HINTS } from "../constants/colorHints";
import type { ColorDefinition } from "../domain/types";
import { Modal } from "./Modal";

export function ColorHintButton({ color }: { color: ColorDefinition }) {
  const [open, setOpen] = useState(false);
  const hint = COLOR_HINTS[color.id];
  if (!hint) return null;
  return (
    <>
      <button
        className="color-hint-button"
        onClick={() => setOpen(true)}
        aria-label={`${color.name}のヒント`}
      >
        <Lightbulb size={14} aria-hidden="true" />
        ヒント
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="色のヒント">
        <div className="hint-color">
          <span
            className="hint-swatch"
            style={{ backgroundColor: color.hex }}
            aria-hidden="true"
          />
          <div>
            <h3>{color.name}</h3>
            <p>{hint.description}</p>
          </div>
        </div>
        <p className="hint-label">こんなところにあるかも</p>
        <ul className="hint-examples">
          {hint.examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
        <p className="modal-footnote">
          上の色を見本に、写真の主役になる色を探してみて。
        </p>
      </Modal>
    </>
  );
}
