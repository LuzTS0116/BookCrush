import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@/lib/generated/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req:NextRequest){
// const { display_name, about } = await req.json();
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
  const payload = await req.json()
  const {
    display_name,
    about,
    favorite_genres = [],
    kindle_email
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
    update: { display_name, about, favorite_genres, kindle_email },
    create: { id: user.id, display_name, about, favorite_genres, kindle_email }
  })

  return NextResponse.json(profile, { status:201 });
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