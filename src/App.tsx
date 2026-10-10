import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav, type Tab } from "./components/BottomNav";
import { Tutorial } from "./components/Tutorial";
import { colorById } from "./constants/palette";
import { Calendar } from "./screens/Calendar";
import { Home } from "./screens/Home";
import { Settings } from "./screens/Settings";
import { useApp } from "./state/AppContext";
import { LiquidBackdrop } from "./components/LiquidBackdrop";
import { useColorRitual } from "./ui/useColorRitual";
import { SKY } from "./constants/sky";
import { accentTokens } from "./ui/theme";

export default function App() {
  const { ready, error, clearError, today, settings, drawToday } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const ritual = useColorRitual(today, drawToday);
  const color = colorById(ritual.visibleColorId);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateChrome = () => {
      const dark =
        settings.theme === "dark" ||
        (settings.theme === "system" && media.matches);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? SKY.dark.page : SKY.light.page);
    };
    updateChrome();
    media.addEventListener("change", updateChrome);
    return () => media.removeEventListener("change", updateChrome);
  }, [settings.theme]);
  if (!ready)
    return (
      <div className="loading-screen">
        <div className="loading-bubble" />
        <span>PicPa</span>
      </div>
    );
  return (
    <div
      className="app-shell"
      data-color={ritual.visibleColorId}
      style={
        {
          ...accentTokens(
            ritual.visibleColorId ? color.hex : "#bdc1c5",
            !!ritual.visibleColorId,
          ),
          "--tint": ritual.visibleColorId ? color.tint : "#f4f6f5",
        } as CSSProperties
      }
    >
      <LiquidBackdrop busy={ritual.busy} ambient={tab !== "home"} />
      <div id="color-scene-root" aria-hidden="true" />
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="tab-content"
          initial={{ opacity: 0, y: ritual.reduced ? 0 : 9 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: ritual.reduced ? 0 : -7 }}
          transition={{ duration: ritual.reduced ? 0 : 0.22 }}
        >
          {tab === "home" ? (
            <Home ritual={ritual} />
          ) : tab === "calendar" ? (
            <Calendar />
          ) : (
            <Settings />
          )}
        </motion.div>
      </AnimatePresence>
      <div id="modal-root" />
      <BottomNav tab={tab} onChange={setTab} disabled={ritual.busy} />
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button onClick={clearError}>閉じる</button>
        </div>
      )}
      <Tutorial />
    </div>
  );
}
