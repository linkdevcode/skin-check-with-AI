import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Cookie HttpOnly gắn thiết bị với một User khách trong DB. */
export const SKIN_GUEST_COOKIE = "skin_guest_uid";

const GUEST_EMAIL_SUFFIX = "@guest.skin";

function guestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    secure: process.env.NODE_ENV === "production",
  };
}

/** Đọc user hiệu lực (đăng nhập hoặc khách đã có cookie), không tạo mới. */
export async function getEffectiveUserIdForRead(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const jar = await cookies();
  const raw = jar.get(SKIN_GUEST_COOKIE)?.value;
  if (!raw) return null;

  const u = await prisma.user.findFirst({
    where: { id: raw, email: { endsWith: GUEST_EMAIL_SUFFIX } },
    select: { id: true },
  });
  return u?.id ?? null;
}

export type SkinActor = { userId: string; isAnonymous: boolean; createdNew: boolean };

/**
 * User để ghi DB (routine / nhật ký): session hoặc tạo User khách + set cookie.
 */
export async function resolveSkinActorUserId(): Promise<SkinActor> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, isAnonymous: false, createdNew: false };
  }

  const jar = await cookies();
  const raw = jar.get(SKIN_GUEST_COOKIE)?.value;
  if (raw) {
    const existing = await prisma.user.findFirst({
      where: { id: raw, email: { endsWith: GUEST_EMAIL_SUFFIX } },
      select: { id: true },
    });
    if (existing) {
      return { userId: existing.id, isAnonymous: true, createdNew: false };
    }
  }

  const ordinal =
    (await prisma.user.count({
      where: { email: { endsWith: GUEST_EMAIL_SUFFIX } },
    })) + 1;

  const newUser = await prisma.user.create({
    data: {
      name: `Khách ${ordinal}`,
      email: `guest-${randomUUID()}${GUEST_EMAIL_SUFFIX}`,
      skinType: "COMBINATION",
      skinConcerns: "",
    },
  });

  jar.set(SKIN_GUEST_COOKIE, newUser.id, guestCookieOptions());

  return { userId: newUser.id, isAnonymous: true, createdNew: true };
}
