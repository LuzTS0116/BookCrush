-- Migration to create custom_goals table and migrate existing data
-- Run this manually in your database

-- Create the new custom goals table
CREATE TYPE "public"."CustomGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "public"."CustomGoalPeriod" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR');

CREATE TABLE "public"."custom_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_books" INTEGER NOT NULL,
    "time_period" "public"."CustomGoalPeriod" NOT NULL,
    "status" "public"."CustomGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_goals_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "public"."custom_goals" ADD CONSTRAINT "custom_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "custom_goals_user_id_status_idx" ON "public"."custom_goals"("user_id", "status");
CREATE INDEX "custom_goals_user_id_end_date_idx" ON "public"."custom_goals"("user_id", "end_date");

-- Migrate existing custom goals data from the Achievement system
-- This will convert existing "Custom Goal:" achievements to the new custom_goals table
INSERT INTO "public"."custom_goals" (
    "user_id",
    "name",
    "description", 
    "target_books",
    "time_period",
    "status",
    "current_progress",
    "start_date",
    "end_date",
    "completed_at",
    "created_at"
)
SELECT 
    ap.user_id,
    REPLACE(a.name, 'Custom Goal: ', '') as name,
    a.description,
    ap.target_value as target_books,
    CASE 
        WHEN (a.criteria::json->>'time_period') = '1_month' THEN 'ONE_MONTH'::CustomGoalPeriod
        WHEN (a.criteria::json->>'time_period') = '3_months' THEN 'THREE_MONTHS'::CustomGoalPeriod
        WHEN (a.criteria::json->>'time_period') = '6_months' THEN 'SIX_MONTHS'::CustomGoalPeriod
        WHEN (a.criteria::json->>'time_period') = '1_year' THEN 'ONE_YEAR'::CustomGoalPeriod
        ELSE 'ONE_MONTH'::CustomGoalPeriod
    END as time_period,
    CASE 
        WHEN ua.earned_at IS NOT NULL THEN 'COMPLETED'::CustomGoalStatus
        WHEN (ap.progress_data::json->>'end_date')::timestamp < NOW() THEN 'EXPIRED'::CustomGoalStatus
        ELSE 'ACTIVE'::CustomGoalStatus
    END as status,
    ap.current_value as current_progress,
    COALESCE(
        (ap.progress_data::json->>'start_date')::timestamp,
        (a.criteria::json->>'start_date')::timestamp,
        a.created_at
    ) as start_date,
    COALESCE(
        (ap.progress_data::json->>'end_date')::timestamp,
        (a.criteria::json->>'end_date')::timestamp,
        a.created_at + INTERVAL '30 days'
    ) as end_date,
    ua.earned_at as completed_at,
    a.created_at
FROM achievements a
INNER JOIN achievement_progress ap ON a.id = ap.achievement_id
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ap.user_id = ua.user_id
WHERE a.name LIKE 'Custom Goal:%'
ORDER BY a.created_at;

-- Optional: Add the relation to the profiles table (you'll need to update the Prisma schema too)
-- ALTER TABLE "public"."profiles" ADD custom_goals_relation (handled by Prisma);

-- Clean up old data (OPTIONAL - only run this after confirming the migration worked)
-- WARNING: This will delete the old custom goals data - make sure to backup first
/*
DELETE FROM achievement_progress 
WHERE achievement_id IN (
    SELECT id FROM achievements WHERE name LIKE 'Custom Goal:%'
);

DELETE FROM user_achievements 
WHERE achievement_id IN (
    SELECT id FROM achievements WHERE name LIKE 'Custom Goal:%'
);

DELETE FROM achievements WHERE name LIKE 'Custom Goal:%';
*/

-- Verify the migration
SELECT 
    COUNT(*) as total_custom_goals,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_goals,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_goals,
    COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_goals
FROM custom_goals;

-- Show sample data
SELECT 
    cg.name,
    cg.target_books,
    cg.current_progress,
    cg.status,
    cg.time_period,
    p.display_name as user_name
FROM custom_goals cg
LEFT JOIN profiles p ON cg.user_id = p.id
ORDER BY cg.created_at DESC
LIMIT 10; 