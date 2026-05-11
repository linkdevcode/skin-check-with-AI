"use client";

import { useEffect, useState } from "react";

/**
 * Mobile / cảm ứng thô — giảm spring phức tạp, tween nhẹ, tránh layout projection nặng.
 * Mặc định false trước hydrate để tránh lệch SSR.
 */
export function useCoarsePointerOrNarrow(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return coarse;
}
