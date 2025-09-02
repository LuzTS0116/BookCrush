import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer directly using cookies here
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Using standard client
 // Standard Supabase client
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client'
import {  ClubMembershipStatus, ClubRole  } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';






// Create a single Supabase client instance




export async function GET(req: NextRequest) {

  const supabase = await createClient();

  // Optimized avatar URL processing function - SYNCHRONOUS, NO ASYNC CALLS
function processAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  
  // If already a full URL (Google avatars, etc.), return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Convert relative path to public URL synchronously
  if (supabase) {
    const { data } = supabase.storage.from('profiles').getPublicUrl(avatarPath);
    return data.publicUrl;
  }
  
  return null;
}


  if (!supabase) {
    console.error('[API my-clubs] Supabase client not initialized');
    return NextResponse.json({ error: "Supabase client not initialized. Check server configuration." }, { status: 500 });
  }
  try {
       
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API books POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API books POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }
    
    const userMemberships = await prisma.clubMembership.findMany({
      where: {
        user_id: user.id,
        status: {
          in: [ClubMembershipStatus.ACTIVE],
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            owner_id: true,
            memberCount: true,
            genres: true,
            current_book: {
              select: {
                id: true,
                title: true,
                author: true,
                cover_url: true,
                pages: true,
                reading_time: true,
                genres: true,
              }
            },
            meetings: { where: { meeting_date: { gt: new Date() } },
              select: {
                id: true,
                meeting_date: true
              }
            },
            // Add memberships for real member avatars
            memberships: {
              where: {
                status: ClubMembershipStatus.ACTIVE,
              },
              select: {
                user_id: true,
                role: true,
                joined_at: true,
                user: {
                  select: {
                    id: true,
                    display_name: true,
                    
                    avatar_url: true,
                  },
                },
              },
              orderBy: [
                { role: 'desc' }, // Owners and admins first
                { joined_at: 'asc' }, // Then by join date
              ],
            },
          },
        },
      },
    });

    // PERFORMANCE FIX: Process data synchronously - NO MORE ASYNC OPERATIONS!
    const clubsWithStatus = userMemberships.map(membership => ({
      id: membership.club.id,
      name: membership.club.name,
      description: membership.club.description,
      ownerId: membership.club.owner_id,
      memberCount: membership.club.memberCount,
      membershipStatus: membership.status,
      role: membership.role,
      genres: membership.club.genres,
      // Corrected admin check
      admin: membership.club.owner_id === user.id,
      current_book: membership.club.current_book,
      meetings: membership.club.meetings,
      // PERFORMANCE FIX: Process member avatars synchronously instead of async
      members: membership.club.memberships.map(member => ({
        id: member.user.id,
        display_name: member.user.display_name,
        
        avatar_url: processAvatarUrl(member.user.avatar_url), // Synchronous processing!
        role: member.role,
        joined_at: member.joined_at,
      })),
    }));

    // console.log('[API my-clubs] Returning response:', { clubCount: clubsWithStatus.length });
    return NextResponse.json(clubsWithStatus, { status: 200 });

  } catch (error: any) {
    console.error("[API my-clubs] Error fetching user's clubs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user's clubs" }, { status: 500 });
  } finally {
    
  }
}