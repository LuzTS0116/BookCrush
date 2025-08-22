// /app/api/clubs/[id]/voting/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ClubRole, ClubMembershipStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for clubs voting API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// POST - Start a new voting cycle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    const { id } = await params;
    
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

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const { voting_starts_at, voting_ends_at } = await request.json();

    if (!voting_starts_at || !voting_ends_at) {
      return NextResponse.json(
        { error: "Voting start and end times are required" },
        { status: 400 }
      );
    }

    // Validate that end time is after start time
    const startDate = new Date(voting_starts_at);
    const endDate = new Date(voting_ends_at);
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "Voting end time must be after start time" },
        { status: 400 }
      );
    }

    // Check if user has admin permissions for this club
    const userMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            owner_id: true,
            current_book_id: true,
            voting_cycle_active: true,
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
    }

    const isAdmin = userMembership.role === ClubRole.OWNER || userMembership.role === ClubRole.ADMIN;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only club admins and owners can manage voting cycles" },
        { status: 403 }
      );
    }

    // Check if club has a current book (voting should only happen when no current book)
    if (userMembership.club.current_book_id) {
      return NextResponse.json(
        { error: "Cannot start voting cycle while a book is currently selected" },
        { status: 400 }
      );
    }

    // Check if a voting cycle is already active
    if (userMembership.club.voting_cycle_active) {
      return NextResponse.json(
        { error: "A voting cycle is already active for this club" },
        { status: 400 }
      );
    }

    // Start the voting cycle
    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        voting_cycle_active: true,
        voting_starts_at: startDate,
        voting_ends_at: endDate,
        voting_started_by: user.id,
      },
      select: {
        id: true,
        voting_cycle_active: true,
        voting_starts_at: true,
        voting_ends_at: true,
        voting_started_by: true,
      }
    });

    return NextResponse.json(updatedClub, { status: 200 });

  } catch (error: any) {
    console.error("Error starting voting cycle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start voting cycle" },
      { status: 500 }
    );
  }
}

// DELETE - End the current voting cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

  try {
    const { id } = await params;
    
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

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    // Check if user has admin permissions for this club
    const userMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            owner_id: true,
            voting_cycle_active: true,
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
    }

    const isAdmin = userMembership.role === ClubRole.OWNER || userMembership.role === ClubRole.ADMIN;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only club admins and owners can manage voting cycles" },
        { status: 403 }
      );
    }

    // Check if a voting cycle is currently active
    if (!userMembership.club.voting_cycle_active) {
      return NextResponse.json(
        { error: "No active voting cycle to end" },
        { status: 400 }
      );
    }

    // Get all active suggestions with their vote counts before ending the cycle
    const suggestions = await prisma.clubBookSuggestion.findMany({
      where: {
        club_id: id,
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

    // End the voting cycle and update suggestion statuses in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // End the voting cycle
      const updatedClub = await tx.club.update({
        where: { id },
        data: {
          voting_cycle_active: false,
          voting_starts_at: null,
          voting_ends_at: null,
          voting_started_by: null,
        },
        select: {
          id: true,
          voting_cycle_active: true,
          voting_starts_at: true,
          voting_ends_at: true,
          voting_started_by: true,
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
            club_id: id,
            status: 'ACTIVE',
            id: { notIn: winningBooks.map(book => book.id) }
          },
          data: { status: 'REJECTED' }
        });
      } else {
        // No votes - mark all as EXPIRED
        await tx.clubBookSuggestion.updateMany({
          where: {
            club_id: id,
            status: 'ACTIVE'
          },
          data: { status: 'EXPIRED' }
        });
      }

      return { club: updatedClub, winningBooks };
    });

    return NextResponse.json({
      club: {
        ...result.club,
        winning_book_suggestions: result.winningBooks.map(book => ({
          id: book.id,
          vote_count: book.vote_count,
          book: {
            id: book.book.id,
            title: book.book.title,
            author: book.book.author,
            cover_url: book.book.cover_url
          }
        }))
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error ending voting cycle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to end voting cycle" },
      { status: 500 }
    );
  }
} 