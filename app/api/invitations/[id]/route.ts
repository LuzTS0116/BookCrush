import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function PATCH(
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

    const invitationId = params.id;
    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept" or "decline"' 
      }, { status: 400 });
    }

    // Get the invitation
    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
      include: {
        club: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if the current user is the invitee
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    const isInvitee = invitation.invitee_id === session.user.id || 
                     invitation.email === currentUserProfile?.email;

    if (!isInvitee) {
      return NextResponse.json({ 
        error: 'You are not authorized to respond to this invitation' 
      }, { status: 403 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'This invitation has already been responded to or has expired' 
      }, { status: 400 });
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      await prisma.clubInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 400 });
    }

    if (action === 'accept') {
      // Start a transaction to update invitation and create membership
      const result = await prisma.$transaction(async (tx) => {
        // Update invitation status
        const updatedInvitation = await tx.clubInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' }
        });

        // Check if user is already a member (safety check)
        const existingMembership = await tx.clubMembership.findUnique({
          where: {
            user_id_club_id: {
              user_id: session.user.id,
              club_id: invitation.club_id
            }
          }
        });

        if (existingMembership) {
          throw new Error('User is already a member of this club');
        }

        // Create club membership
        const membership = await tx.clubMembership.create({
          data: {
            user_id: session.user.id,
            club_id: invitation.club_id,
            role: 'MEMBER',
            status: 'ACTIVE'
          }
        });

        // Update club member count
        await tx.club.update({
          where: { id: invitation.club_id },
          data: {
            memberCount: {
              increment: 1
            }
          }
        });

        return { updatedInvitation, membership };
      });

      return NextResponse.json({ 
        success: true, 
        message: `Successfully joined ${invitation.club.name}!`,
        membership: result.membership 
      });

    } else { // decline
      await prisma.clubInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED' }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation declined' 
      });
    }

  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const invitationId = params.id;

    // Get the invitation details
    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            memberCount: true,
            
              
            current_book: {
              select: {
                id: true,
                title: true,
                author: true,
                cover_url: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            display_name: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if the current user is the invitee
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    const isInvitee = invitation.invitee_id === session.user.id || 
                     invitation.email === currentUserProfile?.email;

    if (!isInvitee) {
      return NextResponse.json({ 
        error: 'You are not authorized to view this invitation' 
      }, { status: 403 });
    }

    return NextResponse.json({ invitation });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user_id = session.user.id;

    const { action } = await request.json();
    const invitationId = params.id;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "decline"' }, { status: 400 });
    }

    // Verify the invitation exists and belongs to the current user
    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
      include: { club: true }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.invitee_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized to respond to this invitation' }, { status: 403 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation has already been responded to' }, { status: 400 });
    }

    if (action === 'accept') {
      // Use a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Update invitation status to accepted
        await tx.clubInvitation.update({
          where: { id: invitationId },
          data: { 
            status: 'ACCEPTED',
            updated_at: new Date()
          }
        });

        // Check if user is already a member
        const existingMembership = await tx.clubMembership.findUnique({
          where: {
            user_id_club_id: {
              club_id: invitation.club_id,
              user_id: user_id
            }
          }
        });

        if (!existingMembership) {
          // Create club membership
          await tx.clubMembership.create({
            data: {
              club_id: invitation.club_id,
              user_id: user_id,
              role: 'MEMBER',
              status: 'ACTIVE',
              joined_at: new Date()
            }
          });
        } else if (existingMembership.status !== 'ACTIVE') {
          // Reactivate existing membership
          await tx.clubMembership.update({
            where: { id: existingMembership.id },
            data: {
              status: 'ACTIVE',
              joined_at: new Date()
            }
          });
        }
      });

      return NextResponse.json({ 
        message: 'Invitation accepted successfully',
        club_name: invitation.club.name
      }, { status: 200 });

    } else if (action === 'decline') {
      // Update invitation status to declined
      await prisma.clubInvitation.update({
        where: { id: invitationId },
        data: { 
          status: 'DECLINED',
          updated_at: new Date()
        }
      });

      return NextResponse.json({ 
        message: 'Invitation declined successfully',
        club_name: invitation.club.name
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error handling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    
  }
} 