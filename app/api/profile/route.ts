import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatProfileWithAvatarUrlServer } from '@/lib/supabase-server-utils'
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing for books API.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

 

  
  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API profile GET] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API profile GET] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }




    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
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
  } finally {
    
  }
}



export async function POST(req:NextRequest){


if (!supabase) {
    return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
  }

 

  
  try {
    // Bearer token authentication (consistent with other APIs)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API Profile POST] Missing or invalid Authorization header');
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[API Profile POST] Auth error:', userError);
      return NextResponse.json({ error: userError?.message || "Authentication required" }, { status: 401 });
    }
  const payload = await req.json()
  const {
    display_name,
    about,
    favorite_genres = [],
    nickname,
    kindle_email,
    avatar_url
  } = payload

  // Basic validation example (you might want more extensive validation)
  if (!display_name || typeof display_name !== 'string' || display_name.trim() === '') {
    return NextResponse.json(
      { error: 'Validation failed', details: 'Display name is required and must be a non-empty string.' },
      { status: 400 }
    );
  }

  // upsert avoids "duplicate key" if user hits the endpoint twice
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { display_name, about, favorite_genres, nickname, kindle_email, avatar_url },
    create: { id: user.id, display_name, about, favorite_genres, nickname, kindle_email, avatar_url }
  })

  // Format the profile with proper avatar URL for consistency with GET endpoint
  const formattedProfile = await formatProfileWithAvatarUrlServer(supabase!, profile)

  return NextResponse.json(formattedProfile, { status:201 });
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
} finally {
  
}
}