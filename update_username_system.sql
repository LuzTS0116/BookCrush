-- Migration: Update Profile table for username-based display system
-- This migration changes display_name to be the unique username and adds full_name for optional real names

BEGIN;

-- Step 1: Add the new full_name column
ALTER TABLE profiles ADD COLUMN full_name TEXT;

-- Step 2: For existing users, move display_name to full_name and create username from it
-- This preserves existing data while transitioning to the new system
UPDATE profiles 
SET full_name = display_name,
    display_name = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(display_name, '[^a-zA-Z0-9 ]', '', 'g'),
        '\s+', '_', 'g'
      )
    )
WHERE full_name IS NULL;

-- Step 3: Handle potential duplicate usernames by appending numbers
WITH ranked_users AS (
  SELECT id, display_name,
         ROW_NUMBER() OVER (PARTITION BY display_name ORDER BY created_at) as rn
  FROM profiles
),
duplicate_updates AS (
  SELECT id, display_name || '_' || rn as new_display_name
  FROM ranked_users
  WHERE rn > 1
)
UPDATE profiles 
SET display_name = duplicate_updates.new_display_name
FROM duplicate_updates
WHERE profiles.id = duplicate_updates.id;

-- Step 4: Remove the old nickname column if it exists
-- Note: Check if this column exists in your current schema before running
-- ALTER TABLE profiles DROP COLUMN IF EXISTS nickname;

-- Step 5: Add unique constraint to display_name (username)
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- Step 6: Add check constraint for username format (optional but recommended)
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_format 
CHECK (display_name ~ '^[a-zA-Z0-9_.-]+$' AND LENGTH(display_name) >= 3);

COMMIT;

-- Note: After running this migration, you should also:
-- 1. Update your Prisma schema (already done above)
-- 2. Run: npx prisma db pull
-- 3. Run: npx prisma generate
-- 4. Test the changes in development first! 