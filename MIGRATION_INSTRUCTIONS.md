# Database Migration Instructions

## Step 1: Generate and Apply Prisma Migration

Run the following commands to update your database with the new `rating` and `discussion_notes` fields:

```bash
# Generate a new migration
npx prisma migrate dev --name add_rating_discussion_notes_to_club_books

# This will:
# 1. Generate the migration SQL file
# 2. Apply it to your database
# 3. Regenerate the Prisma client
```

## Step 2: Alternative - Manual Database Update (if needed)

If you prefer to apply the migration manually, you can run this SQL:

```sql
-- Add rating and discussion_notes fields to club_books table
ALTER TABLE public.club_books 
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN discussion_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.club_books.rating IS '1-5 star rating for the book from club meeting';
COMMENT ON COLUMN public.club_books.discussion_notes IS 'Meeting discussion notes when book was completed';
```

Then regenerate the Prisma client:

```bash
npx prisma generate
```

## Step 3: Verify the Changes

After running the migration, you should be able to:

1. **Complete books** with rating (1-5 stars) and discussion notes
2. **Mark books as not completed** with reason and explanation notes
3. **View book history** with ratings and notes displayed

## Features Added

### ✅ Complete Meeting Button
- Functional rating dropdown (1-5 stars)
- Required discussion notes textarea
- Moves current book to history with COMPLETED status
- Clears current book from club

### ✅ Book Not Completed Button  
- Functional reason dropdown (10 predefined reasons)
- Required explanation notes textarea
- Moves current book to history with ABANDONED status
- Combines reason and notes in discussion_notes field
- Clears current book from club

### ✅ Enhanced Book History
- Shows club rating for completed books
- Shows discussion notes/reasons for all books
- Proper status badges (completed/not completed)

## Troubleshooting

If you encounter TypeScript/Prisma errors:

1. Ensure the migration was applied: `npx prisma db push` (if migrate doesn't work)
2. Regenerate client: `npx prisma generate`
3. Restart your development server 