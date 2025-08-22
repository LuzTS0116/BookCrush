import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for clubs voting select winner API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    // Bearer token authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }

    const { id: clubId } = await params;
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Check if user is admin/owner of the club
    const club = await prisma.club.findFirst({
      where: {
        id: clubId,
        OR: [
          { owner_id: user.id },
          {
            memberships: {
              some: {
                user_id: user.id,
                role: 'ADMIN',
                status: 'ACTIVE'
              }
            }
          }
        ]
      }
    });

    if (!club) {
      return NextResponse.json({ error: "Not authorized to manage this club" }, { status: 403 });
    }

    // Check if the book exists and was a suggestion for this club
    const suggestion = await prisma.clubBookSuggestion.findFirst({
      where: {
        club_id: clubId,
        book_id: bookId,
        status: 'ACTIVE' // Only winning books should still be ACTIVE
      },
      include: {
        book: true
      }
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Book suggestion not found or not eligible for selection" }, { status: 404 });
    }

    // Check if club already has a current book
    if (club.current_book_id) {
      return NextResponse.json({ error: "Club already has a current book" }, { status: 400 });
    }

    // Set the book as current book and update suggestion status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Set the book as current book
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: {
          current_book_id: bookId
        },
        include: {
          current_book: true
        }
      });

      // Mark the selected suggestion as SELECTED
      await tx.clubBookSuggestion.update({
        where: { id: suggestion.id },
        data: { status: 'SELECTED' }
      });

      // Mark all other remaining ACTIVE suggestions as REJECTED
      await tx.clubBookSuggestion.updateMany({
        where: {
          club_id: clubId,
          status: 'ACTIVE',
          id: { not: suggestion.id }
        },
        data: { status: 'REJECTED' }
      });

      // Create a new club book history entry
      await tx.clubBook.create({
        data: {
          club_id: clubId,
          book_id: bookId,
          started_at: new Date(),
          status: 'IN_PROGRESS'
        }
      });

      return updatedClub;
    });

    return NextResponse.json({
      message: 'Book selected as current book successfully',
      club: {
        ...result,
        winning_book_suggestions: [] // Clear winning suggestions after selection
      },
      selectedBook: suggestion.book
    });

  } catch (error) {
    console.error('Error selecting winning book:', error);
    return NextResponse.json(
      { error: 'Failed to select winning book' },
      { status: 500 }
    );
  }
} 