import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { canViewProfile, getPublicProfileData } from '@/lib/friendship-utils'
import { formatProfileWithAvatarUrlServer } from '@/lib/supabase-server-utils'

export async function GET(request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
 ) {
 
  const {id} = await params; 

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated', details: 'No active user session.' },
      { status: 401 }
    )
  }

  const prisma = new PrismaClient()
  try {
    // Check if the user can view this profile (own profile or friend's profile)
    const hasAccess = await canViewProfile(prisma, user.id, id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied', details: 'You can only view profiles of users who are your friends.' },
        { status: 403 }
      )
    }

    // If user is viewing their own profile, return full data
    if (user.id === id) {
      const profile = await prisma.profile.findUnique({
        where: { id: id }
      })

      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found', details: 'User profile does not exist.' },
          { status: 404 }
        )
      }

      // Format the profile with proper avatar URL
      const formattedProfile = await formatProfileWithAvatarUrlServer(profile)
      return NextResponse.json(formattedProfile, { status: 200 });
    }

    // If viewing a friend's profile, return public data only
    const publicProfile = await getPublicProfileData(prisma, id)

    if (!publicProfile) {
      return NextResponse.json(
        { error: 'Profile not found', details: 'User profile does not exist.' },
        { status: 404 }
      )
    }

    // Format the public profile with proper avatar URL
    const formattedPublicProfile = await formatProfileWithAvatarUrlServer(publicProfile)
    return NextResponse.json(formattedPublicProfile, { status: 200 });
  } catch (error: any) {
    console.error('[API /profile/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect()
  }
}