-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('READING_MILESTONE', 'GENRE_EXPLORER', 'SOCIAL_BUTTERFLY', 'CLUB_PARTICIPANT', 'REVIEWER', 'RECOMMENDER', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."AchievementDifficulty" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- AlterEnum
ALTER TYPE "public"."ActivityType" ADD VALUE 'CLUB_BOOK_STATUS';

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "public"."AchievementCategory" NOT NULL,
    "difficulty" "public"."AchievementDifficulty" NOT NULL DEFAULT 'BRONZE',
    "criteria" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress_data" JSONB,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievement_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "target_value" INTEGER NOT NULL,
    "progress_data" JSONB,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "public"."achievements"("name");

-- CreateIndex
CREATE INDEX "achievements_category_difficulty_idx" ON "public"."achievements"("category", "difficulty");

-- CreateIndex
CREATE INDEX "achievements_is_active_idx" ON "public"."achievements"("is_active");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_earned_at_idx" ON "public"."user_achievements"("user_id", "earned_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "public"."user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "achievement_progress_user_id_idx" ON "public"."achievement_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_progress_user_id_achievement_id_key" ON "public"."achievement_progress"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."achievement_progress" ADD CONSTRAINT "achievement_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."achievement_progress" ADD CONSTRAINT "achievement_progress_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
