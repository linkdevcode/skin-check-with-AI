"use server";

import { auth } from "@/auth";
import { resolveSkinActorUserId } from "@/lib/skin-actor";

export type EnsureSkinGuestSessionResult =
  | { ok: true; refreshed: boolean }
  | { ok: false; error: string };

/**
 * Khách (chưa đăng nhập): đảm bảo có User + cookie để trang RSC đọc được `getEffectiveUserIdForRead`.
 * Gọi một lần khi vào trang nhật ký / lịch sử routine (client mount).
 */
export async function ensureSkinGuestSessionAction(): Promise<EnsureSkinGuestSessionResult> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return { ok: true, refreshed: false };
    }
    const actor = await resolveSkinActorUserId();
    return { ok: true, refreshed: actor.createdNew };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không khởi tạo phiên khách." };
  }
}
