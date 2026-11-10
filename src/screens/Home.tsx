import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Ellipsis,
  ImagePlus,
  Images,
  Minus,
  Palette,
  Plus,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { LiquidColorScene } from "../components/LiquidColorScene";
import type { ColorRitual } from "../ui/useColorRitual";
import { HOME_MOTION, LIQUID_MOTION } from "../constants/liquidMotion";
import { colorById } from "../constants/palette";
import { CollageGrid } from "../components/CollageGrid";
import { CollageStage } from "../components/CollageStage";
import { HomeArtwork } from "../components/HomeArtwork";
import { ColorCollectionCard } from "../components/ColorCollectionCard";
import { ColorMatchBadge } from "../components/ColorMatchBadge";
import { ArtworkMemo } from "../components/ArtworkMemo";
import { ArtworkMemoField } from "../components/ArtworkMemoField";
import { MEMO_MAX_LENGTH, memoLength } from "../domain/memo";
import { SpacingSelector } from "../components/SpacingSelector";
import { CompletionPreview } from "../components/CompletionPreview";
import { ExportedCollage } from "../components/ExportedCollage";
import { CroppedPhoto } from "../components/CroppedPhoto";
import { PhotoFilterSelector } from "../components/PhotoFilterSelector";
import { Modal } from "../components/Modal";
import { SamplePhotoButton } from "../dev/SamplePhotoButton";
import { isRandomChallenge } from "../domain/challenge";
import { dateFromKey } from "../domain/date";
import type { GridCount } from "../domain/types";
import { MIN_CROP_ZOOM, MAX_CROP_ZOOM } from "../domain/cropGesture";
import { useApp } from "../state/AppContext";

