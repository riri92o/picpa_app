import {
  useCallback,
  useLayoutEffect,
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
import { syncBrowserChrome } from "./ui/browserChrome";

export default function App() {
  const { ready, error, clearError, today, drawToday } = useApp();
  const { probeRef, systemInset } = useViewportGuard(ready);
  const [tab, setTab] = useState<Tab>("home");
  const [opening, setOpening] = useState(true);
  const finishOpening = useCallback(() => setOpening(false), []);
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
  const tokens = useMemo(
    () => accentTokens(themeAccent, revealScene),
    [themeAccent, revealScene],
  );
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens))
      root.style.setProperty(key, value);
    syncBrowserChrome();
  }, [tokens]);
  return (
    <>
      {ready && (
        <div
          className="app-shell"
          inert={opening}
          data-color={ritual.visibleColorId}
          data-appearance="night"
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
