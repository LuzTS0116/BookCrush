-- Create the BookRecommendationStatus enum
CREATE TYPE "public"."BookRecommendationStatus" AS ENUM ('PENDING', 'READ', 'ADDED', 'DISMISSED');

-- Create the book_recommendations table
CREATE TABLE "public"."book_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "note" TEXT,
    "status" "public"."BookRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),
    "responded_at" TIMESTAMPTZ(6),

    CONSTRAINT "book_recommendations_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."book_recommendations" 
ADD CONSTRAINT "book_recommendations_book_id_fkey" 
FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."book_recommendations" 
ADD CONSTRAINT "book_recommendations_from_user_id_fkey" 
FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."book_recommendations" 
ADD CONSTRAINT "book_recommendations_to_user_id_fkey" 
FOREIGN KEY ("to_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint to prevent duplicate recommendations
ALTER TABLE "public"."book_recommendations" 
ADD CONSTRAINT "book_recommendations_book_id_from_user_id_to_user_id_key" 
UNIQUE ("book_id", "from_user_id", "to_user_id");

-- Add indexes for performance
CREATE INDEX "book_recommendations_to_user_id_status_idx" 
ON "public"."book_recommendations"("to_user_id", "status");

CREATE INDEX "book_recommendations_from_user_id_created_at_idx" 
ON "public"."book_recommendations"("from_user_id", "created_at");

-- Update ActivityType enum to include recommendation types
ALTER TYPE "public"."ActivityType" ADD VALUE 'SENT_BOOK_RECOMMENDATION';
ALTER TYPE "public"."ActivityType" ADD VALUE 'RECEIVED_BOOK_RECOMMENDATION';  
ALTER TYPE "public"."ActivityType" ADD VALUE 'ACCEPTED_BOOK_RECOMMENDATION';

-- Update ActivityTargetEntityType enum
ALTER TYPE "public"."ActivityTargetEntityType" ADD VALUE 'BOOK_RECOMMENDATION';

-- Add RLS (Row Level Security) policies for book_recommendations
ALTER TABLE "public"."book_recommendations" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view recommendations they sent or received
CREATE POLICY "Users can view their own recommendations" ON "public"."book_recommendations"
    FOR SELECT USING (
        auth.uid()::text = from_user_id OR 
        auth.uid()::text = to_user_id
    );

-- Policy: Users can create recommendations (must be the sender)
CREATE POLICY "Users can create recommendations" ON "public"."book_recommendations"
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

-- Policy: Users can update recommendations they received (for status changes)
CREATE POLICY "Users can update received recommendations" ON "public"."book_recommendations"
    FOR UPDATE USING (auth.uid()::text = to_user_id);

-- Policy: Users can delete recommendations they sent
CREATE POLICY "Users can delete sent recommendations" ON "public"."book_recommendations"
    FOR DELETE USING (auth.uid()::text = from_user_id); 