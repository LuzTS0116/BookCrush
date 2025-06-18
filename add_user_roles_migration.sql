-- Migration to add user roles
-- Run this after updating your Prisma schema

-- Create the UserRole enum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- Add role column to profiles table with default value
ALTER TABLE "public"."profiles" 
ADD COLUMN "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- Create an index on the role column for better query performance
CREATE INDEX "profiles_role_idx" ON "public"."profiles"("role");

-- Optional: Update specific users to admin roles
-- Replace 'user-id-here' with actual user IDs you want to make admins
-- UPDATE "public"."profiles" SET "role" = 'ADMIN' WHERE "id" = 'user-id-here';
-- UPDATE "public"."profiles" SET "role" = 'SUPER_ADMIN' WHERE "id" = 'user-id-here'; 