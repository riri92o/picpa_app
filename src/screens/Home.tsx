import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Images,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { LiquidColorScene } from "../components/LiquidColorScene";
import type { ColorRitual } from "../ui/useColorRitual";
import { LIQUID_MOTION } from "../constants/liquidMotion";
import { BUBBLE_MOTION, SCORE_MOTION } from "../constants/config";
import { colorById } from "../constants/palette";
import { CollageGrid } from "../components/CollageGrid";
import { CollageStage } from "../components/CollageStage";
import { ColorMatchBadge } from "../components/ColorMatchBadge";
import { CompletionPreview } from "../components/CompletionPreview";
import { CroppedPhoto } from "../components/CroppedPhoto";
import { Modal } from "../components/Modal";
import { SamplePhotoButton } from "../dev/SamplePhotoButton";
import { isRandomChallenge } from "../domain/challenge";
import type { GridCount } from "../domain/types";
import { useApp } from "../state/AppContext";

export function Home({ ritual }: { ritual: ColorRitual }) {
  const {
    today,
    todayKey,
    settings,
    images,
    setCount,
    setSpacing,
    reduceCount,
    addPhotos,
    removePhoto,
    updatePlacement,
    reorderPhotos,
    completeToday,
  } = useApp();
  const screenRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [finished, setFinished] = useState(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const scoreRevealed = useCallback(() => {
    clearTimeout(finishTimer.current);
    finishTimer.current = setTimeout(
      () => setFinished(false),
      SCORE_MOTION.hold,
    );
  }, []);
  useEffect(() => {
    if (finished && !finishTimer.current)
      finishTimer.current = setTimeout(
        () => setFinished(false),
        SCORE_MOTION.completionTimeout,
      );
    return () => {
      clearTimeout(finishTimer.current);
      finishTimer.current = undefined;
    };
  }, [finished]);
  const [reduceTo, setReduceTo] = useState<GridCount | null>(null);
  const [keep, setKeep] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerMode, setPickerMode] = useState<"camera" | "library">("library");
  const randomChallenge = isRandomChallenge(today, settings);
  const color = colorById(today.colorId);
  const placement = today.photos.find((p) => p.id === editing);
  const dateLabel = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${todayKey}T12:00:00`));
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
    completeToday();
    setConfirm(false);
    setFinished(true);
  };
  return (
    <main
      ref={screenRef}
      className={`screen home-screen ${today.completedAt ? "completed-home" : ""}`}
      aria-busy={ritual.busy}
    >
      <LiquidColorScene
        ritual={ritual}
        screenRef={screenRef}
        bubbleRef={bubbleRef}
      />
      <header className="app-header">
        <span className="header-side date-text">{dateLabel}</span>
        <h1>PicPa</h1>
      </header>
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
        <AnimatePresence mode="wait">
          <motion.div
            className="color-copy"
            role="status"
            aria-live="polite"
            key={ritual.busy ? "mixing" : (today.colorId ?? "undrawn")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={ritual.reduced ? { duration: 0 } : BUBBLE_MOTION}
          >
            <h2>
              {ritual.busy
                ? ""
                : today.colorId
                  ? color.name
                  : "今日の色を見つけよう"}
            </h2>
          </motion.div>
        </AnimatePresence>
      </section>
      <section className="work-section" inert={ritual.busy}>
        <div className="section-line">
          <div>
            {randomChallenge && today.colorId && (
              <span className="helper-line">ランダム</span>
            )}
          </div>
          <span className="progress-pill">
            <Images size={14} />
            {today.photos.length} / {today.count}
          </span>
        </div>
        {randomChallenge ? (
          <div className="challenge-count" aria-label="チャレンジの枚数">
            {today.colorId ? `${today.count}枚` : "枚数は色を引いて決定"}
          </div>
        ) : (
          <div className="count-selector" role="group" aria-label="写真の枚数">
            <motion.span
              aria-hidden="true"
              className="liquid-selection"
              animate={{
                left: `calc(3px + ${([4, 6, 9].indexOf(today.count) * 100) / 3}% - ${[4, 6, 9].indexOf(today.count) / 3}px)`,
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
                disabled={!!today.completedAt || randomChallenge}
                aria-pressed={today.count === count}
              >
                {count}
                <span>枚</span>
              </button>
            ))}
          </div>
        )}
        <div className="home-tools">
          <div
            className="spacing-selector"
            role="group"
            aria-label="写真の間隔"
          >
            {(["joined", "separated"] as const).map((spacing) => (
              <button
                key={spacing}
                className={
                  (today.spacing ?? "separated") === spacing ? "selected" : ""
                }
                aria-pressed={(today.spacing ?? "separated") === spacing}
                onClick={() => setSpacing(spacing)}
              >
                {spacing === "joined" ? "くっつける" : "離す"}
              </button>
            ))}
          </div>
          <SamplePhotoButton />
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
            locked={!today.colorId || !!today.completedAt}
            onAdd={() => openSource()}
            onEdit={setEditing}
            onReorder={reorderPhotos}
          />
        </CollageStage>
        {today.completedAt && (
          <div className="home-score">
            <ColorMatchBadge day={today} compact />
          </div>
        )}
        {today.colorId && !today.completedAt && (
          <p className="grid-hint">長押しで並べ替え · タップで編集</p>
        )}
        <button
          className="primary-button complete-button"
          disabled={
            !today.colorId ||
            !!today.completedAt ||
            today.photos.length !== today.count
          }
          onClick={() => setConfirm(true)}
        >
          {today.completedAt ? "完成済み" : "完成"}{" "}
          {today.completedAt ? <Check size={20} /> : <ArrowRight size={20} />}
        </button>
      </section>
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
                src={images[placement.id]?.full ?? images[placement.id]?.thumb}
                placement={placement}
                alt="編集中の写真"
                onPan={(x, y) => updatePlacement(placement.id, { x, y })}
              />
            </div>
            <p className="modal-footnote centered">ドラッグして位置を調整</p>
            <div className="editor-controls">
              <label>
                拡大{" "}
                <input
                  type="range"
                  min="1"
                  max="2.4"
                  step=".01"
                  value={placement.zoom}
                  onChange={(e) =>
                    updatePlacement(placement.id, {
                      zoom: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                左右{" "}
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step=".01"
                  value={placement.x}
                  onChange={(e) =>
                    updatePlacement(placement.id, { x: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                上下{" "}
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step=".01"
                  value={placement.y}
                  onChange={(e) =>
                    updatePlacement(placement.id, { y: Number(e.target.value) })
                  }
                />
              </label>
            </div>
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
      >
        <CompletionPreview day={today} images={images} />
        <p className="modal-description">
          本当に完成でいいですか？ 完成後は写真や並び順を変更できません。
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={() => setConfirm(false)}
          >
            戻る
          </button>
          <button className="primary-button" onClick={handleFinish}>
            完成 <Check size={18} />
          </button>
        </div>
      </Modal>
      <AnimatePresence>
        {finished && (
          <motion.div
            className="finish-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="finish-bubble"
              initial={{
                y: ritual.reduced ? 0 : 280,
                scale: ritual.reduced ? 1 : 0.75,
              }}
              animate={{ y: ritual.reduced ? 0 : -20, scale: 1 }}
              exit={{ y: ritual.reduced ? 0 : -160, opacity: 0 }}
              transition={{
                duration: ritual.reduced ? 0 : 1.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Check size={50} />
            </motion.div>
            <motion.div
              className="finish-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: ritual.reduced ? 0 : 0.35,
                delay: ritual.reduced ? 0 : 0.15,
              }}
            >
              <CompletionPreview day={today} images={images} />
            </motion.div>
            <p>完成</p>
            <div className="finish-score">
              <ColorMatchBadge
                day={today}
                animateReveal
                onRevealComplete={scoreRevealed}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
