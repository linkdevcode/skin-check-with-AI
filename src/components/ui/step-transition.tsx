"use client";

import { AnimatePresence, motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeSlide = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
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
        className={className}
        variants={fadeSlide}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.32, ease }}
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
          className={className}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
