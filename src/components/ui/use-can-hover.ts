"use client";

import { useEffect, useState } from "react";

/** true khi thiết bị hỗ trợ hover chuột (không phải chỉ cảm ứng). */
export function useCanHover(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCan(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return can;
}
