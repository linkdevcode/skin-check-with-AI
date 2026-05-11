import type { Transition } from "framer-motion";

/** Spring desktop — giữ độ nảy vừa phải */
export const springSnappy = { type: "spring" as const, stiffness: 520, damping: 28, mass: 0.85 };
export const springSoft = { type: "spring" as const, stiffness: 380, damping: 26, mass: 0.9 };
export const springBouncy = { type: "spring" as const, stiffness: 420, damping: 18, mass: 0.75 };

/** Tween ngắn — ưu tiên mobile / giảm CPU */
export const tweenTap: Transition = { type: "tween", duration: 0.18, ease: "easeOut" };
export const tweenEnter: Transition = { type: "tween", duration: 0.24, ease: [0.25, 0.1, 0.25, 1] };
export const tweenExit: Transition = { type: "tween", duration: 0.18, ease: "easeIn" };
export const tweenLayout: Transition = { type: "tween", duration: 0.22, ease: "easeOut" };

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
