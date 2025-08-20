import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';




export async function GET(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    const {id} = await params;
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Check if user is an admin or owner of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: session.user.id,
          club_id: clubId
        }
      }
    });

    if (!membership || membership.status !== 'ACTIVE' || !['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Access denied. Only club admins and owners can search for users to invite.' 
      }, { status: 403 });
    }

    // Get existing club members
    const existingMembers = await prisma.clubMembership.findMany({
      where: { club_id: clubId },
      select: { user_id: true }
    });

    const memberIds = existingMembers.map(m => m.user_id);

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

    // Get users with pending invitations
    const pendingInvitations = await prisma.clubInvitation.findMany({
      where: { 
        club_id: clubId,
        status: 'PENDING'
      },
      select: { invitee_id: true}
    });

    const pendingInviteeIds = pendingInvitations
      .filter(inv => inv.invitee_id)
      .map(inv => inv.invitee_id!);

    

    // Search for users excluding current members, pending invitees, and current user
    const excludedIds = [...memberIds, ...pendingInviteeIds, session.user.id];

    const users = await prisma.profile.findMany({
      where: {
        id: {
          notIn: excludedIds
        },
        
        AND: query ? [
          {
            OR: [
              {
                display_name: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                full_name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ] : []
      },
      select: {
        id: true,
        display_name: true,
        full_name: true, // Include full_name for search
        avatar_url: true,
        about: true
      },
      take: 20, // Limit results
      orderBy: {
        display_name: 'asc'
      }
    });

    // Format users with initials for frontend
    const formattedUsers = users.map(user => ({
      ...user,
      avatar_url: processAvatarUrl(user.avatar_url),
      initials: user.display_name
        .split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }));

    return NextResponse.json({ users: formattedUsers });

  } catch (error) {
    console.error('Error searching users for club invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
} 