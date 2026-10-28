import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Database,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { colorById } from "../../constants/palette";
import { dateFromKey } from "../../domain/date";
import type { DayRecord } from "../../domain/types";
import { useApp } from "../../state/AppContext";
import { Modal } from "../Modal";
import {
  backupFilename,
  downloadBackup,
  errorMessage,
  formatBytes,
  SettingsNotice,
} from "./SettingsShared";

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(dateFromKey(date));
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(
    dateFromKey(`${month}-01`),
  );

export function StoragePanel({
  onBusyChange,
}: {
  onBusyChange: (busy: boolean) => void;
}) {
  const { days, assets, images, dataBusy, exportBackup, deleteRecords } =
    useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = dataBusy || working;
  const assetsById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const groups = useMemo(() => {
    const months = new Map<string, DayRecord[]>();
    for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
      const month = day.date.slice(0, 7);
      const group = months.get(month) ?? [];
      group.push(day);
      months.set(month, group);
    }
    return Array.from(months.entries());
  }, [days]);
  useEffect(() => {
    const dates = new Set(days.map((day) => day.date));
    setSelected(
      (previous) => new Set([...previous].filter((date) => dates.has(date))),
    );
  }, [days]);
  const photoIds = (records: DayRecord[]) =>
    new Set(records.flatMap((day) => day.photos.map((photo) => photo.id)));
  const photoBytes = (ids: Set<string>) =>
    [...ids].reduce((sum, id) => {
      const asset = assetsById.get(id);
      return sum + (asset ? asset.fullBytes + asset.thumbBytes : 0);
    }, 0);
  const selectedDays = days.filter((day) => selected.has(day.date));
  const selectedIds = photoIds(selectedDays);
  const retainedIds = photoIds(days.filter((day) => !selected.has(day.date)));
  const freedIds = new Set(
    [...selectedIds].filter((id) => !retainedIds.has(id)),
  );
  const totalBytes = assets.reduce(
    (sum, asset) => sum + asset.fullBytes + asset.thumbBytes,
    0,
  );
  const toggle = (date: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  const selectMonth = (records: DayRecord[]) =>
    setSelected((previous) => {
      const next = new Set(previous);
      const all = records.every((day) => next.has(day.date));
      for (const day of records) {
        if (all) next.delete(day.date);
        else next.add(day.date);
      }
      return next;
    });
  const start = () => {
    setWorking(true);
    onBusyChange(true);
    setError("");
    setMessage("");
  };
  const finish = () => {
    setWorking(false);
    onBusyChange(false);
  };
  const saveSelected = async () => {
    start();
    try {
      const blob = await exportBackup([...selected]);
      downloadBackup(blob, backupFilename(`${selected.size}-days`));
      setMessage(
        `${selected.size}日分のバックアップを作成しました。保存先でファイルを確認してください。`,
      );
    } catch (cause) {
      setError(errorMessage(cause, "選んだ記録を書き出せませんでした"));
    } finally {
      finish();
    }
  };
  const removeSelected = async () => {
    const count = selected.size;
    start();
    try {
      if (await deleteRecords([...selected])) {
        setSelected(new Set());
        setDeleteOpen(false);
        setMessage(`${count}日分の記録を削除しました。`);
      } else {
        setError("記録を削除できませんでした。もう一度お試しください。");
      }
    } catch (cause) {
      setError(errorMessage(cause, "記録を削除できませんでした"));
    } finally {
      finish();
    }
  };
  return (
    <div className="settings-detail-stack" aria-busy={busy}>
      <div className="settings-storage-overview">
        <div>
          <strong>{formatBytes(totalBytes)}</strong>
          <span>写真データ</span>
        </div>
        <div>
          <strong>
            {days.filter((day) => day.completedAt).length}
            <small>点</small>
          </strong>
          <span>完成した作品</span>
        </div>
        <div>
          <strong>
            {days.length}
            <small>日</small>
          </strong>
          <span>保存した記録</span>
        </div>
      </div>
      <p className="settings-detail-intro">
        日付を選ぶと、バックアップの書き出しや削除ができます。容量は写真本体とサムネイルの合計です。
      </p>
      {message && <SettingsNotice>{message}</SettingsNotice>}
      {error && !deleteOpen && <SettingsNotice error>{error}</SettingsNotice>}
      {!days.length ? (
        <div className="settings-empty-state">
          <Database size={30} aria-hidden="true" />
          <h3>まだ記録がありません</h3>
          <p>色を引くと、ここに日付ごとの記録が表示されます。</p>
        </div>
      ) : (
        <div className="settings-months">
          {groups.map(([month, records], index) => (
            <details className="settings-month" key={month} open={index === 0}>
              <summary>
                <span>
                  <strong>{monthLabel(month)}</strong>
                  <small>
                    {records.length}日分 ·{" "}
                    {formatBytes(photoBytes(photoIds(records)))}
                  </small>
                </span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="settings-month-tools">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => selectMonth(records)}
                >
                  <Check size={15} aria-hidden="true" />{" "}
                  {records.every((day) => selected.has(day.date))
                    ? "この月の選択を解除"
                    : "この月を選択"}
                </button>
              </div>
              <div className="settings-records">
                {records.map((day) => (
                  <label
                    className={`settings-record ${selected.has(day.date) ? "is-selected" : ""}`}
                    key={day.date}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(day.date)}
                      disabled={busy}
                      onChange={() => toggle(day.date)}
                      aria-label={`${day.date}の記録を選択`}
                    />
                    <span
                      className="settings-record-thumb"
                      aria-hidden="true"
                      style={{
                        backgroundColor: day.colorId
                          ? colorById(day.colorId).hex
                          : undefined,
                      }}
                    >
                      {day.photos[0] && images[day.photos[0].id]?.thumb && (
                        <img
                          src={images[day.photos[0].id].thumb}
                          alt=""
                          loading="lazy"
                        />
                      )}
                    </span>
                    <span className="settings-record-copy">
                      <strong>{dayLabel(day.date)}</strong>
                      <small>
                        {day.colorId
                          ? colorById(day.colorId).name
                          : "色を引く前"}{" "}
                        · {day.completedAt ? "完成" : "制作中"} ·{" "}
                        {day.photos.length}枚
                      </small>
                    </span>
                    <span className="settings-record-bytes">
                      {formatBytes(photoBytes(photoIds([day])))}
                    </span>
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {!!selected.size && (
        <>
          <div className="settings-selection-spacer" />
          <div
            className="settings-selection-bar"
            role="region"
            aria-label="選んだ記録の操作"
          >
            <div className="settings-selection-heading">
              <span>
                <strong>{selected.size}日分を選択</strong>
                <small>
                  {selectedIds.size}枚 · {formatBytes(photoBytes(selectedIds))}
                </small>
              </span>
              <button
                type="button"
                aria-label="選択を解除"
                disabled={busy}
                onClick={() => setSelected(new Set())}
              >
                <X size={18} />
              </button>
            </div>
            <div className="settings-selection-actions">
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={saveSelected}
              >
                <Download size={16} aria-hidden="true" /> 書き出す
              </button>
              <button
                type="button"
                className="settings-delete-button"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2 size={16} aria-hidden="true" /> 削除
              </button>
            </div>
          </div>
        </>
      )}
      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!busy) setDeleteOpen(false);
        }}
        title="選んだ記録を削除"
      >
        <p className="modal-description">
          {selected.size}
          日分の色・写真・完成記録・ひとことを削除します。他の日にも使われている写真は残します。
        </p>
        <p className="settings-delete-estimate">
          解放する写真データの目安：{formatBytes(photoBytes(freedIds))}
        </p>
        <p className="modal-description">
          元に戻すにはバックアップが必要です。必要な記録は先に書き出してください。
        </p>
        {error && <SettingsNotice error>{error}</SettingsNotice>}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={() => setDeleteOpen(false)}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={busy}
            onClick={removeSelected}
          >
            {busy ? "削除中…" : `${selected.size}日分を削除`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
