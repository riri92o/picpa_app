import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  Database,
  Image,
  Info,
  LockKeyhole,
  Share2,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { BackupPanel } from "../components/settings/BackupPanel";
import { StoragePanel } from "../components/settings/StoragePanel";
import {
  AboutPanel,
  HelpPanel,
  QualityPanel,
  UpdatesPanel,
} from "../components/settings/SettingsInfo";
import {
  formatBytes,
  SettingsGroup,
  SettingsNotice,
  SettingsRow,
} from "../components/settings/SettingsShared";
import {
  PHOTO_QUALITY_OPTIONS,
  resolvePhotoQuality,
} from "../constants/photoQuality";
import { APP_VERSION } from "../constants/release";
import { isChallengeLocked, isRandomChallenge } from "../domain/challenge";
import { useApp } from "../state/AppContext";

type SettingsPage =
  "main" | "quality" | "backup" | "storage" | "help" | "about" | "updates";
const TITLES: Record<SettingsPage, string> = {
  main: "設定",
  quality: "写真の保存品質",
  backup: "バックアップ・復元",
  storage: "作品と容量の管理",
  help: "ヘルプ",
  about: "PicPaについて",
  updates: "更新内容",
};

export function Settings() {
  const {
    settings,
    today,
    updateSettings,
    days,
    assets,
    resetProgress,
    dataBusy,
  } = useApp();
  const [page, setPage] = useState<SettingsPage>("main");
  const [panelBusy, setPanelBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [challengeConfirmOpen, setChallengeConfirmOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const busy = dataBusy || panelBusy || resetting;
  const challengeLocked = isChallengeLocked(today, settings);
  const quality = PHOTO_QUALITY_OPTIONS.find(
    (option) => option.id === resolvePhotoQuality(settings.photoQuality),
  )!;
  const bytes = assets.reduce(
    (sum, asset) => sum + asset.fullBytes + asset.thumbBytes,
    0,
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    titleRef.current?.focus({ preventScroll: true });
  }, [page]);
  const go = (next: SettingsPage) => {
    if (!busy) setPage(next);
  };
  return (
    <main
      className={`screen settings-screen ${page !== "main" ? "settings-detail-screen" : ""}`}
    >
      <div
        className={`page-heading settings-heading ${page !== "main" ? "has-back" : ""}`}
      >
        {page !== "main" && (
          <button
            type="button"
            className="settings-back"
            aria-label={page === "updates" ? "アプリ情報に戻る" : "設定に戻る"}
            disabled={busy}
            onClick={() => go(page === "updates" ? "about" : "main")}
          >
            <ArrowLeft size={21} aria-hidden="true" />
          </button>
        )}
        <h2 ref={titleRef} tabIndex={-1}>
          {TITLES[page]}
        </h2>
      </div>
      {page === "main" ? (
        <>
          <div className="settings-list">
            <SettingsGroup title="制作">
              <div className="settings-toggle-row">
                <span className="setting-icon" aria-hidden="true">
                  <Shuffle size={19} />
                </span>
                <div className="settings-row-copy">
                  <h4 className="settings-row-title">ランダムチャレンジ</h4>
                  <p className="settings-row-detail">
                    {challengeLocked ? (
                      <>
                        <LockKeyhole size={11} aria-hidden="true" />{" "}
                        翌日0:00まで固定
                      </>
                    ) : (
                      "色と一緒に枚数も抽選"
                    )}
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    aria-label="ランダムチャレンジ"
                    checked={isRandomChallenge(today, settings)}
                    disabled={busy || challengeLocked}
                    onChange={(event) => {
                      if (event.target.checked) setChallengeConfirmOpen(true);
                      else updateSettings({ randomCount: false });
                    }}
                  />
                  <span />
                </label>
              </div>
              <div className="settings-toggle-row">
                <span className="setting-icon" aria-hidden="true">
                  <Share2 size={19} />
                </span>
                <div className="settings-row-copy">
                  <h4 className="settings-row-title">PicPaロゴを入れる</h4>
                  <p className="settings-row-detail">完成画像に表示</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    aria-label="PicPaロゴを入れる"
                    checked={settings.exportLogo}
                    disabled={busy}
                    onChange={(event) =>
                      updateSettings({ exportLogo: event.target.checked })
                    }
                  />
                  <span />
                </label>
              </div>
              <SettingsRow
                Icon={Image}
                title="写真の保存品質"
                value={quality.label}
                disabled={busy}
                onClick={() => go("quality")}
              />
            </SettingsGroup>
            <SettingsGroup title="データ管理">
              <SettingsRow
                Icon={Archive}
                title="バックアップ・復元"
                disabled={busy}
                onClick={() => go("backup")}
              />
              <SettingsRow
                Icon={Database}
                title="作品と容量の管理"
                description={`${days.length}日分の記録`}
                value={formatBytes(bytes)}
                disabled={busy}
                onClick={() => go("storage")}
              />
            </SettingsGroup>
            <SettingsGroup title="ヘルプ">
              <SettingsRow
                Icon={BookOpen}
                title="使い方・よくある質問"
                disabled={busy}
                onClick={() => go("help")}
              />
            </SettingsGroup>
            <SettingsGroup title="アプリ情報">
              <SettingsRow
                Icon={Info}
                title="PicPaについて"
                value={`v${APP_VERSION}`}
                disabled={busy}
                onClick={() => go("about")}
              />
            </SettingsGroup>
          </div>
          <button
            type="button"
            className="settings-reset-all"
            disabled={busy || (!days.length && !assets.length)}
            onClick={() => {
              setResetError("");
              setResetOpen(true);
            }}
          >
            <Trash2 size={15} aria-hidden="true" /> すべてのデータを削除
          </button>
          <p className="settings-footer">
            PicPa <span>v{APP_VERSION}</span>
          </p>
        </>
      ) : page === "backup" ? (
        <BackupPanel onBusyChange={setPanelBusy} />
      ) : page === "storage" ? (
        <StoragePanel onBusyChange={setPanelBusy} />
      ) : page === "quality" ? (
        <QualityPanel />
      ) : page === "help" ? (
        <HelpPanel
          onReplay={() => {
            go("main");
            updateSettings({ tutorialSeen: false });
          }}
        />
      ) : page === "about" ? (
        <AboutPanel onUpdates={() => go("updates")} />
      ) : (
        <UpdatesPanel />
      )}
      <Modal
        open={challengeConfirmOpen}
        onClose={() => {
          if (!busy) setChallengeConfirmOpen(false);
        }}
        title="ランダムチャレンジをONにしますか？"
      >
        <p className="modal-description">
          {today.colorId
            ? "今日の枚数はそのままです。ONにすると、今日の枚数は変更できません。"
            : "色を引くと、4・6・9枚のいずれかに決まります。選ばれた枚数は変更できません。"}
        </p>
        <p className="modal-description">翌日0:00まではOFFにできません。</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={() => setChallengeConfirmOpen(false)}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={busy}
            onClick={() => {
              updateSettings({ randomCount: true });
              setChallengeConfirmOpen(false);
            }}
          >
            確認してONにする
          </button>
        </div>
      </Modal>
      <Modal
        open={resetOpen}
        onClose={() => {
          if (!busy) setResetOpen(false);
        }}
        title="すべてのデータを削除"
      >
        <p className="modal-description">
          保存した色・写真・完成記録・ひとことをすべて削除します。制作の設定は残ります。
        </p>
        <p className="modal-description">
          元に戻すにはバックアップが必要です。必要な記録は先にバックアップを作成してください。
        </p>
        {resetError && <SettingsNotice error>{resetError}</SettingsNotice>}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={() => setResetOpen(false)}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={busy}
            onClick={async () => {
              setResetting(true);
              setResetError("");
              try {
                const success = await resetProgress();
                if (success) setResetOpen(false);
                else
                  setResetError(
                    "削除できませんでした。もう一度お試しください。",
                  );
              } catch {
                setResetError("削除できませんでした。もう一度お試しください。");
              } finally {
                setResetting(false);
              }
            }}
          >
            {resetting ? "削除中…" : "すべて削除"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
