import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  History,
  Info,
  ShieldCheck,
} from "lucide-react";
import { APP_VERSION, RELEASE_NOTES } from "../../constants/release";
import {
  PHOTO_QUALITY_OPTIONS,
  resolvePhotoQuality,
} from "../../constants/photoQuality";
import { dateFromKey } from "../../domain/date";
import { useApp } from "../../state/AppContext";
import { SettingsNotice, SettingsRow } from "./SettingsShared";

const FAQ = [
  [
    "今日の色は何回引けますか？",
    "1日に1色です。抽選後にアプリを開き直しても、同じ色で続きを作れます。日付が変わると、新しい色を引けます。",
  ],
  [
    "写真の枚数は変えられますか？",
    "通常モードでは、色を引いた後に4・6・9枚から選べます。ランダムチャレンジでは枚数も抽選され、その日は固定されます。ONで色を引いた日は、翌日の0:00まで解除できません。",
  ],
  [
    "写真はどうやって編集しますか？",
    "写真をタップすると、ドラッグやスライダーでトリミング・拡大・90度回転・差し替え・削除ができます。写真を長押しすると並べ替えられます。",
  ],
  [
    "完成後も変更できますか？",
    "完成後は写真・並び・トリミング・枚数が固定されます。デザイン・写真の間隔・100文字までのひとことは、後から変更できます。",
  ],
  [
    "画像はどこから保存・共有できますか？",
    "完成画面か、カレンダーで作品を開いた右上の「…」から操作できます。端末の共有機能が使えない場合は、画像ファイルをダウンロードします。",
  ],
  [
    "写真や記録はどこに保存されますか？",
    "この端末のブラウザ内に保存されます。別の端末とは自動で同期しません。機種変更やブラウザのデータ削除の前に、バックアップを作成してください。",
  ],
  [
    "保存品質を変えると過去の写真も変わりますか？",
    "新しく追加する写真だけに適用されます。保存済みの写真や完成記録は、そのまま残ります。",
  ],
  [
    "バックアップの書き出しと画像保存の違いは？",
    "画像保存は完成したコラージュを鑑賞・共有するための機能です。バックアップは元の写真・色・編集状態・ひとことなどをPicPaで復元するための .picpa ファイルです。",
  ],
] as const;

export function QualityPanel() {
  const { settings, dataBusy, updateSettings } = useApp();
  const current = resolvePhotoQuality(settings.photoQuality);
  return (
    <div className="settings-detail-stack">
      <p className="settings-detail-intro">
        新しく追加する写真の保存品質を選べます。どの設定でも、トリミング用の解像度と完成画像のサイズは同じです。
      </p>
      <div
        className="settings-quality-options"
        role="radiogroup"
        aria-label="写真の保存品質"
      >
        {PHOTO_QUALITY_OPTIONS.map((option) => (
          <label
            className={`settings-quality-option ${current === option.id ? "is-selected" : ""}`}
            key={option.id}
          >
            <input
              type="radio"
              name="photo-quality"
              value={option.id}
              checked={current === option.id}
              disabled={dataBusy}
              onChange={() => updateSettings({ photoQuality: option.id })}
            />
            <span>
              <strong>
                {option.label}
                {option.id === "standard" && <small>おすすめ</small>}
              </strong>
              <span>{option.description}</span>
            </span>
            {current === option.id && <Check size={19} aria-hidden="true" />}
          </label>
        ))}
      </div>
      <p className="settings-small-note">
        保存済みの写真は再圧縮しません。写真の内容や端末によって、保存容量や見た目の差は変わります。
      </p>
    </div>
  );
}

export function HelpPanel({ onReplay }: { onReplay: () => void }) {
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");
  const copyReport = async () => {
    const text = `PicPa ${APP_VERSION}\n端末・ブラウザ：${navigator.userAgent}\n起きたこと：\n操作した手順：`;
    setReport(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="settings-detail-stack">
      <section className="settings-detail-card">
        <h3>
          <BookOpen size={18} aria-hidden="true" /> 操作ガイド
        </h3>
        <p>色を引くところから、写真を並べて完成させるまでを確認できます。</p>
        <button
          type="button"
          className="secondary-button settings-wide-button"
          onClick={onReplay}
        >
          はじめのガイドを見る
        </button>
      </section>
      <section className="settings-faq" aria-label="よくある質問">
        <h3 className="settings-detail-section-title">よくある質問</h3>
        {FAQ.map(([question, answer]) => (
          <details key={question}>
            <summary>
              <span>{question}</span>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <section className="settings-detail-card">
        <h3>
          <Info size={18} aria-hidden="true" /> 困ったときのメモ
        </h3>
        <p>
          バージョンや端末情報をコピーできます。不具合について相談するときに、起きたことや操作手順を添えて使えます。
        </p>
        <button
          type="button"
          className="secondary-button settings-wide-button"
          onClick={copyReport}
        >
          <Copy size={16} aria-hidden="true" /> 端末情報をコピー
        </button>
        {report &&
          (copied ? (
            <SettingsNotice>
              コピーしました。写真や記録は含まれません。
            </SettingsNotice>
          ) : (
            <label className="settings-report-text">
              コピーできない場合は、こちらを選択してください
              <textarea
                readOnly
                value={report}
                rows={5}
                onFocus={(event) => event.target.select()}
              />
            </label>
          ))}
      </section>
    </div>
  );
}

export function AboutPanel({ onUpdates }: { onUpdates: () => void }) {
  return (
    <div className="settings-detail-stack">
      <div className="settings-about-brand">
        <strong>PicPa</strong>
        <span>バージョン {APP_VERSION}</span>
        <p>今日の色を、写真に残す。</p>
      </div>
      <div className="settings-group-card">
        <SettingsRow
          Icon={History}
          title="更新内容"
          description="追加した機能と改善点"
          onClick={onUpdates}
        />
      </div>
      <section className="settings-detail-card info-content">
        <h3>
          <ShieldCheck size={18} aria-hidden="true" /> 写真とプライバシー
        </h3>
        <p>
          写真・記録・設定は、この端末のブラウザ内に保存します。アカウントは不要で、写真をサーバーへ自動送信しません。
        </p>
        <p>
          アプリの読み込みや更新には通信を使います。画像やバックアップを共有するときは、端末の保存・共有機能を使います。
        </p>
        <h3>記録の引き継ぎ</h3>
        <p>
          別の端末へは自動で同期しません。バックアップを作成し、引き継ぎ先のPicPaで復元してください。
        </p>
        <h3>データの削除</h3>
        <p>
          設定から記録を選んで削除できます。ブラウザのサイトデータを削除した場合も、写真や記録が消えます。
        </p>
      </section>
    </div>
  );
}

export function UpdatesPanel() {
  return (
    <div className="settings-detail-stack">
      {RELEASE_NOTES.map((release) => (
        <article
          className="settings-detail-card settings-release"
          key={release.date}
        >
          <div className="settings-release-meta">
            <time dateTime={release.date}>
              {new Intl.DateTimeFormat("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(dateFromKey(release.date))}
            </time>
            {"version" in release && <span>v{release.version}</span>}
          </div>
          <h3>{release.title}</h3>
          <ul>
            {release.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
