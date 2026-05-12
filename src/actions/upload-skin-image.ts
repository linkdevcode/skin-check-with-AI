"use server";

import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { resolveSkinActorUserId } from "@/lib/skin-actor";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export type UploadSkinImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload ảnh nhật ký da lên Vercel Blob (public URL).
 * Cần `BLOB_READ_WRITE_TOKEN` trên Vercel / .env.local.
 */
export async function uploadSkinImageAction(formData: FormData): Promise<UploadSkinImageResult> {
  const scopeRaw = String(formData.get("scope") ?? "skin-diary").trim();
  const prefix = scopeRaw === "face-scan" ? "face-scan" : "skin-diary";

  let userId: string;
  if (prefix === "skin-diary") {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Vui lòng đăng nhập để tải ảnh nhật ký da." };
    }
    userId = session.user.id;
  } else {
    const actor = await resolveSkinActorUserId();
    userId = actor.userId;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return { ok: false, error: "Chưa cấu hình BLOB_READ_WRITE_TOKEN." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Thiếu file ảnh." };
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, error: "Ảnh phải nhỏ hơn 8MB." };
  }

  const mime = (file.type || "image/jpeg").toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    return { ok: false, error: "Chỉ chấp nhận JPEG, PNG hoặc WebP." };
  }

  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${prefix}/${userId}/${Date.now()}.${ext}`;

  try {
    const blob = await put(path, file, {
      // Public URL để <img> và fetch (Gemini) không cần Bearer; private dùng *.private.blob… và bị chặn SSRF guard.
      access: "public",
      token,
      contentType: mime === "image/jpg" ? "image/jpeg" : mime,
    });

    // Lưu URL vào DB ngay sau khi upload để tránh mất URL trên iOS/Safari
    try {
      await prisma.skinImage.create({
        data: {
          userId,
          scope: prefix,
          url: blob.url,
        },
      });
    } catch (dbErr) {
      console.error("[uploadSkinImageAction] Lưu URL blob thất bại:", dbErr);
      // không chặn upload, chỉ log
    }

    return { ok: true, url: blob.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload thất bại.";
    return { ok: false, error: msg };
  }
}
