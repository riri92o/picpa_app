import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, House, Settings2 } from "lucide-react";
import { NAV_MOTION } from "../constants/config";
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
  const transition = reduced ? { duration: 0 } : NAV_MOTION;
  const index = tabs.findIndex((item) => item.id === tab);
  const center = 65 + 130 * index;
  const left = center - 51,
    right = center + 51;
  const d = `M 0 10 C ${left / 3} 4 ${(left * 2) / 3} -4 ${left} 0 C ${center - 37} 0 ${center - 37} 26 ${center - 20} 36 C ${center - 10} 44 ${center + 10} 44 ${center + 20} 36 C ${center + 37} 26 ${center + 37} 0 ${right} 0 C ${right + (390 - right) / 3} -4 ${right + ((390 - right) * 2) / 3} 4 390 10 V 96 H 0 Z`;
  const SelectedIcon = tabs[index].Icon;
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <svg
        className="nav-shape"
        viewBox="0 0 390 96"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path animate={{ d }} transition={transition} />
      </svg>
      <motion.div
        className="nav-bubble"
        animate={{ left: `${((index + 0.5) / 3) * 100}%` }}
        transition={transition}
      >
        <SelectedIcon size={25} strokeWidth={2.4} />
      </motion.div>
      <div className="nav-items">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? "active" : ""}`}
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
