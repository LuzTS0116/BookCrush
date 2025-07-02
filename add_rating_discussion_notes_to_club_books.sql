-- Migration: Add rating and discussion_notes fields to club_books table
-- This allows clubs to store meeting ratings and discussion notes when completing books

ALTER TABLE public.club_books 
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN discussion_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.club_books.rating IS '1-5 star rating for the book from club meeting';
COMMENT ON COLUMN public.club_books.discussion_notes IS 'Meeting discussion notes when book was completed'; 