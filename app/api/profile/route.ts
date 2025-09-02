import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import {createClient} from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { formatProfileWithAvatarUrlServer } from '@/lib/supabase-server-utils'
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Try to get user from cookies first
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    
    if (userError || !user) {
          console.error('[API profile GET] Auth failed:', userError);
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      } 
    

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        display_name: true, // This is now the username
        full_name: true,
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
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found', details: 'User profile does not exist.' },
        { status: 404 }
      )
    }

    // Format the profile with proper avatar URL
    const formattedProfile = await formatProfileWithAvatarUrlServer(supabase!, profile)

    return NextResponse.json(formattedProfile, { status: 200 });
  } catch (error: any) {
    console.error('[API /profile GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    // Try to get user from cookies first
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[API profile GET] Auth failed:', userError);
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  } 

    const payload = await req.json()
    const {
      display_name, // This is now the username
      full_name,    // Optional real name
      about,
      favorite_genres = [],
      kindle_email,
      avatar_url,
      email          // Email from session
    } = payload

    // Basic validation for username (display_name)
    if (!display_name || typeof display_name !== 'string' || display_name.trim() === '') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Username is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Username format validation
    if (display_name.length < 3) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(display_name)) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Username can only contain letters, numbers, dots, hyphens, and underscores.' },
        { status: 400 }
      );
    }

    // upsert avoids "duplicate key" if user hits the endpoint twice
    // Note: Need to regenerate Prisma client first: npx prisma generate
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: { display_name, about, favorite_genres, kindle_email, avatar_url, full_name, email },
      create: { id: user.id, display_name, about, favorite_genres, kindle_email, avatar_url, full_name, email }
    })

    // Format the profile with proper avatar URL for consistency with GET endpoint
    const formattedProfile = await formatProfileWithAvatarUrlServer(supabase, profile)

    // Set a temporary cookie to bypass middleware profile check for smooth redirect
    const response = NextResponse.json(formattedProfile, { status: 201 });
    response.cookies.set('profile-complete-bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 // 1 minute - enough time for the redirect to happen
    });

    return response;
  } catch (error: any) {
    console.error('[API /profile POST] Error:', error); // Log the full error server-side

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma-specific errors
      let details = `Prisma error code: ${error.code}`;
      if (error.meta && error.meta.target) {
        details += `, Target: ${error.meta.target}`;
      }
      // Add more specific messages based on error.code if needed
      // e.g., P2002 for unique constraint violation
      return NextResponse.json(
        { error: 'Database operation failed', details }, 
        { status: 409 } // Conflict or Bad Request depending on the error
      );
    } else if (error.name === 'SyntaxError') {
        // Error parsing JSON payload
        return NextResponse.json(
            { error: 'Invalid request payload', details: 'Failed to parse JSON body.' }, 
            { status: 400 }
        );
    } else {
      // Generic error
      return NextResponse.json(
        { error: 'Failed to save profile', details: error.message || 'An unexpected error occurred.' }, 
        { status: 500 }
      );
    }
  }
}