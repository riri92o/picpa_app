import { useState } from "react";
import {
  ChevronRight,
  CircleHelp,
  Database,
  Info,
  LockKeyhole,
  Palette,
  Share2,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { isChallengeLocked, isRandomChallenge } from "../domain/challenge";
import type { ThemeChoice } from "../domain/types";
import { useApp } from "../state/AppContext";

export function Settings() {
  const { settings, today, updateSettings, days, assets, resetProgress } =
    useApp();
  const [info, setInfo] = useState<"support" | "legal" | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [challengeConfirmOpen, setChallengeConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const challengeLocked = isChallengeLocked(today, settings);
  const completed = days.filter((day) => day.completedAt).length;
  const bytes = assets.reduce(
    (sum, asset) => sum + asset.fullBytes + asset.thumbBytes,
    0,
  );
  return (
    <main className="screen settings-screen">
      <header className="app-header">
        <h1>PicPa</h1>
      </header>
      <div className="page-heading">
        <h2>設定</h2>
      </div>
      <div className="settings-list">
        <section className="settings-card">
          <div className="settings-title">
            <Palette size={19} />
            <h3>外観テーマ</h3>
          </div>
          <div className="theme-selector">
            {(
              [
                ["light", "Light"],
                ["dark", "Dark"],
                ["system", "System"],
              ] as [ThemeChoice, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                className={settings.theme === value ? "selected" : ""}
                onClick={() => updateSettings({ theme: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        <section className="settings-card">
          <div className="settings-row">
            <span className="setting-icon">
              <Shuffle size={20} />
            </span>
            <div>
              <h3>ランダムチャレンジ</h3>
              <p>
                {challengeLocked
                  ? "明日になると解除されます"
                  : "色を引くとき、枚数もランダムに決定"}
              </p>
              {challengeLocked && (
                <span
                  id="challenge-lock-description"
                  className="challenge-lock"
                >
                  <LockKeyhole size={12} /> ロック中
                </span>
              )}
            </div>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="ランダムチャレンジ"
                checked={isRandomChallenge(today, settings)}
                disabled={challengeLocked}
                aria-describedby={
                  challengeLocked ? "challenge-lock-description" : undefined
                }
                onChange={(e) => {
                  if (e.target.checked) setChallengeConfirmOpen(true);
                  else updateSettings({ randomCount: false });
                }}
              />
              <span />
            </label>
          </div>
        </section>
        <section className="settings-card">
          <div className="settings-row">
            <span className="setting-icon">
              <Share2 size={20} />
            </span>
            <div>
              <h3>PicPaロゴを入れる</h3>
              <p>書き出し画像の余白に小さく表示</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                aria-label="PicPaロゴを入れる"
                checked={settings.exportLogo}
                onChange={(e) =>
                  updateSettings({ exportLogo: e.target.checked })
                }
              />
              <span />
            </label>
          </div>
        </section>
        <section className="settings-card storage-card">
          <div className="settings-title">
            <Database size={19} />
            <h3>ストレージ・データ</h3>
          </div>
          <div className="storage-stats">
            <div>
              <strong>{days.filter((d) => d.colorId).length}</strong>
              <span>色を引いた日</span>
            </div>
            <div>
              <strong>{completed}</strong>
              <span>完成した作品</span>
            </div>
            <div>
              <strong>{(bytes / 1024 / 1024).toFixed(1)} MB</strong>
              <span>写真データ</span>
            </div>
          </div>
          <p>写真と記録はこの端末のブラウザに保存されています。</p>
          <button
            className="reset-button"
            onClick={() => setResetOpen(true)}
            disabled={days.length === 0 && assets.length === 0}
          >
            <Trash2 size={16} /> テストデータを初期化
          </button>
        </section>
        <section className="settings-card links-card">
          <button onClick={() => setInfo("support")}>
            <span className="setting-icon">
              <CircleHelp size={20} />
            </span>
            <span>サポート・コミュニティ</span>
            <ChevronRight size={19} />
          </button>
          <button onClick={() => setInfo("legal")}>
            <span className="setting-icon">
              <Info size={20} />
            </span>
            <span>法的表記・アプリ情報</span>
            <ChevronRight size={19} />
          </button>
        </section>
      </div>
      <Modal
        open={challengeConfirmOpen}
        onClose={() => setChallengeConfirmOpen(false)}
        title="ランダムチャレンジをONにしますか？"
      >
        <p className="modal-description">
          {today.colorId
            ? "今日の枚数はそのままです。ONにすると、今日の枚数は変更できません。"
            : "色を引くと、4・6・9枚のいずれかに決まります。選ばれた枚数は変更できません。"}
        </p>
        <p className="modal-description">
          {today.colorId
            ? "色を引いた後にONにした場合も、翌日0:00まではOFFにできません。"
            : "ONで色を引いた日は、設定をOFFにできません。ロックは翌日0:00に解除されます。"}
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={() => setChallengeConfirmOpen(false)}
          >
            キャンセル
          </button>
          <button
            className="primary-button"
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
        onClose={() => setResetOpen(false)}
        title="記録を初期化"
      >
        <p className="modal-description">
          保存した色・写真・完成記録をすべて削除します。元に戻せません。
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={() => setResetOpen(false)}
          >
            戻る
          </button>
          <button
            className="danger-button"
            disabled={resetting}
            onClick={async () => {
              setResetting(true);
              const success = await resetProgress();
              setResetting(false);
              if (success) setResetOpen(false);
            }}
          >
            初期化
          </button>
        </div>
      </Modal>
      <Modal
        open={info === "support"}
        onClose={() => setInfo(null)}
        title="サポート・コミュニティ"
      >
        <div className="info-content">
          <h3>PicPaについて</h3>
          <p>今日の色をきっかけに、身近な風景や思い出を集めるアプリです。</p>
          <h3>よくある質問</h3>
          <p>
            写真は端末のブラウザ内に保存され、サーバーへ送信されません。ブラウザのデータを削除すると記録も消えるため、ご注意ください。
          </p>
          <p>コミュニティ機能は今後のアップデートで検討しています。</p>
        </div>
      </Modal>
      <Modal
        open={info === "legal"}
        onClose={() => setInfo(null)}
        title="法的表記・アプリ情報"
      >
        <div className="info-content">
          <h3>PicPa v0.1.0</h3>
          <p>
            このアプリはブラウザ上で動作します。アカウント登録や通信は行いません。
          </p>
          <h3>プライバシー</h3>
          <p>
            選んだ写真と設定は、この端末のIndexedDBに保存されます。共有操作は端末の共有機能を使用します。
          </p>
          <h3>データについて</h3>
          <p>ブラウザの保存データを消去すると、写真と記録も削除されます。</p>
        </div>
      </Modal>
    </main>
  );
}
