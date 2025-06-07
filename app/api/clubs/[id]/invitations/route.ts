import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = params.id;

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
        error: 'Access denied. Only club admins and owners can view invitations.' 
      }, { status: 403 });
    }

    // Get pending invitations for the club
    const invitations = await prisma.clubInvitation.findMany({
      where: { 
        club_id: clubId,
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: {
            id: true,
            display_name: true
          }
        },
        invitee: {
          select: {
            id: true,
            display_name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Error fetching club invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clubId = params.id;
    const body = await request.json();
    const { user_id, message } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

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
        error: 'Access denied. Only club admins and owners can send invitations.' 
      }, { status: 403 });
    }

    // Check if the club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true }
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Get the user being invited by ID
    const inviteeUser = await prisma.profile.findUnique({
      where: { id: user_id },
      select: { id: true, display_name: true, email: true }
    });

    if (!inviteeUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user_id,
          club_id: clubId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ 
        error: 'User is already a member of this club' 
      }, { status: 400 });
    }

    // Check if invitation already exists for this user
    const existingInvitation = await prisma.clubInvitation.findFirst({
      where: {
        club_id: clubId,
        invitee_id: user_id,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Invitation already sent to this user' 
      }, { status: 400 });
    }

    // Create invitation
    const invitation = await prisma.clubInvitation.create({
      data: {
        club_id: clubId,
        inviter_id: session.user.id,
        invitee_id: user_id,
        email: inviteeUser.email, // Store email for reference but validate by ID
        message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      include: {
        club: {
          select: {
            id: true,
            name: true
          }
        },
        inviter: {
          select: {
            id: true,
            display_name: true
          }
        },
        invitee: {
          select: {
            id: true,
            display_name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      invitation,
      message: `Invitation sent to ${inviteeUser.display_name}!` 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating club invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 