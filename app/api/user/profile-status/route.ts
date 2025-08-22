import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await response.json();

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, display_name: true }
    });

    const profileComplete = !!profile && !!profile.display_name;

    return NextResponse.json({ profileComplete });
  } catch (error) {
    console.error('Error checking profile status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// New POST method to refresh profile status in NextAuth token
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  // Get the email from request body (if provided) - do this first
  const body = await request.json().catch(() => ({}));
  const { email, userId } = body;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await response.json();

    // Find or create profile with basic info
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, display_name: true, email: true }
    });

    // If profile doesn't exist, create a minimal one with email
    if (!profile && email) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: email,
          display_name: '', // Will be set during profile setup
          about: '',
          favorite_genres: [],
          role: 'USER'
        },
        select: { id: true, display_name: true, email: true }
      });
    }

    const profileComplete = !!profile && !!profile.display_name;

    return NextResponse.json({ 
      success: true, 
      profileComplete,
      profileExists: !!profile,
      message: profileComplete 
        ? 'Profile is complete' 
        : profile 
          ? 'Profile exists but incomplete - redirecting to setup'
          : 'Profile status checked. Please refresh your session to update the token.' 
    });
  } catch (error) {
    console.error('Error updating profile status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 