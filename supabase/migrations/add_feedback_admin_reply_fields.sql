-- Migration to add admin reply fields to feedback table
-- This enables tracking when admins reply to feedback and whether users have been notified

-- Add new columns to feedback table
ALTER TABLE "public"."feedback" 
ADD COLUMN "admin_replied_at" TIMESTAMPTZ,
ADD COLUMN "user_notified" BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN "public"."feedback"."admin_replied_at" IS 'Timestamp when admin replied to the feedback';
COMMENT ON COLUMN "public"."feedback"."user_notified" IS 'Whether user has been notified of admin reply';

-- Create index for efficient querying of unnotified feedback
CREATE INDEX IF NOT EXISTS "idx_feedback_user_notified" ON "public"."feedback" ("user_id", "user_notified") WHERE "admin_notes" IS NOT NULL;

-- Create index for admin replied feedback
CREATE INDEX IF NOT EXISTS "idx_feedback_admin_replied" ON "public"."feedback" ("admin_replied_at") WHERE "admin_replied_at" IS NOT NULL; 