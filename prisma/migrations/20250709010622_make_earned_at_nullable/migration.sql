-- AlterTable
ALTER TABLE "public"."user_achievements" ALTER COLUMN "earned_at" DROP NOT NULL,
ALTER COLUMN "earned_at" DROP DEFAULT;
