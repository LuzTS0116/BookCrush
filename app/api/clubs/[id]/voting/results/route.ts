import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for clubs voting results API.");
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
      return NextResponse.json({ error: "Not authorized to manage this club's voting" }, { status: 403 });
    }

    // Check if voting cycle has expired
    const now = new Date();
    if (!club.voting_cycle_active || !club.voting_ends_at || club.voting_ends_at > now) {
      return NextResponse.json({ error: "Voting cycle is not expired" }, { status: 400 });
    }

    // Get all active suggestions with their vote counts
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
            pages: true,
            genres: true
          }
        },
        suggested_by_user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        },
        votes: true
      }
    });

    // Calculate vote counts and find winners
    const suggestionsWithVotes = suggestions.map(suggestion => ({
      ...suggestion,
      vote_count: suggestion.votes.length
    }));

    // Find the highest vote count
    const maxVotes = Math.max(...suggestionsWithVotes.map(s => s.vote_count), 0);
    
    // Get all suggestions with the highest vote count (in case of tie)
    const winningBooks = suggestionsWithVotes.filter(s => s.vote_count === maxVotes && maxVotes > 0);

    // Update voting cycle status and suggestion statuses in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // End the voting cycle
      const updatedClub = await tx.club.update({
        where: { id: clubId },
        data: {
          voting_cycle_active: false,
          voting_ends_at: null,
          voting_starts_at: null,
          voting_started_by: null
        }
      });

      // Update suggestion statuses
      if (winningBooks.length > 0) {
        // Mark winning suggestions as ACTIVE (they remain selectable)
        await tx.clubBookSuggestion.updateMany({
          where: {
            id: { in: winningBooks.map(book => book.id) }
          },
          data: { status: 'ACTIVE' } // Keep as ACTIVE for selection
        });

        // Mark all other suggestions as REJECTED
        await tx.clubBookSuggestion.updateMany({
          where: {
            club_id: clubId,
            status: 'ACTIVE',
            id: { notIn: winningBooks.map(book => book.id) }
          },
          data: { status: 'REJECTED' }
        });
      } else {
        // No votes - mark all as EXPIRED
        await tx.clubBookSuggestion.updateMany({
          where: {
            club_id: clubId,
            status: 'ACTIVE'
          },
          data: { status: 'EXPIRED' }
        });
      }

      return { club: updatedClub, winningBooks };
    });

    return NextResponse.json({
      message: 'Voting cycle processed successfully',
      club: result.club,
      winningBooks: result.winningBooks,
      totalSuggestions: suggestions.length,
      maxVotes
    });

  } catch (error) {
    console.error('Error processing voting results:', error);
    return NextResponse.json(
      { error: 'Failed to process voting results' },
      { status: 500 }
    );
  }
} 