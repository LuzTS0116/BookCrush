import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // CRITICAL LOG: What cookie header does this API route actually receive?
  const cookieHeader = request.headers.get('cookie');
  console.log('[API /user/check-profile] GET request received. Cookie header:', cookieHeader);

  try {
    // Use NextAuth's getToken instead of getUserFromApiRequest
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      console.warn('[API /user/check-profile] No valid NextAuth token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[API /user/check-profile] User successfully authenticated via NextAuth:', token.id);

    const profile = await prisma.profile.findUnique({
      where: { id: token.id as string },
      select: { 
        id: true,
        role: true,
        display_name: true,
        email: true
      }
    });

    console.log('[API /user/check-profile] Profile lookup result:', profile);
    return NextResponse.json({ 
      hasProfile: !!profile,
      role: profile?.role || 'USER',
      display_name: profile?.display_name,
      email: profile?.email
    });

  } catch (error: any) {
    console.error('[API /user/check-profile] Internal catch block error:', error.message);
    return NextResponse.json({ error: 'Internal server error in check-profile' }, { status: 500 });
  }
} 