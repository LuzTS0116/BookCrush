-- AlterTable
ALTER TABLE "public"."club_meeting_attendees" 
ADD COLUMN "actually_attended" BOOLEAN,
ADD COLUMN "marked_at" TIMESTAMPTZ(6); 