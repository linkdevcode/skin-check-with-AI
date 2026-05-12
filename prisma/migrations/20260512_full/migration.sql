-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('OILY', 'DRY', 'COMBINATION', 'SENSITIVE');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('AM', 'PM');

-- CreateEnum
CREATE TYPE "ImageAngle" AS ENUM ('FRONT', 'LEFT', 'RIGHT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "skin_type" "SkinType" NOT NULL,
    "skin_concerns" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brand_name" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "ingredients_list" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skincare_routines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "routine_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skincare_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_details" (
    "id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "product_id" UUID,
    "time_of_day" "TimeOfDay" NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "routine_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_history" (
    "id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "conflicts" JSONB NOT NULL DEFAULT '[]',
    "ai_recommendations" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_entries" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "image_url_front" TEXT NOT NULL,
    "image_url_left" TEXT,
    "image_url_right" TEXT,
    "analysis_result" JSONB NOT NULL,
    "user_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skin_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_routines" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "image_url_front" TEXT NOT NULL,
    "image_url_left" TEXT NOT NULL,
    "image_url_right" TEXT NOT NULL,
    "face_analysis" JSONB NOT NULL,
    "routine_result" JSONB NOT NULL,
    "mode" TEXT NOT NULL,
    "budget_vnd" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommended_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_images" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "angle" "ImageAngle" NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skin_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_reset_token_idx" ON "users"("reset_token");

-- CreateIndex
CREATE INDEX "products_brand_name_product_name_idx" ON "products"("brand_name", "product_name");

-- CreateIndex
CREATE INDEX "skincare_routines_user_id_idx" ON "skincare_routines"("user_id");

-- CreateIndex
CREATE INDEX "routine_details_routine_id_time_of_day_order_index_idx" ON "routine_details"("routine_id", "time_of_day", "order_index");

-- CreateIndex
CREATE INDEX "analysis_history_routine_id_created_at_idx" ON "analysis_history"("routine_id", "created_at");

-- CreateIndex
CREATE INDEX "skin_entries_user_id_created_at_idx" ON "skin_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "recommended_routines_user_id_created_at_idx" ON "recommended_routines"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "skin_images_user_id_created_at_idx" ON "skin_images"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "skin_images_user_id_scope_angle_key" ON "skin_images"("user_id", "scope", "angle");

-- AddForeignKey
ALTER TABLE "skincare_routines" ADD CONSTRAINT "skincare_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_details" ADD CONSTRAINT "routine_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_details" ADD CONSTRAINT "routine_details_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "skincare_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_history" ADD CONSTRAINT "analysis_history_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "skincare_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_entries" ADD CONSTRAINT "skin_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_routines" ADD CONSTRAINT "recommended_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_images" ADD CONSTRAINT "skin_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

