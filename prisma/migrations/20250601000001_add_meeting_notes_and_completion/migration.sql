-- AlterTable
ALTER TABLE "public"."club_meetings" 
ADD COLUMN "meeting_notes" TEXT,
ADD COLUMN "completed_at" TIMESTAMPTZ(6); 