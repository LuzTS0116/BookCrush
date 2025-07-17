-- CreateEnum
CREATE TYPE "public"."ClubMeetingMode" AS ENUM ('IN_PERSON', 'VIRTUAL');

-- AlterTable
ALTER TABLE "public"."club_meetings" ADD COLUMN     "meeting_mode" "public"."ClubMeetingMode" NOT NULL DEFAULT 'IN_PERSON';
