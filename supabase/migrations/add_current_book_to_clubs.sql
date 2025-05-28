-- Add current_book_id column to clubs table
ALTER TABLE "public"."clubs"
ADD COLUMN "current_book_id" UUID REFERENCES "public"."books"("id") ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX "clubs_current_book_id_idx" ON "public"."clubs"("current_book_id");

-- Update RLS policies for clubs table to handle current_book_id

-- Policy for viewing current book (follows same rules as viewing clubs)
CREATE POLICY "View club current book"
    ON "public"."clubs"
    FOR SELECT
    USING (
        (NOT is_private)
        OR 
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = clubs.id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
        )
    );

-- Policy for setting current book (only owners and admins)
CREATE POLICY "Set club current book"
    ON "public"."clubs"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = clubs.id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = clubs.id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    );

-- Add comment to the column
COMMENT ON COLUMN "public"."clubs"."current_book_id" IS 'The current book being read by the club'; 