import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromApiRequest } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // CRITICAL LOG: What cookie header does this API route actually receive?
  const cookieHeader = request.headers.get('cookie');
  console.log('[API /user/check-profile] GET request received. Cookie header:', cookieHeader);

  try {
    const { user, error: authError } = await getUserFromApiRequest(request);

    if (authError || !user) {
      console.warn('[API /user/check-profile] Auth error or no user from getUserFromApiRequest. Error:', authError);
      return NextResponse.json({ error: authError?.message || 'Authentication required' }, { status: 401 });
    }

    // console.log('[API /user/check-profile] User successfully authenticated by getUserFromApiRequest:', user.id);

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true } // Only need to know if it exists
    });

    // console.log('[API /user/check-profile] Profile lookup result:', profile);
    return NextResponse.json({ hasProfile: !!profile });

  } catch (error: any) {
    console.error('[API /user/check-profile] Internal catch block error:', error.message);
    return NextResponse.json({ error: 'Internal server error in check-profile' }, { status: 500 });
  }
} 