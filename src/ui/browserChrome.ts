import { NIGHT_SKY_COLOR } from "./theme";

declare global {
  interface Window {
    PicPaChrome?: { sync: () => void };
  }
}

/** The first-paint script also resynchronizes native chrome on page resume. */
export function syncBrowserChrome() {
  if (window.PicPaChrome) {
    window.PicPaChrome.sync();
    return;
  }
  const root = document.documentElement;
  root.dataset.appearance = "night";
  root.style.setProperty("--browser-chrome-color", NIGHT_SKY_COLOR);
  root.style.backgroundColor = NIGHT_SKY_COLOR;
  root.style.colorScheme = "dark";
  document.body.style.backgroundColor = NIGHT_SKY_COLOR;
  const meta =
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
    document.createElement("meta");
  meta.name = "theme-color";
  meta.content = NIGHT_SKY_COLOR;
  if (!meta.isConnected) document.head.appendChild(meta);
}
