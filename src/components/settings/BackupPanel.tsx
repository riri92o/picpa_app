import { useRef, useState } from "react";
import { ArchiveRestore, Download, FileCheck2, FolderOpen } from "lucide-react";
import { readBackup, type BackupSnapshot } from "../../domain/backup";
import { backupPhotoRepairCandidates } from "../../domain/backupRepair";
import { useApp } from "../../state/AppContext";
import {
  backupFilename,
  downloadBackup,
  errorMessage,
  formatBytes,
  SettingsNotice,
} from "./SettingsShared";

export function BackupPanel({
  onBusyChange,
}: {
  onBusyChange: (busy: boolean) => void;
}) {
  const { days, assets, dataBusy, exportBackup, restoreBackup } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [operation, setOperation] = useState<
    "export" | "read" | "restore" | null
  >(null);
  const [pending, setPending] = useState<{
    snapshot: BackupSnapshot;
    name: string;
    size: number;
  } | null>(null);
  const [restoreSettings, setRestoreSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = dataBusy || operation !== null;
  const existingDates = new Set(days.map((day) => day.date));
  const additions =
    pending?.snapshot.days.filter((day) => !existingDates.has(day.date))
      .length ?? 0;
  const conflicts = (pending?.snapshot.days.length ?? 0) - additions;
  const repairCandidates = pending
    ? backupPhotoRepairCandidates(pending.snapshot, days).length
    : 0;
  const start = (next: "export" | "read" | "restore") => {
    setOperation(next);
    onBusyChange(true);
    setMessage("");
    setError("");
  };
  const finish = () => {
    setOperation(null);
    onBusyChange(false);
  };
  const create = async () => {
    start("export");
    try {
      const blob = await exportBackup();
      downloadBackup(blob, backupFilename());
      setMessage(
        "バックアップを作成しました。保存先でファイルを確認してください。",
      );
    } catch (cause) {
      setError(errorMessage(cause, "バックアップを作成できませんでした"));
    } finally {
      finish();
    }
  };
  const choose = async (file: File) => {
    setPending(null);
    start("read");
    try {
      const snapshot = await readBackup(file);
      setPending({ snapshot, name: file.name, size: file.size });
      setRestoreSettings(days.length === 0 && assets.length === 0);
    } catch (cause) {
      setError(errorMessage(cause, "このファイルは読み込めませんでした"));
    } finally {
      finish();
    }
  };
  const restore = async () => {
    if (!pending) return;
    start("restore");
    try {
      const result = await restoreBackup(pending.snapshot, restoreSettings);
      setPending(null);
      const messages = [];
      if (result.addedDays)
        messages.push(
          `${result.addedDays}日分の記録と${result.addedPhotos}枚の写真を復元しました。`,
        );
      if (result.repairedPhotos)
        messages.push(
          `読み込めなかった写真${result.repairedPhotos}枚を修復しました。`,
        );
      if (!result.addedDays && !result.repairedPhotos)
        messages.push("追加・修復が必要なデータはありませんでした。");
      if (result.skippedDays)
        messages.push(
          `同じ日付の${result.skippedDays}日分は、この端末の記録・編集内容を残しました。`,
        );
      if (restoreSettings) messages.push("設定も復元しました。");
      setMessage(messages.join(""));
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          "復元できませんでした。現在の記録は保持されています。",
        ),
      );
    } finally {
      finish();
    }
  };
  return (
    <div className="settings-detail-stack" aria-busy={busy}>
      <p className="settings-detail-intro">
        写真・色・ひとこと・編集状態を、ひとつのファイルにまとめます。
        機種変更するときも、このファイルから記録を戻せます。
      </p>
      <section className="settings-detail-card">
        <h3>
          <Download size={18} aria-hidden="true" /> バックアップを作成
        </h3>
        <p>この端末のすべての写真・記録・設定を保存します。</p>
        <button
          className="primary-button settings-wide-button"
          disabled={busy}
          onClick={create}
        >
          {operation === "export" ? "作成中…" : "バックアップを作成"}
        </button>
        <p className="settings-small-note">
          作成した .picpa
          ファイルは「ファイル」などへ保存してください。写真も含まれます。
        </p>
      </section>
      <section className="settings-detail-card">
        <h3>
          <ArchiveRestore size={18} aria-hidden="true" /> バックアップから復元
        </h3>
        <p>
          PicPaで作成した .picpa
          ファイルを選んでください。内容を確認してから復元します。
        </p>
        <input
          ref={input}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label="復元するバックアップファイル"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void choose(file);
          }}
        />
        <button
          className="secondary-button settings-wide-button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <FolderOpen size={17} aria-hidden="true" />{" "}
          {operation === "read" ? "ファイルを確認中…" : "ファイルを選ぶ"}
        </button>
        {pending && (
          <div className="backup-preview">
            <h4>
              <FileCheck2 size={18} aria-hidden="true" /> 復元する内容
            </h4>
            <p className="backup-filename">{pending.name}</p>
            <dl className="settings-definition-list">
              <div>
                <dt>記録</dt>
                <dd>{pending.snapshot.days.length}日分</dd>
              </div>
              <div>
                <dt>写真</dt>
                <dd>{pending.snapshot.assets.length}枚</dd>
              </div>
              <div>
                <dt>ファイル容量</dt>
                <dd>{formatBytes(pending.size)}</dd>
              </div>
              <div>
                <dt>追加する記録</dt>
                <dd>{additions}日分</dd>
              </div>
              {repairCandidates > 0 && (
                <div>
                  <dt>写真の修復確認</dt>
                  <dd>{repairCandidates}枚</dd>
                </div>
              )}
            </dl>
            <p className="settings-small-note">
              {conflicts
                ? `同じ日付の${conflicts}日分は、この端末の記録を残します。`
                : "この端末にある記録はそのまま残します。"}
              {repairCandidates > 0 &&
                " 同じ作品で読み込めない写真がある場合だけ、バックアップから修復します。表示できる写真は置き換えません。"}
            </p>
            <label className="settings-check-row">
              <input
                type="checkbox"
                checked={restoreSettings}
                disabled={busy}
                onChange={(event) => setRestoreSettings(event.target.checked)}
              />
              <span>
                設定も復元する
                <span className="settings-check-note">
                  写真の保存品質・ロゴなどの設定を置き換えます。今日のランダムチャレンジのロックは維持します。
                </span>
              </span>
            </label>
            <div className="backup-confirm-actions">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  setPending(null);
                  setError("");
                }}
              >
                キャンセル
              </button>
              <button
                className="primary-button"
                disabled={
                  busy || (!additions && !repairCandidates && !restoreSettings)
                }
                onClick={restore}
              >
                {operation === "restore" ? "復元中…" : "確認して復元"}
              </button>
            </div>
          </div>
        )}
      </section>
      {message && <SettingsNotice>{message}</SettingsNotice>}
      {error && <SettingsNotice error>{error}</SettingsNotice>}
      {operation && (
        <span className="sr-only" role="status">
          バックアップを処理しています
        </span>
      )}
    </div>
  );
}
