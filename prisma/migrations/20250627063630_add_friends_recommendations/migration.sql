-- CreateEnum
CREATE TYPE "public"."BookRecommendationStatus" AS ENUM ('PENDING', 'READ', 'ADDED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "public"."ActivityTargetEntityType" ADD VALUE 'BOOK_RECOMMENDATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActivityType" ADD VALUE 'SENT_BOOK_RECOMMENDATION';
ALTER TYPE "public"."ActivityType" ADD VALUE 'RECEIVED_BOOK_RECOMMENDATION';
ALTER TYPE "public"."ActivityType" ADD VALUE 'ACCEPTED_BOOK_RECOMMENDATION';

-- CreateTable
CREATE TABLE "public"."book_recommendations" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "note" TEXT,
    "status" "public"."BookRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),
    "responded_at" TIMESTAMPTZ(6),

    CONSTRAINT "book_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_recommendations_to_user_id_status_idx" ON "public"."book_recommendations"("to_user_id", "status");

-- CreateIndex
CREATE INDEX "book_recommendations_from_user_id_created_at_idx" ON "public"."book_recommendations"("from_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "book_recommendations_book_id_from_user_id_to_user_id_key" ON "public"."book_recommendations"("book_id", "from_user_id", "to_user_id");

-- AddForeignKey
ALTER TABLE "public"."book_recommendations" ADD CONSTRAINT "book_recommendations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_recommendations" ADD CONSTRAINT "book_recommendations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_recommendations" ADD CONSTRAINT "book_recommendations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
