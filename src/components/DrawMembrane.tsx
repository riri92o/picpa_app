import { useId } from "react";
import { motion } from "framer-motion";
import {
  MEMBRANE_DROPLETS,
  MEMBRANE_PERIOD,
  MEMBRANE_PHASES,
  membranePath,
  membranePoint,
} from "../ui/drawMembrane";
import {
  membraneRibbonPath,
  membraneMeniscusPath,
} from "../ui/membraneMaterial";

const paths = MEMBRANE_PHASES.map(membranePath);
const ribbons = MEMBRANE_PHASES.map((phase) => membraneRibbonPath(phase, 2.2));
const cores = MEMBRANE_PHASES.map((phase) => membraneRibbonPath(phase, 0.52));
const contacts = MEMBRANE_DROPLETS.filter((drop) => drop.color).map(
  (drop, index) => ({
    ...drop,
    positions: MEMBRANE_PHASES.map((phase) => membranePoint(drop.angle, phase)),
    paths: MEMBRANE_PHASES.map((phase) => membraneMeniscusPath(phase, index)),
  }),
);

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
  const shape = (frames: string[]) => ({
    d: frames[0],
    animate: { d: reduced ? frames[0] : frames },
    transition,
  });
  return (
    <motion.g
      className="draw-membrane"
      animate={{ opacity: pressed && !reduced ? [1, 0.92, 1] : 1 }}
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
          <stop stopColor="#c1dafa" stopOpacity=".035" />
          <stop offset=".38" stopColor="#b5bfe7" stopOpacity=".004" />
          <stop offset=".73" stopColor="#b6cbe9" stopOpacity=".008" />
          <stop offset="1" stopColor="#b4addd" stopOpacity=".04" />
        </linearGradient>
        <linearGradient
          id={`${id}-film`}
          gradientUnits="userSpaceOnUse"
          x1="-43"
          y1="-48"
          x2="28"
          y2="48"
        >
          <stop stopColor="#bcdff2" />
          <stop offset=".22" stopColor="#dac0eb" />
          <stop offset=".46" stopColor="#949dd4" stopOpacity=".5" />
          <stop offset=".65" stopColor="#95d3d8" stopOpacity=".65" />
          <stop offset=".82" stopColor="#c1e4b0" />
          <stop offset="1" stopColor="#dfb0db" />
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
          <stop stopColor="#c3e4ff" stopOpacity=".085" />
          <stop offset=".25" stopColor="#91cbe8" stopOpacity=".045" />
          <stop offset=".67" stopColor="#adb5df" stopOpacity=".005" />
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
          <stop stopColor="#4fe89a" stopOpacity=".12" />
          <stop offset=".2" stopColor="#72b9ed" stopOpacity=".035" />
          <stop offset=".5" stopColor="#bd79ed" stopOpacity=".13" />
          <stop offset=".7" stopColor="#e2a3d1" stopOpacity=".16" />
          <stop offset="1" stopColor="#92d3e3" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${id}-soft`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation=".42" />
        </filter>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="white" />
          <stop offset=".35" stopColor="white" stopOpacity=".85" />
          <stop offset=".72" stopColor="white" stopOpacity=".3" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask
          id={`${id}-lighting`}
          maskUnits="userSpaceOnUse"
          x="-60"
          y="-60"
          width="120"
          height="120"
        >
          <rect x="-60" y="-60" width="120" height="120" fill="#222" />
          <ellipse
            cx="-30"
            cy="-29"
            rx="25"
            ry="35"
            transform="rotate(34 -30 -29)"
            fill={`url(#${id}-light)`}
          />
          <ellipse
            cx="13"
            cy="42"
            rx="39"
            ry="17"
            transform="rotate(-12 13 42)"
            fill={`url(#${id}-light)`}
            opacity=".72"
          />
        </mask>
        <mask
          id={`${id}-glints`}
          maskUnits="userSpaceOnUse"
          x="-60"
          y="-60"
          width="120"
          height="120"
        >
          <rect x="-60" y="-60" width="120" height="120" fill="black" />
          <ellipse
            cx="-37"
            cy="-27"
            rx="17"
            ry="7"
            transform="rotate(-54 -37 -27)"
            fill={`url(#${id}-light)`}
          />
          <ellipse
            cx="16"
            cy="42"
            rx="17"
            ry="5"
            transform="rotate(-22 16 42)"
            fill={`url(#${id}-light)`}
            opacity=".3"
          />
        </mask>
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
            d="M-53-9 C-31-3-16-22 4-27 S38-26 52-11 L53-8 C35-26 16-22-1-15 S-32 7-54-4Z"
            fill={`url(#${id}-window)`}
          />
          <path
            d="M-54 29 C-32 47-20 44-4 37 S33 28 53 12 L55 21 C32 44 18 40 0 46 S-34 51-54 35Z"
            fill={`url(#${id}-flow)`}
          />
        </g>
      </g>
      <g mask={`url(#${id}-rim-mask)`}>
        <g mask={`url(#${id}-lighting)`}>
          <motion.path
            {...shape(ribbons)}
            fill={`url(#${id}-film)`}
            opacity=".46"
            filter={`url(#${id}-soft)`}
          />
          <motion.path
            {...shape(ribbons)}
            fill={`url(#${id}-film)`}
            opacity=".33"
          />
          <motion.path
            {...shape(cores)}
            fill={`url(#${id}-edge)`}
            opacity="1"
            mask={`url(#${id}-glints)`}
          />
        </g>
        <motion.path
          {...outline}
          fill="none"
          stroke={`url(#${id}-film)`}
          strokeWidth=".095"
          strokeOpacity=".16"
        />
        {contacts.map((drop, index) => (
          <g key={index} className="membrane-contact">
            <motion.path
              {...shape(drop.paths)}
              fill={drop.color}
              opacity=".14"
            />
            <motion.path
              {...shape(drop.paths)}
              fill={`url(#${id}-film)`}
              opacity=".12"
            />
          </g>
        ))}
      </g>
    </motion.g>
  );
}
