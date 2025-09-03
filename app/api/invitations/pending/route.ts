import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {  ClubMembershipStatus, ClubRole  } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { processAvatarUrl } from '@/utils/supabase/processAvatar';




export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
 
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
  
   

    // Fetch pending invitations for the current user
    const pendingInvitations = await prisma.clubInvitation.findMany({
      where: {
        invitee_id: user.id,
        status: 'PENDING'
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            meetings: { where: { meeting_date: { gt: new Date() } },
              select: {
                id: true,
                meeting_date: true
              }
            },
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
            _count: {
              select: {
                memberships: {
                  where: { status: 'ACTIVE' }
                }
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform the data to match the expected interface
    const formattedInvitations = pendingInvitations.map((invitation: any) => ({
      id: invitation.id,
      club_id: invitation.club_id,
      club_name: invitation.club.name,
      club_description: invitation.club.description,
      inviter_id: invitation.inviter.id,
      inviter_name: invitation.inviter.display_name || 'Unknown User',
      inviter_avatar: processAvatarUrl(invitation.inviter.avatar_url, supabase),
      message: invitation.message,
      created_at: invitation.created_at.toISOString(),
      club: {
        id: invitation.club.id,
        name: invitation.club.name,
        description: invitation.club.description,
        current_book: invitation.club.current_book,
        memberCount: invitation.club._count.memberships,
        meetings: invitation.club.meetings,
        // Include members data for avatars
        members: invitation.club.memberships.map((member: any) => ({
          id: member.user.id,
          display_name: member.user.display_name,
          avatar_url: member.user.avatar_url,
          role: member.role,
          joined_at: member.joined_at,
        })),
      }
    }))

    return NextResponse.json(formattedInvitations, { status: 200 })

  } catch (error) {
    console.error('Error fetching pending invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    
  }
} 