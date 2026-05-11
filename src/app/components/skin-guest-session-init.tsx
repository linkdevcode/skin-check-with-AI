"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ensureSkinGuestSessionAction } from "@/actions/skin-guest";

/**
 * Khách: sau mount gọi server action để set cookie (User Khách N), rồi refresh nếu vừa tạo mới.
 */
export function SkinGuestSessionInit({ active }: { active: boolean }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!active || ran.current) return;
    ran.current = true;
    void (async () => {
      const r = await ensureSkinGuestSessionAction();
      if (r.ok && r.refreshed) router.refresh();
    })();
  }, [active, router]);

  return null;
}
