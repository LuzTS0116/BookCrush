// /app/api/clubs/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { PrismaClient } from '@/lib/generated/prisma';
import { ClubRole, ClubMembershipStatus } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
   { params }: { params: Promise<{ id: string }> }
) {

   const {id} = await params; 
  
  try {

    if (!id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    // Although authentication is not strictly required to *view* a public club,
    // it's required to determine the user's specific membership status and admin rights.
    // If not authenticated, we'll return a basic club view without user-specific data.
    const isAuthenticated = !!user;
    let currentUserMembershipStatus: ClubMembershipStatus | null = null;
    let currentUserIsAdmin = false;
    let pendingMemberships: any[] = []; // Initialize as empty, fetch only if admin

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
            reading_time: true,
            pages: true,
            
            //name: true, // Assuming your User model has a 'name' field
          },
        },
        book_history: {
          select: {
            id: true,
            status: true,
            started_at: true,
            finished_at: true,
            book: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // 2. If authenticated, determine current user's membership status and role for THIS club
    if (isAuthenticated) {
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
              //name: true, // Assuming your User model has a 'name' field
            },
          },
        },
      });

      pendingMemberships = pending.map(m => ({
        id: m.id,
        userId: m.user.id,
        userName: m.user.name || m.user.email, // Fallback to email if no name
        userAvatar: null, // Replace with actual avatar URL from user if available in your User model
        userInitials: (m.user.name ? m.user.name.split(' ').map(n => n[0]).join('') : m.user.email?.substring(0, 2) || '??').toUpperCase(),
        appliedAt: m.joined_at.toISOString(),
        status: m.status,
      }));
    }

    // 4. Construct the full club details response
    const fullClubDetails = {
      id: club.id,
      name: club.name,
      description: club.description,
      memberCount: club.memberCount,
      owner_id: club.owner_id, // Club owner's ID

      // Current user's relation to this club (dynamic)
      currentUserMembershipStatus: currentUserMembershipStatus,
      currentUserIsAdmin: currentUserIsAdmin,
      pendingMemberships: pendingMemberships, // Will be empty array if not admin or no pending

      // --- STATIC/MOCK DATA FOR `currentBook`, `history`, `discussions` ---
      // IMPORTANT: These fields are NOT sourced from your current Prisma schema.
      // You need to add corresponding models (e.g., Book, ClubBook, Discussion) and
      // Prisma queries/includes to fetch this data dynamically.
      current_book: club.current_book,
      book_history: club.book_history,
      discussions: [ // Placeholder
        {
          user: { name: "Alex Lee", avatar: "/placeholder.svg?height=40&width=40", initials: "AL", },
          text: "I'm about halfway through and loving the concept. The idea of a library between life and death is so creative!",
          timestamp: "2 days ago",
        },
        {
          user: { name: "Sarah Johnson", avatar: "/placeholder.svg?height=40&width=40", initials: "SJ", },
          text: "The way Matt Haig explores regret and alternate lives is really making me think about my own choices. Can't wait to discuss this at our meeting.",
          timestamp: "Yesterday",
        },
        {
          user: { name: "Jane Doe", avatar: "/placeholder.svg?height=40&width=40", initials: "JD", },
          text: "Just finished chapter 15. The scene with her father was so moving. Anyone else tear up at that part?",
          timestamp: "5 hours ago",
        },
      ],
      // --- END STATIC/MOCK DATA ---
    };

    return NextResponse.json(fullClubDetails, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching club details:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch club details" }, { status: 500 });
  }
}