-- CreateEnum
CREATE TYPE "public"."ClubBookSuggestionStatus" AS ENUM ('ACTIVE', 'SELECTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."club_book_suggestions" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "suggested_by" UUID NOT NULL,
    "reason" TEXT,
    "status" "public"."ClubBookSuggestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "voting_ends" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "club_book_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."club_book_suggestion_votes" (
    "id" UUID NOT NULL,
    "suggestion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_book_suggestion_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_book_suggestions_club_id_status_idx" ON "public"."club_book_suggestions"("club_id", "status");

-- CreateIndex
CREATE INDEX "club_book_suggestions_club_id_created_at_idx" ON "public"."club_book_suggestions"("club_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "club_book_suggestions_club_id_book_id_key" ON "public"."club_book_suggestions"("club_id", "book_id");

-- CreateIndex
CREATE INDEX "club_book_suggestion_votes_suggestion_id_idx" ON "public"."club_book_suggestion_votes"("suggestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_book_suggestion_votes_suggestion_id_user_id_key" ON "public"."club_book_suggestion_votes"("suggestion_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."club_book_suggestions" ADD CONSTRAINT "club_book_suggestions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_book_suggestions" ADD CONSTRAINT "club_book_suggestions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_book_suggestions" ADD CONSTRAINT "club_book_suggestions_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_book_suggestion_votes" ADD CONSTRAINT "club_book_suggestion_votes_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "public"."club_book_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_book_suggestion_votes" ADD CONSTRAINT "club_book_suggestion_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
