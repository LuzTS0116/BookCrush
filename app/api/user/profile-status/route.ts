import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Assuming this is your configured admin client
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token format' }, { status: 401 });
  }

  try {
    // Validate the token and get the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error('[API /profile-status] Error getting user from token:', userError?.message);
      return NextResponse.json({ error: userError?.message || 'Invalid token' }, { status: 401 });
    }

    // Check if a profile exists for this user

      const profile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    console.log('Prisma Profile check API response:', { hasProfile: !!profile });
    return NextResponse.json({ hasProfile: !!profile });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError)
    console.error('[API /profile-status] Unexpected Prisma error code:', error.code);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 