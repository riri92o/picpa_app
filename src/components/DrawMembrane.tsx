import { useId } from "react";
import { motion } from "framer-motion";
import {
  MEMBRANE_DROPLETS,
  MEMBRANE_PERIOD,
  MEMBRANE_PHASES,
  membranePath,
  membranePoint,
} from "../ui/drawMembrane";

const paths = MEMBRANE_PHASES.map(membranePath);
const contacts = MEMBRANE_DROPLETS.filter((drop) => drop.color).map((drop) => ({
  ...drop,
  positions: MEMBRANE_PHASES.map((phase) => membranePoint(drop.angle, phase)),
}));
const neckLight =
  "M -1.08 -.05 C -.99 -.05 -.98 .13 -.9 .3 M 1.08 -.05 C .99 -.05 .98 .13 .9 .3";

/** A clear surface with soft environmental reflections and wet, rounded edges. */
export function DrawMembrane({
  reduced,
  pressed,
}: {
  reduced: boolean;
  pressed: boolean;
}) {
  const id = useId();
  const animate = { d: reduced ? paths[0] : paths };
  const transition = {
    duration: reduced ? 0 : MEMBRANE_PERIOD,
    repeat: reduced ? 0 : Infinity,
    ease: "easeInOut" as const,
  };
  const outline = { d: paths[0], animate, transition };
  return (
    <motion.g
      className="draw-membrane"
      animate={{ scale: pressed && !reduced ? [1, 0.94, 1] : 1 }}
      transition={{ duration: reduced ? 0 : 0.32, ease: "easeOut" }}
    >
      <defs>
        <linearGradient
          id={`${id}-body`}
          gradientUnits="userSpaceOnUse"
          x1="-42"
          y1="-48"
          x2="35"
          y2="49"
        >
          <stop stopColor="#d7e9ff" stopOpacity=".055" />
          <stop offset=".28" stopColor="#b5bfe7" stopOpacity=".015" />
          <stop offset=".6" stopColor="#c4c5e9" stopOpacity=".008" />
          <stop offset=".85" stopColor="#a7d8c5" stopOpacity=".045" />
          <stop offset="1" stopColor="#d4aad9" stopOpacity=".075" />
        </linearGradient>
        <linearGradient
          id={`${id}-film`}
          gradientUnits="userSpaceOnUse"
          x1="-43"
          y1="-48"
          x2="28"
          y2="48"
        >
          <stop stopColor="#bcdff2" stopOpacity=".75" />
          <stop offset=".22" stopColor="#dac0eb" stopOpacity=".44" />
          <stop offset=".46" stopColor="#949dd4" stopOpacity=".12" />
          <stop offset=".65" stopColor="#95d3d8" stopOpacity=".24" />
          <stop offset=".82" stopColor="#c1e4b0" stopOpacity=".8" />
          <stop offset="1" stopColor="#dfb0db" stopOpacity=".68" />
        </linearGradient>
        <linearGradient
          id={`${id}-edge`}
          gradientUnits="userSpaceOnUse"
          x1="-43"
          y1="-48"
          x2="32"
          y2="48"
        >
          <stop stopColor="#f3f7ff" stopOpacity=".94" />
          <stop offset=".26" stopColor="#bce2f0" stopOpacity=".6" />
          <stop offset=".49" stopColor="#b9a9d7" stopOpacity=".12" />
          <stop offset=".75" stopColor="#b9dfcf" stopOpacity=".55" />
          <stop offset="1" stopColor="#eed6e8" stopOpacity=".63" />
        </linearGradient>
        <radialGradient
          id={`${id}-window`}
          gradientUnits="userSpaceOnUse"
          cx="-29"
          cy="-25"
          r="66"
        >
          <stop stopColor="#d7e7ff" stopOpacity=".16" />
          <stop offset=".25" stopColor="#aacce4" stopOpacity=".085" />
          <stop offset=".67" stopColor="#adb5df" stopOpacity=".015" />
          <stop offset="1" stopColor="#a3c5e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-flow`}
          gradientUnits="userSpaceOnUse"
          x1="-47"
          y1="39"
          x2="46"
          y2="16"
        >
          <stop stopColor="#75d8a9" stopOpacity=".23" />
          <stop offset=".32" stopColor="#8acfe7" stopOpacity=".14" />
          <stop offset=".58" stopColor="#cb8be8" stopOpacity=".2" />
          <stop offset=".83" stopColor="#83d0d7" stopOpacity=".17" />
          <stop offset="1" stopColor="#e0dbed" stopOpacity=".025" />
        </linearGradient>
        <filter
          id={`${id}-soft`}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation=".65" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <motion.path {...outline} />
        </clipPath>
        <mask
          id={`${id}-rim-mask`}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x="-65"
          y="-65"
          width="130"
          height="130"
        >
          <rect x="-65" y="-65" width="130" height="130" fill="white" />
          {contacts.map((drop, i) => (
            <motion.circle
              key={i}
              cx={drop.positions[0].x}
              cy={drop.positions[0].y}
              r={drop.radius * 94}
              fill="black"
              animate={{
                cx: reduced
                  ? drop.positions[0].x
                  : drop.positions.map((p) => p.x),
                cy: reduced
                  ? drop.positions[0].y
                  : drop.positions.map((p) => p.y),
              }}
              transition={transition}
            />
          ))}
        </mask>
      </defs>
      <motion.path {...outline} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <g filter={`url(#${id}-soft)`}>
          <path
            d="M-57-7 C-27 3-8-29 23-29 S51-13 58-7 L58-1 C26-33-6-18-25-8 S-49 6-57 1Z"
            fill={`url(#${id}-window)`}
          />
          <path
            d="M-57 30 C-22 47-5 12 25 12 S48 2 57-12 L57 1 C35 28 16 15 0 29 S-34 53-57 39Z"
            fill={`url(#${id}-flow)`}
          />
        </g>
        <path
          d="M-54-7 C-27 3-8-29 23-29 S51-13 55-9"
          fill="none"
          stroke={`url(#${id}-window)`}
          strokeWidth=".25"
        />
        <path
          d="M-55 31 C-22 47-5 12 25 12 S48 2 56-10"
          fill="none"
          stroke={`url(#${id}-film)`}
          strokeWidth=".18"
          strokeOpacity=".34"
        />
      </g>
      <g mask={`url(#${id}-rim-mask)`}>
        <g clipPath={`url(#${id}-clip)`}>
          <motion.path
            {...outline}
            fill="none"
            stroke={`url(#${id}-film)`}
            strokeWidth="4.2"
            strokeOpacity=".42"
            filter={`url(#${id}-soft)`}
          />
          <motion.path
            {...outline}
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.45"
            strokeOpacity=".14"
          />
        </g>
        <motion.path
          {...outline}
          fill="none"
          stroke={`url(#${id}-film)`}
          strokeWidth="1.15"
          strokeOpacity=".22"
        />
        <motion.path
          {...outline}
          fill="none"
          stroke={`url(#${id}-edge)`}
          strokeWidth=".3"
          strokeOpacity=".65"
        />
        <motion.path
          {...outline}
          fill="none"
          stroke="#e5f2ff"
          strokeWidth="1.7"
          strokeOpacity=".16"
          pathLength="300"
          strokeDasharray="41 259"
          strokeDashoffset="-181"
          filter={`url(#${id}-soft)`}
        />
        <motion.path
          {...outline}
          fill="none"
          stroke="#eef6ff"
          strokeWidth=".42"
          strokeOpacity=".68"
          strokeLinecap="round"
          pathLength="300"
          strokeDasharray="28 272"
          strokeDashoffset="-187"
        />
      </g>
      {contacts.map((drop, i) => {
        const r = drop.radius * 100,
          a = drop.angle;
        return (
          <motion.g
            key={i}
            className="membrane-contact"
            animate={{
              x: reduced ? drop.positions[0].x : drop.positions.map((p) => p.x),
              y: reduced ? drop.positions[0].y : drop.positions.map((p) => p.y),
            }}
            transition={transition}
            initial={false}
          >
            <g
              transform={`matrix(${-Math.sin(a) * r} ${Math.cos(a) * r} ${Math.cos(a) * r} ${Math.sin(a) * r} 0 0)`}
            >
              <path
                d={neckLight}
                fill="none"
                stroke={drop.color}
                strokeWidth=".14"
                strokeOpacity=".12"
                strokeLinecap="round"
              />
              <path
                d={neckLight}
                fill="none"
                stroke="#dbe9f8"
                strokeWidth=".032"
                strokeOpacity=".3"
                strokeLinecap="round"
              />
            </g>
          </motion.g>
        );
      })}
    </motion.g>
  );
}
