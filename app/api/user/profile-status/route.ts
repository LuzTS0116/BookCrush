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
      select: { id: true }
    });

    return NextResponse.json({ hasProfile: !!profile });
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

    return NextResponse.json({ 
      success: true, 
      profileComplete,
      message: 'Profile status checked. Please refresh your session to update the token.' 
    });
  } catch (error) {
    console.error('Error updating profile status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 