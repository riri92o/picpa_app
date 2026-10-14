import { useId, useState, type FormEvent } from "react";
import { MessageSquarePlus, Pencil } from "lucide-react";
import { MEMO_MAX_LENGTH, memoLength } from "../domain/memo";

export function ArtworkMemo({
  value = "",
  onSave,
}: {
  value?: string;
  onSave: (memo: string) => Promise<boolean>;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const length = memoLength(draft);
  const tooLong = length > MEMO_MAX_LENGTH;
  const edit = () => {
    setDraft(value);
    setNotice("");
    setEditing(true);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || tooLong) return;
    setSaving(true);
    setNotice("");
    try {
      if (await onSave(draft)) {
        setEditing(false);
        setNotice(draft.trim() ? "保存しました" : "メモを消しました");
      } else {
        setNotice("保存できませんでした。もう一度お試しください。");
      }
    } catch {
      setNotice("保存できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="artwork-memo" aria-label="作品のひとことメモ">
      {editing ? (
        <form className="memo-editor" onSubmit={(event) => void submit(event)}>
          <label htmlFor={id}>ひとことメモ</label>
          <textarea
            id={id}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="散歩で見つけた、やさしい緑。"
            rows={3}
            disabled={saving}
            aria-describedby={`${id}-count ${id}-notice`}
            aria-invalid={tooLong}
            autoFocus
          />
          <p
            id={`${id}-count`}
            className={`memo-count ${tooLong ? "over-limit" : ""}`}
          >
            {tooLong && `${MEMO_MAX_LENGTH}文字以内で入力してください · `}
            {length} / {MEMO_MAX_LENGTH}
          </p>
          <div className="memo-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setNotice("");
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || tooLong}
            >
              {saving ? "保存中…" : "メモを保存"}
            </button>
          </div>
        </form>
      ) : value ? (
        <div className="memo-saved">
          <p>{value}</p>
          <button
            type="button"
            className="memo-edit-button"
            onClick={edit}
            aria-label="メモを編集"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button type="button" className="memo-add-button" onClick={edit}>
          <MessageSquarePlus size={16} aria-hidden="true" />
          ひとことを残す
        </button>
      )}
      <p id={`${id}-notice`} className="memo-notice" role="status">
        {notice}
      </p>
    </section>
  );
}
