import { motion, useReducedMotion } from "framer-motion";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, House, Settings2 } from "lucide-react";
import { NAV_MOTION } from "../constants/config";
import { floatingNavGeometry } from "../ui/navGeometry";
import { useNavSlide } from "../ui/useNavSlide";
export type Tab = "home" | "calendar" | "settings";
const tabs = [
  { id: "home" as Tab, label: "Home", Icon: House },
  { id: "calendar" as Tab, label: "Calendar", Icon: CalendarDays },
  { id: "settings" as Tab, label: "Settings", Icon: Settings2 },
];
export function BottomNav({
  tab,
  onChange,
  disabled = false,
}: {
  tab: Tab;
  disabled?: boolean;
  onChange: (tab: Tab) => void;
}) {
  const reduced = useReducedMotion();
  const index = tabs.findIndex((item) => item.id === tab);
  const nav = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState({
    width: 360,
    height: 64,
    bubble: 56,
    raise: 16,
  });
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const filmId = `nav-film-${id}`;
  const rimId = `nav-rim-${id}`;
  useLayoutEffect(() => {
    const element = nav.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const next = {
        width: box.width,
        height: box.height,
        bubble: parseFloat(style.getPropertyValue("--nav-bubble-size")),
        raise: parseFloat(style.getPropertyValue("--nav-raise")),
      };
      if (!next.width || !next.height) return;
      setFrame((previous) =>
        Object.entries(next).every(
          ([key, value]) => previous[key as keyof typeof previous] === value,
        )
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const slide = useNavSlide({
    nav,
    index,
    disabled,
    layoutKey: `${frame.width}/${frame.height}/${frame.bubble}/${frame.raise}`,
    onSelect: (next) => onChange(tabs[next].id),
  });
  const previewIndex = slide.position ?? index;
  const transition =
    reduced || slide.position !== null ? { duration: 0 } : NAV_MOTION;
  const shape = floatingNavGeometry(
    frame.width,
    frame.height,
    frame.bubble,
    frame.raise,
    previewIndex,
  );
  const SelectedIcon = tabs[Math.round(previewIndex)].Icon;
  return (
    <nav
      ref={nav}
      className="bottom-nav"
      aria-label="メインナビゲーション"
      data-dragging={slide.position !== null || undefined}
      {...slide.handlers}
    >
      <svg
        className="nav-shape"
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={filmId} x1="0" y1="0" x2="0.8" y2="1">
            <stop
              offset="0"
              stopColor="var(--accent-soft)"
              stopOpacity="0.13"
            />
            <stop offset="0.5" stopColor="#e8f1ff" stopOpacity="0.045" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id={rimId} x1="0.05" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dceeff" stopOpacity="0.65" />
            <stop
              offset="0.52"
              stopColor="var(--accent-soft)"
              stopOpacity="0.24"
            />
            <stop offset="1" stopColor="#badcff" stopOpacity="0.50" />
          </linearGradient>
        </defs>
        <motion.path
          className="nav-membrane"
          initial={{ d: shape.path }}
          animate={{ d: shape.path }}
          transition={transition}
          fill={`url(#${filmId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <motion.div
        className="nav-bubble"
        initial={false}
        animate={{ left: shape.center }}
        transition={transition}
      >
        <SelectedIcon size={25} strokeWidth={2.4} />
      </motion.div>
      <div className="nav-items">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${tabs[Math.round(previewIndex)].id === item.id ? "active" : ""}`}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            aria-label={item.label}
            aria-current={tab === item.id ? "page" : undefined}
          >
            <span className="nav-icon">
              <item.Icon size={22} strokeWidth={2.2} />
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
