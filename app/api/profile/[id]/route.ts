import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { getPublicProfileData } from '@/lib/friendship-utils';
import { canViewProfile } from '@/lib/friendship-utils';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the requesting user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Get the profile ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // 3. Check if the requesting user can view the profile
    const canView = await canViewProfile(prisma, user.id, id);
    if (!canView) {
      return NextResponse.json({ error: "You do not have permission to view this profile" }, { status: 403 });
    }

    // 3. Fetch the requested user's profile (only public information)
    const profile = await prisma.profile.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        display_name: true,
        nickname: true,
        avatar_url: true,
        about: true,
        favorite_genres: true,
        userBooks: {
          include: {
            book: true // Include the full book details
          }
        },
        addedBooks: true,
        //how many memberships
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' }
            },
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          }
        }
        // Don't include sensitive information like email or kindle_email
        // Only include what should be publicly visible
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}