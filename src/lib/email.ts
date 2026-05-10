import { Resend } from "resend";
import { getSiteUrl } from "@/lib/site";

type SendResetResult = { sent: boolean; devFallbackLink?: string };

/**
 * Gửi email đặt lại mật khẩu. Cần RESEND_API_KEY + RESEND_FROM trên production.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<SendResetResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "SkinCheck AI <onboarding@resend.dev>";

  if (!apiKey) {
    const isDev = process.env.NODE_ENV === "development";
    return {
      sent: false,
      devFallbackLink: isDev ? resetLink : undefined,
    };
  }

  const resend = new Resend(apiKey);
  const base = getSiteUrl().origin;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Đặt lại mật khẩu — SkinCheck AI",
    html: `
      <p>Xin chào,</p>
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản SkinCheck AI.</p>
      <p><a href="${resetLink}" style="color:#34d399;">Đặt lại mật khẩu</a></p>
      <p>Liên kết hết hạn sau 1 giờ. Nếu không phải bạn, bỏ qua email này.</p>
      <p style="font-size:12px;color:#71717a;">${base}</p>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    return { sent: false };
  }

  return { sent: true };
}
