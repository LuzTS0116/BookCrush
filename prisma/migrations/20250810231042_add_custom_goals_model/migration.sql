-- CreateEnum
CREATE TYPE "public"."CustomGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CustomGoalPeriod" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR');

-- CreateTable
CREATE TABLE "public"."custom_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_books" INTEGER NOT NULL,
    "time_period" "public"."CustomGoalPeriod" NOT NULL,
    "status" "public"."CustomGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "custom_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_goals_user_id_status_idx" ON "public"."custom_goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "custom_goals_user_id_end_date_idx" ON "public"."custom_goals"("user_id", "end_date");

-- AddForeignKey
ALTER TABLE "public"."custom_goals" ADD CONSTRAINT "custom_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