export function Home({
  ritual,
  systemInset,
  onOpenCollection,
}: {
  ritual: ColorRitual;
  systemInset: boolean;
  onOpenCollection: () => void;
}) {
  const {
    today,
    settings,
    images,
    setCount,
    setSpacing,
    setArtworkStyle,
    setMemo,
    reduceCount,
    addPhotos,
    removePhoto,
    updatePlacement,
    reorderPhotos,
    completeToday,
    getImageBlob,
    dataBusy,
  } = useApp();
  const screenRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [memoDraft, setMemoDraft] = useState("");
  const memoTooLong = memoLength(memoDraft) > MEMO_MAX_LENGTH;
  const [previewReady, setPreviewReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [artworkOptionsOpen, setArtworkOptionsOpen] = useState(false);
  const remaining = Math.max(0, today.count - today.photos.length);
  const canComplete =
    !!today.colorId && !today.completedAt && remaining === 0 && !dataBusy;
  const previousReady = useRef({ date: today.date, ready: canComplete });
  const [completionPulse, setCompletionPulse] = useState(false);
  useEffect(() => {
    const previous = previousReady.current;
    previousReady.current = { date: today.date, ready: canComplete };
    setCompletionPulse(false);
    if (
      previous.date !== today.date ||
      previous.ready ||
      !canComplete ||
      ritual.reduced
    )
      return;
    setCompletionPulse(true);
    const timer = window.setTimeout(() => setCompletionPulse(false), 650);
    return () => window.clearTimeout(timer);
  }, [canComplete, today.date, ritual.reduced]);
  useEffect(() => setArtworkOptionsOpen(false), [today.date]);
  const [reduceTo, setReduceTo] = useState<GridCount | null>(null);
  const [keep, setKeep] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerMode, setPickerMode] = useState<"camera" | "library">("library");
  const randomChallenge = isRandomChallenge(today, settings);
  const expanded = !today.colorId || ritual.busy;
  const [workVisible, setWorkVisible] = useState(!!today.colorId);
  useEffect(() => {
    if (expanded) {
      setWorkVisible(false);
      return;
    }
    const timer = window.setTimeout(
      () => setWorkVisible(true),
      ritual.reduced ? 0 : HOME_MOTION.dock,
    );
    return () => window.clearTimeout(timer);
  }, [expanded, ritual.reduced]);
  const color = colorById(today.colorId);
  const placement = today.photos.find((p) => p.id === editing);
  const openSource = (id?: string) => {
    setReplaceId(id);
    setEditing(null);
    setSourceOpen(true);
  };
  const chooseSource = (mode: "camera" | "library") => {
    setPickerMode(mode);
    window.setTimeout(() => fileRef.current?.click(), 0);
  };
  const handleFiles = async (files: FileList | null) => {
    if (files?.length) await addPhotos(files, replaceId);
    setSourceOpen(false);
    setEditing(null);
    setReplaceId(undefined);
  };
  const chooseCount = (count: GridCount) => {
    if (count < today.photos.length) {
      setReduceTo(count);
      setKeep(today.photos.slice(0, count).map((p) => p.id));
    } else setCount(count);
  };
  const toggleKeep = (id: string) =>
    setKeep((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : previous.length < (reduceTo ?? 0)
          ? [...previous, id]
          : previous,
    );
  const handleFinish = () => {
    if (!previewReady || memoTooLong) return;
    completeToday(memoDraft);
    setConfirm(false);
    setFinished(true);
  };
  const overlayRoot = document.getElementById("modal-root");
  return (
    <main
      ref={screenRef}
      className={`screen home-screen ${today.completedAt ? "completed-home" : ""}`}
      data-stage={expanded ? "draw" : "collect"}
      aria-busy={ritual.busy}
    >
      <LiquidColorScene
        ritual={ritual}
        systemInset={systemInset}
        screenRef={screenRef}
        bubbleRef={bubbleRef}
        expanded={expanded}
      />
      {!today.completedAt && (
        <button
          className="icon-button home-collection-shortcut"
          onClick={onOpenCollection}
          disabled={dataBusy || ritual.busy}
          aria-label="色のコレクションを開く"
          title="色のコレクション"
        >
          <Palette size={21} aria-hidden="true" />
        </button>
      )}
      <section className="color-section">
        <button
          ref={bubbleRef}
          className="color-bubble"
          onClick={ritual.start}
          disabled={!!today.colorId || ritual.busy}
          aria-label={
            ritual.busy
              ? "今日の色を混ぜています"
              : today.colorId
                ? `今日の色は${color.name}`
                : "今日の色を引く"
          }
        >
          {!today.colorId && !ritual.busy && (
            <span className="bubble-question">?</span>
          )}
        </button>
        <div
          className={expanded ? "draw-copy" : "color-copy"}
          role="status"
          aria-live="polite"
        >
          {ritual.visibleColorId ? (
            <>
              <span className="daily-color-label">今日の色</span>
              <h2>{color.name}</h2>
              {today.completedAt && (
                <time className="home-artwork-date" dateTime={today.date}>
                  {new Intl.DateTimeFormat("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  }).format(dateFromKey(today.date))}
                </time>
              )}
            </>
          ) : ritual.busy ? (
            <span className="sr-only">今日の色を混ぜています</span>
          ) : (
            <p>タップして今日の色を引く</p>
          )}
        </div>
        {today.completedAt && !expanded && (
          <button
            className="home-artwork-menu icon-button"
            aria-label="作品のデザインと詳細"
            title="作品のデザインと詳細"
            disabled={dataBusy}
            onClick={() => setArtworkOptionsOpen(true)}
          >
            <Ellipsis size={23} />
          </button>
        )}
      </section>
      {!expanded && (
        <motion.section
          className="work-section"
          inert={!workVisible}
          aria-hidden={!workVisible}
          initial={false}
          animate={{ opacity: workVisible ? 1 : 0, y: workVisible ? 0 : 10 }}
          transition={{ duration: ritual.reduced ? 0 : 0.3 }}
        >
          {today.completedAt ? (
            <>
              <HomeArtwork
                day={today}
                logo={settings.exportLogo}
                getImageBlob={getImageBlob}
                optionsOpen={artworkOptionsOpen}
                onOptionsClose={() => setArtworkOptionsOpen(false)}
                onStyleChange={(style) => setArtworkStyle(style, today.date)}
                onSpacingChange={(spacing) => setSpacing(spacing, today.date)}
                onMemoSave={(memo) => setMemo(today.date, memo)}
                disabled={dataBusy}
              />
              <ColorCollectionCard onOpen={onOpenCollection} />
            </>
          ) : (
            <>
              <div className="home-toolbar" inert={dataBusy}>
                {randomChallenge ? (
                  <div
                    className="challenge-count"
                    aria-label="チャレンジの枚数"
                  >
                    <span>ランダム</span> {today.count}枚
                  </div>
                ) : (
                  <div
                    className="count-selector"
                    role="group"
                    aria-label="写真の枚数"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="liquid-selection"
                      animate={{
                        left: `calc(${([4, 6, 9].indexOf(today.count) * 100) / 3}% + ${3 - [4, 6, 9].indexOf(today.count) * 2}px)`,
                      }}
                      transition={{
                        duration: ritual.reduced ? 0 : LIQUID_MOTION.selector,
                        ease: LIQUID_MOTION.ease,
                      }}
                    />
                    {([4, 6, 9] as GridCount[]).map((count) => (
                      <button
                        key={count}
                        className={today.count === count ? "selected" : ""}
                        onClick={() => chooseCount(count)}
                        disabled={dataBusy || randomChallenge}
                        aria-pressed={today.count === count}
                      >
                        {count}
                        <span>枚</span>
                      </button>
                    ))}
                  </div>
                )}
                <SpacingSelector value={today.spacing} onChange={setSpacing} />
                <span
                  className="progress-pill"
                  aria-label={`写真${today.count}枚中${today.photos.length}枚`}
                >
                  <Images size={14} />
                  {today.photos.length} / {today.count}
                </span>
              </div>
              <CollageStage
                count={today.count}
                spacing={today.spacing}
                inactive={!today.colorId}
              >
                <CollageGrid
                  count={today.count}
                  spacing={today.spacing}
                  photos={today.photos}
                  images={images}
                  locked={!today.colorId}
                  onAdd={() => openSource()}
                  onEdit={setEditing}
                  onReorder={reorderPhotos}
                />
              </CollageStage>
              {today.colorId && !today.completedAt && (
                <div className="home-grid-tools">
                  <p className="grid-hint">長押しで並べ替え · タップで編集</p>
                  <SamplePhotoButton />
                </div>
              )}
              <button
                className={`primary-button complete-button ${completionPulse ? "completion-pulse" : ""}`}
                disabled={!canComplete}
                onClick={() => {
                  setPreviewReady(false);
                  setMemoDraft(today.memo ?? "");
                  setConfirm(true);
                }}
              >
                <span aria-live="polite">
                  {dataBusy ? "写真を追加中…" : "完成する"}
                </span>
                {canComplete && <ArrowRight size={20} aria-hidden="true" />}
              </button>
            </>
          )}
        </motion.section>
      )}
      <input
        ref={fileRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        capture={pickerMode === "camera" ? "environment" : undefined}
        multiple={pickerMode === "library" && !replaceId}
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Modal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        title={replaceId ? "写真を差し替え" : "写真を追加"}
      >
        <div className="source-actions">
          <button onClick={() => chooseSource("camera")}>
            <span>
              <Camera size={26} />
            </span>
            カメラで撮る
            <ArrowRight size={18} />
          </button>
          <button onClick={() => chooseSource("library")}>
            <span>
              <ImagePlus size={26} />
            </span>
            ライブラリから選ぶ
            <ArrowRight size={18} />
          </button>
        </div>
        <p className="modal-footnote">
          ライブラリでは複数枚をまとめて選べます。
        </p>
      </Modal>
      <Modal
        open={!!placement}
        onClose={() => setEditing(null)}
        title="写真を編集"
      >
        {placement && (
          <>
            <div className="editor-preview">
              <CroppedPhoto
                key={placement.id}
                src={images[placement.id]?.full ?? images[placement.id]?.thumb}
                placement={placement}
                alt="編集中の写真"
                onTransform={
                  dataBusy
                    ? undefined
                    : (patch) => updatePlacement(placement.id, patch)
                }
              />
            </div>
            <p className="modal-footnote centered">
              1本指で移動・2本指で拡大縮小
            </p>
            <div className="editor-gesture-tools">
              <div
                className="editor-zoom-buttons"
                role="group"
                aria-label="写真の拡大率"
              >
                <button
                  type="button"
                  aria-label="写真を縮小"
                  disabled={dataBusy || placement.zoom <= MIN_CROP_ZOOM}
                  onClick={() =>
                    updatePlacement(placement.id, {
                      zoom: Math.max(MIN_CROP_ZOOM, placement.zoom - 0.1),
                    })
                  }
                >
                  <Minus size={17} aria-hidden="true" />
                </button>
                <output aria-label="拡大率">
                  {Math.round(placement.zoom * 100)}%
                </output>
                <button
                  type="button"
                  aria-label="写真を拡大"
                  disabled={dataBusy || placement.zoom >= MAX_CROP_ZOOM}
                  onClick={() =>
                    updatePlacement(placement.id, {
                      zoom: Math.min(MAX_CROP_ZOOM, placement.zoom + 0.1),
                    })
                  }
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="editor-reset"
                title="位置・大きさ・回転をリセット"
                aria-label="写真の調整をリセット"
                disabled={dataBusy}
                onClick={() =>
                  updatePlacement(placement.id, {
                    zoom: 1,
                    x: 0,
                    y: 0,
                    rotation: 0,
                  })
                }
              >
                リセット
              </button>
            </div>
            <PhotoFilterSelector
              src={images[placement.id]?.thumb}
              placement={placement}
              disabled={dataBusy}
              onChange={(filter) => updatePlacement(placement.id, { filter })}
            />
            <div className="editor-actions">
              <button
                onClick={() =>
                  updatePlacement(placement.id, {
                    rotation: (placement.rotation + 90) % 360,
                  })
                }
              >
                <RotateCw size={19} />
                回転
              </button>
              <button onClick={() => openSource(placement.id)}>
                <Upload size={19} />
                差し替え
              </button>
              <button
                className="danger"
                onClick={() => {
                  removePhoto(placement.id);
                  setEditing(null);
                }}
              >
                <Trash2 size={19} />
                削除
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={!!reduceTo}
        onClose={() => setReduceTo(null)}
        title="残す写真を選ぶ"
      >
        <p className="modal-description">
          {reduceTo}
          枚の写真を選んでください。選ばなかった写真はコラージュから外れます。
        </p>
        <div className="keep-grid">
          {today.photos.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleKeep(p.id)}
              className={keep.includes(p.id) ? "kept" : ""}
            >
              <img src={images[p.id]?.thumb} alt="残す写真" />
              <span>
                {keep.includes(p.id) ? <Check size={18} /> : <X size={18} />}
              </span>
            </button>
          ))}
        </div>
        <button
          className="primary-button modal-submit"
          disabled={keep.length !== reduceTo}
          onClick={() => {
            if (reduceTo) reduceCount(reduceTo, keep);
            setReduceTo(null);
          }}
        >
          この{reduceTo}枚にする
        </button>
      </Modal>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="完成しますか？"
        className="completion-with-memo"
      >
        <CompletionPreview
          day={today}
          logo={settings.exportLogo}
          getImageBlob={getImageBlob}
          onReadyChange={setPreviewReady}
          onStyleChange={(style) => setArtworkStyle(style, today.date)}
        />
        <p className="artwork-change-note">
          デザインは、完成後もHomeやカレンダーのメニューから変更できます。
        </p>
        <div className="completion-memo">
          <ArtworkMemoField value={memoDraft} onChange={setMemoDraft} />
        </div>
        <p className="modal-description">
          本当に完成でいいですか？
          完成後は写真・並び順・フィルターを変更できません。
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={() => setConfirm(false)}
          >
            戻る
          </button>
          <button
            className="primary-button"
            onClick={handleFinish}
            disabled={!previewReady || memoTooLong}
          >
            完成 <Check size={18} />
          </button>
        </div>
      </Modal>
      {overlayRoot &&
        createPortal(
          <AnimatePresence>
            {finished && (
              <motion.div
                className="finish-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="完成したコラージュ"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="finish-card">
                  <button
                    className="icon-button small finish-close"
                    onClick={() => setFinished(false)}
                    aria-label="完成画面を閉じる"
                  >
                    <X size={20} />
                  </button>
                  <motion.div
                    className="finish-bubble"
                    initial={{
                      y: ritual.reduced ? 0 : 220,
                      scale: ritual.reduced ? 1 : 0.75,
                    }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{
                      duration: ritual.reduced ? 0 : 1.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Check size={34} />
                  </motion.div>
                  <h2>完成</h2>
                  <ExportedCollage
                    day={today}
                    logo={settings.exportLogo}
                    getImageBlob={getImageBlob}
                    onStyleChange={(style) =>
                      setArtworkStyle(style, today.date)
                    }
                  >
                    <ColorMatchBadge day={today} animateReveal />
                    <ArtworkMemo
                      key={today.date}
                      value={today.memo}
                      onSave={(memo) => setMemo(today.date, memo)}
                    />
                  </ExportedCollage>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          overlayRoot,
        )}
    </main>
  );
}
