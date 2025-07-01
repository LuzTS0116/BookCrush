import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';

// POST - Vote for a suggestion
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, suggestionId: string }> }) {
  try {
    const { id, suggestionId } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const clubId = id;

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

    // Verify the suggestion exists and is active
    const suggestion = await prisma.clubBookSuggestion.findFirst({
      where: {
        id: suggestionId,
        club_id: clubId,
        status: 'ACTIVE'
      }
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found or voting has ended" }, { status: 404 });
    }

    // Check if voting period has ended
    if (suggestion.voting_ends && new Date() > suggestion.voting_ends) {
      return NextResponse.json({ error: "Voting period has ended" }, { status: 400 });
    }

    // Check if user has already voted for this suggestion
    const existingVote = await prisma.clubBookSuggestionVote.findFirst({
      where: {
        suggestion_id: suggestionId,
        user_id: user.id
      }
    });

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted for this suggestion" }, { status: 409 });
    }

    // Create the vote
    await prisma.clubBookSuggestionVote.create({
      data: {
        suggestion_id: suggestionId,
        user_id: user.id
      }
    });

    // Get updated vote count
    const voteCount = await prisma.clubBookSuggestionVote.count({
      where: {
        suggestion_id: suggestionId
      }
    });

    return NextResponse.json({ 
      message: "Vote recorded successfully",
      vote_count: voteCount
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error voting on suggestion:", error);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}

// DELETE - Remove vote for a suggestion
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, suggestionId: string }> }) {
  try {
    const { id, suggestionId } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const clubId = id;

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

    // Find the user's vote
    const existingVote = await prisma.clubBookSuggestionVote.findFirst({
      where: {
        suggestion_id: suggestionId,
        user_id: user.id
      }
    });

    if (!existingVote) {
      return NextResponse.json({ error: "You haven't voted for this suggestion" }, { status: 404 });
    }

    // Remove the vote
    await prisma.clubBookSuggestionVote.delete({
      where: {
        id: existingVote.id
      }
    });

    // Get updated vote count
    const voteCount = await prisma.clubBookSuggestionVote.count({
      where: {
        suggestion_id: suggestionId
      }
    });

    return NextResponse.json({ 
      message: "Vote removed successfully",
      vote_count: voteCount
    });

  } catch (error: any) {
    console.error("Error removing vote:", error);
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 });
  }
} 