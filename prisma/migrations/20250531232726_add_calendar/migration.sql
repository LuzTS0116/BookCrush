-- CreateEnum
CREATE TYPE "public"."ClubMeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ClubMeetingType" AS ENUM ('DISCUSSION', 'BOOK_SELECTION', 'AUTHOR_QA', 'SOCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ClubMeetingAttendeeStatus" AS ENUM ('NOT_RESPONDED', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE');

-- CreateTable
CREATE TABLE "public"."club_meetings" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "book_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meeting_date" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER DEFAULT 90,
    "location" TEXT,
    "meeting_type" "public"."ClubMeetingType" NOT NULL DEFAULT 'DISCUSSION',
    "status" "public"."ClubMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "club_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."club_meeting_attendees" (
    "id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "public"."ClubMeetingAttendeeStatus" NOT NULL DEFAULT 'NOT_RESPONDED',
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_meeting_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_meeting_attendees_meeting_id_user_id_key" ON "public"."club_meeting_attendees"("meeting_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."club_meetings" ADD CONSTRAINT "club_meetings_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_meetings" ADD CONSTRAINT "club_meetings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_meetings" ADD CONSTRAINT "club_meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_meeting_attendees" ADD CONSTRAINT "club_meeting_attendees_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."club_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_meeting_attendees" ADD CONSTRAINT "club_meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
