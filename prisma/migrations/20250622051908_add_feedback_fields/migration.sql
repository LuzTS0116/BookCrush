-- AlterTable
ALTER TABLE "public"."feedback" ADD COLUMN     "admin_replied_at" TIMESTAMPTZ(6),
ADD COLUMN     "user_notified" BOOLEAN NOT NULL DEFAULT false;
