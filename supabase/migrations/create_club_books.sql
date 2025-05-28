-- Create ClubBookStatus enum
CREATE TYPE "public"."club_book_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- Create club_books table
CREATE TABLE "public"."club_books" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "finished_at" TIMESTAMPTZ,
    "status" club_book_status NOT NULL DEFAULT 'IN_PROGRESS',
    
    CONSTRAINT "club_books_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "club_books_club_id_fkey" FOREIGN KEY ("club_id") 
        REFERENCES "public"."clubs"("id") ON DELETE CASCADE,
    CONSTRAINT "club_books_book_id_fkey" FOREIGN KEY ("book_id") 
        REFERENCES "public"."books"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "club_books_club_id_idx" ON "public"."club_books"("club_id");
CREATE INDEX "club_books_book_id_idx" ON "public"."club_books"("book_id");

-- Enable Row Level Security
ALTER TABLE "public"."club_books" ENABLE ROW LEVEL SECURITY;

-- Create policies for club_books

-- Policy for viewing club books (members can view)
CREATE POLICY "View club books"
    ON "public"."club_books"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = club_books.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
        )
        OR 
        EXISTS (
            SELECT 1 FROM "public"."clubs" c
            WHERE c.id = club_books.club_id
            AND c.is_private = false
        )
    );

-- Policy for inserting club books (only club owners and admins)
CREATE POLICY "Insert club books"
    ON "public"."club_books"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = club_books.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    );

-- Policy for updating club books (only club owners and admins)
CREATE POLICY "Update club books"
    ON "public"."club_books"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = club_books.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = club_books.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    );

-- Policy for deleting club books (only club owners and admins)
CREATE POLICY "Delete club books"
    ON "public"."club_books"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."club_memberships" cm
            WHERE cm.club_id = club_books.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'ACTIVE'
            AND (cm.role = 'OWNER' OR cm.role = 'ADMIN')
        )
    );

-- Add comment to the table
COMMENT ON TABLE "public"."club_books" IS 'Tracks the history of books read in book clubs'; 