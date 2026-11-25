import { useId } from "react";
import { motion } from "framer-motion";
import {
  MEMBRANE_PERIOD,
  MEMBRANE_PHASES,
  membranePath,
} from "../ui/drawMembrane";

const paths = MEMBRANE_PHASES.map(membranePath);

/** Vector film: clear air in the center, fine reflections along a soft contour. */
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
  return (
    <motion.g
      className="draw-membrane"
      animate={{ scale: pressed && !reduced ? [1, 0.94, 1] : 1 }}
      transition={{ duration: reduced ? 0 : 0.32, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#dceaff" stopOpacity=".065" />
          <stop offset=".37" stopColor="#a9bdea" stopOpacity=".012" />
          <stop offset=".7" stopColor="#96cdd4" stopOpacity=".035" />
          <stop offset="1" stopColor="#c6a7dd" stopOpacity=".09" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor="#f3edff" stopOpacity=".9" />
          <stop offset=".2" stopColor="#b0dfec" stopOpacity=".66" />
          <stop offset=".43" stopColor="#b1b1e8" stopOpacity=".15" />
          <stop offset=".64" stopColor="#dbb7d5" stopOpacity=".48" />
          <stop offset=".8" stopColor="#b9e2cb" stopOpacity=".65" />
          <stop offset="1" stopColor="#d6b7e5" stopOpacity=".75" />
        </linearGradient>
        <linearGradient id={`${id}-fold`} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor="#c7a9de" stopOpacity=".025" />
          <stop offset=".4" stopColor="#abd6e4" stopOpacity=".06" />
          <stop offset=".72" stopColor="#b3d6b6" stopOpacity=".025" />
          <stop offset="1" stopColor="#e9c6dc" stopOpacity=".05" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <motion.path d={paths[0]} animate={animate} transition={transition} />
        </clipPath>
      </defs>
      <motion.path
        d={paths[0]}
        animate={animate}
        transition={transition}
        fill={`url(#${id}-wash)`}
        stroke={`url(#${id}-rim)`}
        strokeWidth=".8"
        strokeOpacity=".22"
      />
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M-57-9 C-25 1 -6-30 24-28 S55-10 58-8 L58-4 C24-34-6-19-24-10 S-46 3-57-3Z"
          fill={`url(#${id}-fold)`}
        />
        <path
          d="M-56 33 C-19 48-5 12 25 12 S50 1 57-10 L57 3 C33 29 16 14 1 29 S-36 53-56 39Z"
          fill={`url(#${id}-fold)`}
        />
        <path
          d="M-56 33 C-19 48-5 12 25 12 S50 1 57-10"
          fill="none"
          stroke={`url(#${id}-rim)`}
          strokeWidth=".16"
          strokeOpacity=".44"
        />
      </g>
      <motion.path
        d={paths[0]}
        animate={animate}
        transition={transition}
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth=".4"
      />
      <motion.path
        d={paths[0]}
        animate={animate}
        transition={transition}
        fill="none"
        stroke="#eef5ff"
        strokeWidth=".7"
        strokeOpacity=".13"
        pathLength="300"
        strokeDasharray="37 263"
        strokeDashoffset="-182"
      />
      <motion.path
        d={paths[0]}
        animate={animate}
        transition={transition}
        fill="none"
        stroke="#edf3ff"
        strokeWidth=".22"
        strokeOpacity=".6"
        pathLength="300"
        strokeDasharray="30 270"
        strokeDashoffset="-185"
      />
    </motion.g>
  );
}
