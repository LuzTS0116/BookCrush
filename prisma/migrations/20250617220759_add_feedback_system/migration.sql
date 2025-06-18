-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK', 'COMPLAINT', 'COMPLIMENT');

-- CreateEnum
CREATE TYPE "public"."FeedbackStatus" AS ENUM ('PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "public"."FeedbackType" NOT NULL DEFAULT 'GENERAL_FEEDBACK',
    "content" TEXT NOT NULL,
    "status" "public"."FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_user_id_created_at_idx" ON "public"."feedback"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "public"."feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "public"."feedback"("type");

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
