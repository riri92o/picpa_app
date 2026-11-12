/** Read on explicit copy only; no persistence, network, photos or record data. */
export function viewportReport() {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const viewport = window.visualViewport;
  const rect = (element: Element | null) => {
    if (!element) return "-";
    const { top, bottom, height } = element.getBoundingClientRect();
    return [top, bottom, height]
      .map((value) => Math.round(value * 100) / 100)
      .join(", ");
  };
  return [
    `起動形式：${root.dataset.iosStandalone === "true" ? "iOSホーム画面" : window.matchMedia("(display-mode: standalone)").matches ? "ホーム画面" : "ブラウザ"}`,
    `画面：${screen.width}×${screen.height}`,
    `ウィンドウ：${innerWidth}×${innerHeight}`,
    `表示領域：${viewport ? `${viewport.width}×${viewport.height}, top=${viewport.offsetTop}, scale=${viewport.scale}` : "-"}`,
    `CSS表示高：${document.querySelector(".viewport-height-probe")?.getBoundingClientRect().height ?? "-"}`,
    `アプリ高：${css.getPropertyValue("--app-height").trim()}`,
    `安全余白：${css.getPropertyValue("--safe-top").trim()} / ${css.getPropertyValue("--safe-bottom").trim()}`,
    `body 上端・下端・高さ：${rect(document.body)}`,
    `アプリ 上端・下端・高さ：${rect(document.querySelector(".app-shell"))}`,
    `ページ位置：${scrollX}, ${scrollY}`,
  ].join("\n");
}
