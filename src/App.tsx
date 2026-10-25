import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
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
import { useViewportGuard } from "./ui/useViewportGuard";
import { accentTokens } from "./ui/theme";
import { OpeningScreen } from "./components/OpeningScreen";
import { soapFilmImage } from "./ui/soapFilm";

export default function App() {
  const { ready, error, clearError, today, settings, drawToday } = useApp();
  const { probeRef, systemInset } = useViewportGuard(ready);
  const [tab, setTab] = useState<Tab>("home");
  const [opening, setOpening] = useState(true);
  const finishOpening = useCallback(() => setOpening(false), []);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const ritual = useColorRitual(today, drawToday);
  const color = colorById(ritual.visibleColorId);
  const revealScene = !!ritual.visibleColorId || ritual.phase === "settle";
  const themeAccent = revealScene
    ? colorById(ritual.visibleColorId ?? ritual.resultId).hex
    : "#bdc1c5";
  const filmImage = useMemo(
    () =>
      `url("${soapFilmImage(themeAccent, !revealScene, revealScene, false)}")`,
    [themeAccent, revealScene],
  );
  const dark =
    settings.theme === "dark" || (settings.theme === "system" && systemDark);
  const tokens = accentTokens(themeAccent, revealScene, dark);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateScheme = () => setSystemDark(media.matches);
    media.addEventListener("change", updateScheme);
    return () => media.removeEventListener("change", updateScheme);
  }, [settings.theme]);
  useEffect(() => {
    const root = document.documentElement;
    for (const key of ["--sky-page", "--sky-surface", "--sky-bottom"] as const)
      root.style.setProperty(key, tokens[key]);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", tokens["--sky-page"]);
  }, [tokens["--sky-page"], tokens["--sky-surface"], tokens["--sky-bottom"]]);
  return (
    <>
      {ready && (
        <div
          className="app-shell"
          inert={opening}
          data-color={ritual.visibleColorId}
          data-statusbar-inset={systemInset ? "system" : "web"}
          style={
            {
              ...tokens,
              "--tint": ritual.visibleColorId ? color.tint : "#f4f6f5",
              "--soap-film-image": filmImage,
            } as CSSProperties
          }
        >
          <span ref={probeRef} className="safe-area-probe" aria-hidden="true" />
          <LiquidBackdrop busy={ritual.busy} ambient />
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
                <Home ritual={ritual} systemInset={systemInset} />
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
          {!opening && <Tutorial />}
        </div>
      )}
      <AnimatePresence>
        {(opening || !ready) && (
          <OpeningScreen
            key="opening"
            ready={ready}
            onComplete={finishOpening}
          />
        )}
      </AnimatePresence>
    </>
  );
}
