/*
  Warnings:

  - You are about to drop the column `voting_ends` on the `club_book_suggestions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."club_book_suggestions" DROP COLUMN "voting_ends";

-- AlterTable
ALTER TABLE "public"."clubs" ADD COLUMN     "voting_cycle_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voting_ends_at" TIMESTAMPTZ(6),
ADD COLUMN     "voting_started_by" UUID,
ADD COLUMN     "voting_starts_at" TIMESTAMPTZ(6);

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_voting_started_by_fkey" FOREIGN KEY ("voting_started_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
