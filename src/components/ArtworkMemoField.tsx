import { useId } from "react";
import { MEMO_MAX_LENGTH, memoLength } from "../domain/memo";

export function ArtworkMemoField({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const length = memoLength(value);
  const tooLong = length > MEMO_MAX_LENGTH;
  return (
    <div className="memo-field">
      <label htmlFor={id}>ひとこと（任意）</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="今日の思い出をひとこと"
        rows={2}
        disabled={disabled}
        aria-describedby={`${id}-count`}
        aria-invalid={tooLong}
        autoFocus={autoFocus}
      />
      <p
        id={`${id}-count`}
        className={`memo-count ${tooLong ? "over-limit" : ""}`}
      >
        {tooLong && `${MEMO_MAX_LENGTH}文字以内で入力してください · `}
        {length} / {MEMO_MAX_LENGTH}
      </p>
    </div>
  );
}
