import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Images,
  Palette,
  Share2,
  Grid2x2,
} from "lucide-react";
import { useApp } from "../state/AppContext";
const slides = [
  {
    title: "今日の色を、ひとつ。",
    body: "グレーのバブルを押して、今日の色を見つけよう。",
    Icon: Palette,
  },
  {
    title: "枚数を選ぼう。",
    body: "4・6・9枚から、今日の形を選べます。",
    Icon: Grid2x2,
  },
  {
    title: "色を集めよう。",
    body: "写真を並べて、あなたらしい一枚に。",
    Icon: Images,
  },
  {
    title: "完成したら、残そう。",
    body: "完成後は保存して、いつでも共有できます。",
    Icon: Share2,
  },
];
export function Tutorial() {
  const { settings, updateSettings } = useApp();
  const [page, setPage] = useState(0);
  if (settings.tutorialSeen) return null;
  const slide = slides[page];
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-top">
          <span>PicPa</span>
          <button onClick={() => updateSettings({ tutorialSeen: true })}>
            スキップ
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="tutorial-content"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.26 }}
          >
            <div className="tutorial-art">
              <span className="tutorial-orbit one" />
              <span className="tutorial-orbit two" />
              <div className="tutorial-symbol">
                <slide.Icon size={54} strokeWidth={1.35} />
              </div>
            </div>
            <span className="eyebrow">STEP 0{page + 1}</span>
            <h1>{slide.title}</h1>
            <p>{slide.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="tutorial-bottom">
          <div className="dots">
            {slides.map((_, i) => (
              <span key={i} className={i === page ? "current" : ""} />
            ))}
          </div>
          <button
            className="primary-button tutorial-next"
            onClick={() =>
              page === 3
                ? updateSettings({ tutorialSeen: true })
                : setPage(page + 1)
            }
          >
            {page === 3 ? "はじめる" : "次へ"}{" "}
            {page === 3 ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
