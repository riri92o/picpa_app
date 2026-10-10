import { motion } from "framer-motion";
import { ROUND_BUBBLES } from "../ui/bubbleGeometry";
import { LIQUID_MOTION } from "../constants/liquidMotion";

/** A code-native soap film. The silhouette and its clipped color ribbons morph together. */
export function BubbleSurface({
  id,
  color,
  neutral = false,
  reduced = false,
  period = LIQUID_MOTION.contour,
}: {
  id: string;
  color: string;
  neutral?: boolean;
  reduced?: boolean;
  period?: number;
}) {
  const contour = reduced ? ROUND_BUBBLES[0] : ROUND_BUBBLES;
  const transition = {
    duration: period,
    repeat: reduced ? 0 : Infinity,
    ease: "easeInOut" as const,
  };
  const pearl = neutral ? "#e0e4ed" : "#ffdae8";
  const aqua = neutral ? "#b7c0d0" : "#b7eff3";
  const gold = neutral ? "#f2f3f7" : "#fff2c9";
  return (
    <>
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="33%" r="72%">
          <stop offset="0" stopColor={color} stopOpacity=".26" />
          <stop offset=".5" stopColor={color} stopOpacity=".62" />
          <stop offset=".78" stopColor={color} stopOpacity=".8" />
          <stop offset=".94" stopColor={aqua} stopOpacity=".9" />
          <stop offset="1" stopColor={pearl} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={gold} />
          <stop offset=".25" stopColor={pearl} />
          <stop offset=".5" stopColor={aqua} />
          <stop offset=".75" stopColor={color} />
          <stop offset="1" stopColor={gold} />
        </linearGradient>
        <radialGradient id={`${id}-veil`}>
          <stop offset=".34" stopColor="black" />
          <stop offset=".67" stopColor="#555" />
          <stop offset=".88" stopColor="white" />
          <stop offset="1" stopColor="white" />
        </radialGradient>
        <mask
          id={`${id}-film`}
          maskUnits="userSpaceOnUse"
          x="-52"
          y="-52"
          width="104"
          height="104"
        >
          <circle r="51" fill={`url(#${id}-veil)`} />
        </mask>
        <clipPath id={`${id}-clip`}>
          <motion.path
            initial={false}
            animate={{ d: contour }}
            transition={transition}
          />
        </clipPath>
      </defs>
      <motion.path
        initial={false}
        animate={{ d: contour }}
        transition={transition}
        fill={`url(#${id}-body)`}
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.3"
      />
      <g clipPath={`url(#${id}-clip)`}>
        <g mask={`url(#${id}-film)`} fill="none" strokeLinecap="round">
          <path
            d="M-54 2C-33-47 2-48 27-36C58-18 6-29-7-6C-26 26-52 4-39 47"
            stroke={pearl}
            strokeWidth="12"
            opacity=".78"
          />
          <path
            d="M-50 8C-34-35-5-45 18-37C44-29 4-21-5-3C-20 26-42 18-34 47"
            stroke={gold}
            strokeWidth="4.8"
            opacity=".88"
          />
          <path
            d="M-53 16C-27-31-13-29 6-27C28-23-10-7-14 10C-18 33-38 26-24 48"
            stroke={aqua}
            strokeWidth="6"
            opacity=".75"
          />
          <path
            d="M51-27C27-18 46 5 28 13C4 23 38 48-18 47"
            stroke={aqua}
            strokeWidth="13"
            opacity=".75"
          />
          <path
            d="M49-29C24-19 43 6 24 17C4 29 30 40-20 48"
            stroke={gold}
            strokeWidth="4.5"
            opacity=".94"
          />
          <path
            d="M48-35C19-16 42 5 21 14C-1 26 20 41-26 47"
            stroke={pearl}
            strokeWidth="6.5"
            opacity=".8"
          />
        </g>
        <ellipse
          cx="-24"
          cy="-29"
          rx="9"
          ry="3.5"
          transform="rotate(-42 -24 -29)"
          fill="#fff"
          opacity=".65"
        />
        <path
          d="M-35-19A40 40 0 0 1-9-39"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          opacity=".62"
          strokeLinecap="round"
        />
        <ellipse
          cx="22"
          cy="31"
          rx="12"
          ry="5"
          transform="rotate(-28 22 31)"
          fill={gold}
          opacity=".14"
        />
      </g>
    </>
  );
}
