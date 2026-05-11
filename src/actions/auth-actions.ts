"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import { SkinType } from "@prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const name = input.name.trim().slice(0, 80);
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) {
    return { ok: false, error: "Nhập họ tên hoặc biệt danh." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email không hợp lệ." };
  }
  if (!isStrongEnoughPassword(password)) {
    return { ok: false, error: "Mật khẩu tối thiểu 8 ký tự." };
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { ok: false, error: "Email đã được đăng ký." };
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        skinType: SkinType.COMBINATION,
        skinConcerns: "",
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[registerUser]", e);
    return { ok: false, error: "Không thể tạo tài khoản. Thử lại sau." };
  }
}

export async function requestPasswordReset(emailRaw: string): Promise<ActionResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email không hợp lệ." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return { ok: true };
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const base = getSiteUrl();
    const resetLink = new URL(`/dat-lai-mat-khau?token=${encodeURIComponent(token)}`, base).toString();

    const { sent, devFallbackLink } = await sendPasswordResetEmail(email, resetLink);

    if (!sent && devFallbackLink) {
      console.info(
        "\n[requestPasswordReset] Email không gửi qua Resend (dev: thiếu API key hoặc lỗi sandbox) — link đặt lại mật khẩu:\n",
        devFallbackLink,
        "\n",
      );
    }
    if (!sent && !devFallbackLink) {
      console.error(
        "[requestPasswordReset] Không gửi được email đặt lại. Trên production: verify domain tại resend.com/domains và đặt RESEND_FROM từ domain đó.",
      );
    }

    return { ok: true };
  } catch (e) {
    console.error("[requestPasswordReset]", e);
    return { ok: false, error: "Không gửi được yêu cầu. Thử lại sau." };
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<ActionResult> {
  if (!token?.trim()) {
    return { ok: false, error: "Liên kết không hợp lệ." };
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return { ok: false, error: "Mật khẩu mới tối thiểu 8 ký tự." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token.trim(),
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return { ok: false, error: "Liên kết hết hạn hoặc không đúng. Yêu cầu gửi lại email." };
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[resetPasswordWithToken]", e);
    return { ok: false, error: "Không đặt lại được mật khẩu. Thử lại." };
  }
}
