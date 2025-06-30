import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvatarPublicUrlServer } from '@/lib/supabase-server-utils';
import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

    const {id} = await params;
  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = request.headers.get('Authorization');
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

    const clubId = id;

    // Check if user is an admin or owner of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
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
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    
    // Format invitations with proper avatar URLs
    const formattedInvitations = await Promise.all(invitations.map(async (invitation) => {
      if (invitation.invitee) {
        return {
          ...invitation,
          invitee: {
            ...invitation.invitee,
            avatar_url: await getAvatarPublicUrlServer(supabase!, invitation.invitee.avatar_url)
          }
        };
      }
      return invitation;
    }));

    

    return NextResponse.json({ invitations: formattedInvitations });

  } catch (error) {
    console.error('Error fetching club invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
}

export async function POST(
  request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {

    if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

    const {id} = await params;
  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = request.headers.get('Authorization');
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

    const clubId = id;
    const body = await request.json();
    const { user_id, message } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is an admin or owner of the club
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: {
          user_id: user.id,
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
        inviter_id: user.id,
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
  } finally {
    
  }
} 