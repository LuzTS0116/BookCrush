// /app/api/clubs/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import {  ClubRole, ClubMembershipStatus  } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';
import {createClient} from '@/utils/supabase/server'





export async function GET(
  request: Request,
   { params }: { params: Promise<{ id: string }> }
) {
  
  const supabase =  await createClient();

   const {id} = await params; 

   if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }
  
  try {

    
     
     const { data: { user }, error: userError } = await supabase.auth.getUser();
 
     if (userError || !user) {
       console.error('[Clubs GET] Auth error:', userError);
       return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
     }

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

   

    // Although authentication is not strictly required to *view* a public club,
    // it's required to determine the user's specific membership status and admin rights.
    // If not authenticated, we'll return a basic club view without user-specific data.
    const isAuthenticated = !!user;
    let currentUserMembershipStatus: ClubMembershipStatus | null = null;
    let currentUserIsAdmin = false;
    let pendingMemberships: any[] = []; // Initialize as empty, fetch only if admin
    let bookIdForDiscussions: string | null = null;
    let discussions: any[] | null = null;
    let winningBookSuggestions: any[] = []; // For expired voting cycles

    
        // 1. Fetch the main club details
    const club = await prisma.club.findUnique({
      where: { id: id },
      include: {
        current_book: { // Include user details of the applicant
          select: {
            author: true,
            cover_url: true,
            description: true,
            id: true,
            title: true,
            genres: true,
            reading_time: true,
            pages: true,
            
            //name: true, // Assuming your User model has a 'name' field
          },
        },
        book_history: {
          where: {
            status: {
              in: ['COMPLETED', 'ABANDONED']
            }
          },
          select: {
            id: true,
            status: true,
            started_at: true,
            finished_at: true,
            rating: true,
            discussion_notes: true,
            book: true,
          },
          orderBy: {
            finished_at: 'desc'
          }
        },
        memberships: {
          select: {
            id: true,
            status: true,
            user_id: true,
            role: true,
            joined_at: true,
            user: {        // Keep user for display_name, avatar_url
              select: {
                id: true,
                display_name: true,
                avatar_url: true, // Add if you have this on your Profile model
              }
            } 
          },
        },
        // Show all non-completed meetings (regardless of date)
        meetings: {
          where: {
            status: {
              not: 'COMPLETED'
            }
          },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                cover_url: true
              }
            },
            creator: {
              select: {
                id: true,
                display_name: true
              }
            },
            attendees: {
              include: {
                user: {
                  select: {
                    id: true,
                    display_name: true
                  }
                }
              }
            },
            _count: {
              select: {
                attendees: true
              }
            }
          },
          orderBy: { meeting_date: 'asc' }
        }
        
      },
    });
    
    if(club){
      bookIdForDiscussions = club.current_book_id || null;
    
      if(bookIdForDiscussions){
        const rawDiscussions = await prisma.clubDiscussion.findMany({
          where: {
            club_id: id,
            book_id: bookIdForDiscussions,
            parent_discussion_id: null,
          },
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                avatar_url: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
              orderBy: { created_at: 'asc' },
            },
          },
          orderBy: { created_at: 'desc' },
        });

        // Format discussions with proper avatar URLs
        discussions = await Promise.all(rawDiscussions.map(async (discussion) => ({
          ...discussion,
          user: {
            ...discussion.user,
            avatar_url: await getAvatarPublicUrlServer(supabase!, discussion.user.avatar_url)
          },
          replies: await Promise.all(discussion.replies.map(async (reply) => ({
            ...reply,
            user: {
              ...reply.user,
              avatar_url: await getAvatarPublicUrlServer(supabase!, reply.user.avatar_url)
            }
          })))
        })));
      }
    }
    
    
    



    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }



    // 2. If authenticated, determine current user's membership status and role for THIS club
    if (isAuthenticated && user) {
      const userClubMembership = await prisma.clubMembership.findUnique({
        where: {
          user_id_club_id: {
            user_id: user.id,
            club_id: id,
          },
        },
        select: {
          status: true,
          role: true,
        },
      });

      if (userClubMembership) {
        currentUserMembershipStatus = userClubMembership.status;
        currentUserIsAdmin =
          userClubMembership.role === ClubRole.OWNER ||
          userClubMembership.role === ClubRole.ADMIN;
      }
    }

    // 3. If current user is an admin, fetch pending memberships for this club
    if (currentUserIsAdmin) {
      const pending = await prisma.clubMembership.findMany({
        where: {
          club_id: id,
          status: ClubMembershipStatus.PENDING,
        },
        include: {
          user: { // Include user details of the applicant
            select: {
              id: true,
              email: true,
              display_name: true,
            },
          },
        },
      });

      pendingMemberships = pending.map(m => ({
        id: m.id,
        userId: m.user.id,
        userName: m.user.display_name || m.user.email, // Fallback to email if no name
        userAvatar: null, // Replace with actual avatar URL from user if available in your User model
        userInitials: (m.user.display_name ? m.user.display_name.split(' ').map(n => n[0]).join('') : m.user.email?.substring(0, 2) || '??').toUpperCase(),
        appliedAt: m.joined_at.toISOString(),
        status: m.status,
      }));
    }

    // Format memberships with proper avatar URLs
    const formattedMemberships = await Promise.all(club.memberships.map(async (membership) => ({
      ...membership,
      user: {
        ...membership.user,
        avatar_url: await getAvatarPublicUrlServer(supabase!, membership.user.avatar_url)
      }
    })));

    // Check for winning books that need to be displayed
    // This includes: 1) Expired voting cycles, 2) Recently ended voting cycles with pending winners
    const shouldFetchWinningBooks = (
      // Case 1: Voting cycle is active but expired
      (club.voting_cycle_active && club.voting_ends_at && new Date(club.voting_ends_at) <= new Date()) ||
      // Case 2: No current book and there are ACTIVE suggestions (from recently ended voting)
      (!club.current_book_id && !club.voting_cycle_active)
    );

    if (shouldFetchWinningBooks) {
      console.log(`[Club ${id}] Fetching winning books...`);
      
      // Fetch winning books from ACTIVE suggestions (these are the winners from voting)
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
          votes: true
        }
      });

      console.log(`[Club ${id}] Found ${suggestions.length} ACTIVE suggestions`);

      // Only show as winning books if there are ACTIVE suggestions with votes
      if (suggestions.length > 0) {
        // Calculate vote counts
        const suggestionsWithVotes = suggestions.map(suggestion => ({
          ...suggestion,
          vote_count: suggestion.votes.length
        }));

        // Find the highest vote count
        const maxVotes = Math.max(...suggestionsWithVotes.map(s => s.vote_count), 0);
        
        // Get all suggestions with the highest vote count (in case of tie)
        if (maxVotes > 0) {
          winningBookSuggestions = suggestionsWithVotes
            .filter(s => s.vote_count === maxVotes)
            .map(suggestion => ({
              id: suggestion.id,
              vote_count: suggestion.vote_count,
              book: {
                id: suggestion.book.id,
                title: suggestion.book.title,
                author: suggestion.book.author,
                cover_url: suggestion.book.cover_url
              }
            }));
        }
      }
    }

    console.log(`[Club ${id}] Final winning books count: ${winningBookSuggestions.length}`);

    // 4. Construct the full club details response
    const fullClubDetails = {
      id: club.id,
      name: club.name,
      description: club.description,
      genres: club.genres || [],
      memberCount: club.memberCount,
      owner_id: club.owner_id, // Club owner's ID
      memberships: formattedMemberships,

      // Current user's relation to this club (dynamic)
      currentUserMembershipStatus: currentUserMembershipStatus,
      currentUserIsAdmin: currentUserIsAdmin,
      pendingMemberships: pendingMemberships,
      
      // Will be empty array if not admin or no pending

      // --- STATIC/MOCK DATA FOR `currentBook`, `history`, `discussions` ---
      // IMPORTANT: These fields are NOT sourced from your current Prisma schema.
      // You need to add corresponding models (e.g., Book, ClubBook, Discussion) and
      // Prisma queries/includes to fetch this data dynamically.
      current_book: club.current_book,
      book_history: club.book_history,
      discussions: discussions,
      meetings: club.meetings,
      
      // Voting cycle management
      voting_cycle_active: club.voting_cycle_active,
      voting_starts_at: club.voting_starts_at,
      voting_ends_at: club.voting_ends_at,
      voting_started_by: club.voting_started_by,
      winning_book_suggestions: winningBookSuggestions,
      // --- END STATIC/MOCK DATA ---
    };

    return NextResponse.json(fullClubDetails, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching club details:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch club details" }, { status: 500 });
  } finally {
    
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  
  try {
    const { id } = await params;
    
    const supabase =  await createClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: `Authentication required ${JSON.stringify(cookies())}` }, { status: 401 });
    }

    // Check if the user is an admin or owner of this club
    const userMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
          club_id: id,
        },
      },
      select: {
        role: true,
        status: true,
      },
    });

    if (!userMembership || userMembership.status !== ClubMembershipStatus.ACTIVE) {
      return NextResponse.json({ error: "You must be an active member of this club" }, { status: 403 });
    }

    if (userMembership.role !== ClubRole.OWNER && userMembership.role !== ClubRole.ADMIN) {
      return NextResponse.json({ error: "Only club owners and admins can edit club details" }, { status: 403 });
    }

    // Parse request body
    const { name, description, genres } = await request.json();

    // Validate input
    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({ error: "Club name must be at least 3 characters long" }, { status: 400 });
    }

    if (description.trim().length < 10) {
      return NextResponse.json({ error: "Club description must be at least 10 characters long" }, { status: 400 });
    }

    // Validate genres if provided
    if (genres && !Array.isArray(genres)) {
      return NextResponse.json({ error: "Genres must be an array" }, { status: 400 });
    }

    // Update the club
    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        genres: genres || [],
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        genres: true,
        updated_at: true,
      },
    });

    return NextResponse.json(updatedClub, { status: 200 });

  } catch (error: any) {
    console.error("Error updating club:", error);
    return NextResponse.json({ error: error.message || "Failed to update club" }, { status: 500 });
  }
}