-- Xoá dữ liệu ảnh cũ (một cột image_url) trước khi chuyển sang 3 URL / góc chụp.
DELETE FROM "recommended_routines";
DELETE FROM "skin_entries";

ALTER TABLE "skin_entries" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE "skin_entries" ADD COLUMN "image_url_front" TEXT NOT NULL;
ALTER TABLE "skin_entries" ADD COLUMN "image_url_left" TEXT;
ALTER TABLE "skin_entries" ADD COLUMN "image_url_right" TEXT;

ALTER TABLE "recommended_routines" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE "recommended_routines" ADD COLUMN "image_url_front" TEXT NOT NULL;
ALTER TABLE "recommended_routines" ADD COLUMN "image_url_left" TEXT NOT NULL;
ALTER TABLE "recommended_routines" ADD COLUMN "image_url_right" TEXT NOT NULL;
