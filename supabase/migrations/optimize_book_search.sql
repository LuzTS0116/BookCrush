-- First, enable the pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Then add indexes for book search optimization
CREATE INDEX IF NOT EXISTS idx_books_title ON "public"."books" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author ON "public"."books" USING gin (author gin_trgm_ops);

-- Add RLS policies for book search
ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;

-- Policy for viewing books (everyone can search/view books)
CREATE POLICY "Allow book viewing"
    ON "public"."books"
    FOR SELECT
    USING (true);

-- Add comment to explain the indexes
COMMENT ON INDEX "public"."idx_books_title" IS 'Trigram index for fast book title search';
COMMENT ON INDEX "public"."idx_books_author" IS 'Trigram index for fast book author search'; 