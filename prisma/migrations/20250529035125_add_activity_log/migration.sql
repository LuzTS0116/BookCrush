-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('ADDED_BOOK_TO_LIBRARY', 'ADDED_BOOK_TO_SHELF', 'CHANGED_BOOK_STATUS', 'FINISHED_READING_BOOK', 'REVIEWED_BOOK', 'SENT_FRIEND_REQUEST', 'ACCEPTED_FRIEND_REQUEST', 'CREATED_CLUB', 'JOINED_CLUB', 'LEFT_CLUB', 'CLUB_SELECTED_BOOK', 'CLUB_NEW_MEMBER', 'FINISHED_BOOKS_MONTHLY_MILESTONE', 'FRIENDSHIP_ANNIVERSARY');

-- CreateEnum
CREATE TYPE "public"."ActivityTargetEntityType" AS ENUM ('BOOK', 'USER_BOOK', 'PROFILE', 'CLUB', 'FRIEND_REQUEST');

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_type" "public"."ActivityType" NOT NULL,
    "target_entity_type" "public"."ActivityTargetEntityType",
    "target_entity_id" TEXT,
    "target_entity_secondary_id" TEXT,
    "related_user_id" UUID,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_user_id_created_at_idx" ON "public"."activity_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_activity_type_idx" ON "public"."activity_logs"("activity_type");

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
