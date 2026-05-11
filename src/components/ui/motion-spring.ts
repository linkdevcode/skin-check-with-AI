import type { Transition } from "framer-motion";

/** Spring mặc định — ưu tiên cảm giác vật lý (ProMotion / mobile). */
export const springSnappy = { type: "spring" as const, stiffness: 520, damping: 28, mass: 0.85 };
export const springSoft = { type: "spring" as const, stiffness: 380, damping: 26, mass: 0.9 };
export const springBouncy = { type: "spring" as const, stiffness: 420, damping: 18, mass: 0.75 };

/**
 * Icon/tab “pop” với scale [1, >1, 1] — Motion không cho spring + nhiều keyframe.
 * @see https://motion.dev/troubleshooting/spring-two-frames
 */
export const tweenTabIconBounce: Transition = {
  type: "tween",
  duration: 0.42,
  times: [0, 0.38, 1],
  ease: ["easeOut", "easeInOut"],
};
