import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const clubId = params.id;

    // Verify user is a member of the club
    const membership = await prisma.clubMembership.findFirst({
      where: {
        club_id: clubId,
        user_id: user.id,
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied. You must be a member of this club." }, { status: 403 });
    }

    // Get all active suggestions for the club with vote counts and user vote status
    const suggestions = await prisma.clubBookSuggestion.findMany({
      where: {
        club_id: clubId,
        status: 'ACTIVE'
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true,
            genres: true,
            pages: true,
            published_date: true
          }
        },
        suggested_by_user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the data to include vote counts and user's vote status
    const formattedSuggestions = suggestions.map(suggestion => ({
      id: suggestion.id,
      book: suggestion.book,
      suggested_by: suggestion.suggested_by_user,
      reason: suggestion.reason,
      vote_count: suggestion.votes.length,
      has_voted: suggestion.votes.some(vote => vote.user.id === user.id),
      voting_ends: suggestion.voting_ends,
      created_at: suggestion.created_at
    }));

    return NextResponse.json(formattedSuggestions);

  } catch (error: any) {
    console.error("Error fetching club suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}

// POST - Create a new book suggestion
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const clubId = params.id;
    const { book_id, reason } = await req.json();

    if (!book_id) {
      return NextResponse.json({ error: "book_id is required" }, { status: 400 });
    }

    // Verify user is a member of the club
    const membership = await prisma.clubMembership.findFirst({
      where: {
        club_id: clubId,
        user_id: user.id,
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied. You must be a member of this club." }, { status: 403 });
    }

    // Check if book is already suggested for this club
    const existingSuggestion = await prisma.clubBookSuggestion.findFirst({
      where: {
        club_id: clubId,
        book_id: book_id,
        status: 'ACTIVE'
      }
    });

    if (existingSuggestion) {
      return NextResponse.json({ error: "This book has already been suggested for this club" }, { status: 409 });
    }

    // Check if user has reached suggestion limit (optional - e.g., 2 suggestions per cycle)
    const userActiveSuggestions = await prisma.clubBookSuggestion.count({
      where: {
        club_id: clubId,
        suggested_by: user.id,
        status: 'ACTIVE'
      }
    });

    const MAX_SUGGESTIONS_PER_USER = 2;
    if (userActiveSuggestions >= MAX_SUGGESTIONS_PER_USER) {
      return NextResponse.json({ 
        error: `You can only suggest up to ${MAX_SUGGESTIONS_PER_USER} books per voting cycle` 
      }, { status: 403 });
    }

    // Create the suggestion (voting ends in 14 days by default)
    const votingEnds = new Date();
    votingEnds.setDate(votingEnds.getDate() + 14);

    const suggestion = await prisma.clubBookSuggestion.create({
      data: {
        club_id: clubId,
        book_id: book_id,
        suggested_by: user.id,
        reason: reason || null,
        voting_ends: votingEnds
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            cover_url: true,
            genres: true,
            pages: true,
            published_date: true
          }
        },
        suggested_by_user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    return NextResponse.json({
      id: suggestion.id,
      book: suggestion.book,
      suggested_by: suggestion.suggested_by_user,
      reason: suggestion.reason,
      vote_count: 0,
      has_voted: false,
      voting_ends: suggestion.voting_ends,
      created_at: suggestion.created_at
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating suggestion:", error);
    return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 });
  }
} 