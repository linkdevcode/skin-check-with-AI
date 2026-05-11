"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tweenEnter, tweenExit } from "./motion-spring";

const fadeSlide = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: tweenEnter },
  exit: { opacity: 0, y: -12, transition: tweenExit },
};

type StepTransitionProps = {
  /** Đổi key khi chuyển bước — nội dung cũ fade, mới trượt từ dưới lên */
  stepKey: string;
  className?: string;
  children: React.ReactNode;
};

export function StepTransition({ stepKey, className, children }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        layout={false}
        className={cn("sk-will-change-transform", className)}
        variants={fadeSlide}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type MotionRevealProps = {
  /** Khi true, mount kèm animation vào */
  show: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Panel xuất hiện lần đầu (fade + slide từ dưới), ẩn có exit */
export function MotionReveal({ show, className, children }: MotionRevealProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="reveal"
          layout={false}
          className={cn("sk-will-change-transform", className)}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0, transition: tweenEnter }}
          exit={{ opacity: 0, y: -10, transition: tweenExit }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
