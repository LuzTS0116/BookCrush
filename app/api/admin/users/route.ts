import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../../../lib/auth-utils';
import { prisma } from '@/lib/prisma';



export async function GET(req: NextRequest) {
  try {
    // Check admin authentication and role
    await requireAdmin();

    const users = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        display_name: true,
        nickname: true,
        about: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            userBooks: true,
            memberships: true,
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    // Handle authentication and authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  } finally {
    
  }
} 